import threading
import uuid
from typing import Optional
import logging

import grpc

logger = logging.getLogger(__name__)


class JobCancellationChecker:
    """Simple gRPC-compatible job cancellation manager"""
    
    def __init__(self):
        self.active_jobs = {}
        self.cancelled_jobs = set()
        self._lock = threading.Lock()
    
    def start_job(self, job_id: str):
        """Start tracking a new job"""
        with self._lock:
            self.active_jobs[job_id] = threading.Event()
    
    def check_cancellation(self, job_id: str) -> bool:
        """Check if a job has been cancelled"""
        with self._lock:
            return job_id in self.cancelled_jobs
    
    def cancel_job(self, job_id: str):
        """Cancel a specific job"""
        with self._lock:
            self.cancelled_jobs.add(job_id)
            if job_id in self.active_jobs:
                self.active_jobs[job_id].set()
    
    def complete_job(self, job_id: str):
        """Mark a job as completed and clean up"""
        with self._lock:
            self.active_jobs.pop(job_id, None)
            self.cancelled_jobs.discard(job_id)

    def handle_cancellation(self, job_id: str, context: grpc.ServicerContext) -> bool:
        """
        Handle cancellation for gRPC endpoints
        
        Args:
            job_id: Unique job identifier  
            context: gRPC ServicerContext for cancellation detection
            
        Returns:
            bool: True if job should be cancelled, False to continue
        """
        # Generate job_id if not provided
        if not job_id:
            job_id = str(uuid.uuid4())
        
        # Start tracking the job
        self.start_job(job_id)
        
        # For synchronous gRPC, we need to use a callback-based approach
        # Set up cancellation detection using context callback
        cancelled_event = threading.Event()
        
        def on_rpc_done():
            """Called when RPC is terminated (including cancellation)"""
            cancelled_event.set()
            # We can't distinguish between normal completion and cancellation
            # in the callback, so we'll mark as potentially cancelled
            self.cancel_job(job_id)
        
        try:
            context.add_callback(on_rpc_done)
        except Exception as e:
            logger.warning(f"Could not add callback for cancellation detection: {e}")
        
        # Check if already cancelled (callback might have fired immediately)
        if cancelled_event.is_set() or self.check_cancellation(job_id):
            context.set_code(grpc.StatusCode.CANCELLED)
            context.set_details(f"Job {job_id} was cancelled")
            return True
        
        return False

    def handle_cancellation_simple(self, job_id: str) -> bool:
        """
        Simple cancellation check without gRPC context
        Use this if you only need to check manual cancellation
        """
        if not job_id:
            return False
            
        return self.check_cancellation(job_id)

    def setup_cancellation_monitoring(self, job_id: str, context: grpc.ServicerContext) -> threading.Event:
        """
        Set up cancellation monitoring and return an event that gets set on cancellation
        This is the recommended approach for long-running operations
        
        Usage:
        stop_event = job_checker.setup_cancellation_monitoring(job_id, context)
        
        # In your long-running loop:
        while not stop_event.is_set():
            # Do work
            if stop_event.is_set():
                break
        """
        # Generate job_id if not provided
        if not job_id:
            job_id = str(uuid.uuid4())
        
        # Start tracking the job
        self.start_job(job_id)
        
        # Create a stop event
        stop_event = threading.Event()
        
        def on_rpc_done():
            """Called when RPC is terminated"""
            self.cancel_job(job_id)
            stop_event.set()
        
        try:
            context.add_callback(on_rpc_done)
        except Exception as e:
            logger.warning(f"Could not add callback for cancellation detection: {e}")
        
        return stop_event


# Global job checker instance
job_checker = JobCancellationChecker()