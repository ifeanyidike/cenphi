"""
gRPC Helper Functions
Shared utilities for reducing code duplication in main.py
"""

import uuid
import logging
import grpc

logger = logging.getLogger(__name__)


def initialize_job_id(request):
    """
    Extract or generate job ID from request.

    Args:
        request: gRPC request with optional job_id field

    Returns:
        str: Existing job_id or newly generated UUID
    """
    return request.job_id or str(uuid.uuid4())


def handle_job_cancellation(job_id, context, job_checker, response_class):
    """
    Handle job cancellation uniformly across all gRPC methods.

    Args:
        job_id: Job ID to check for cancellation
        context: gRPC context
        job_checker: JobCancellationManager instance
        response_class: Protobuf response class to instantiate

    Returns:
        tuple: (is_cancelled, response) - response is None if not cancelled
    """
    if job_checker.handle_cancellation(job_id, context):
        return True, response_class(error="Job cancelled")
    return False, None


def handle_grpc_error(error, operation_name, job_id, context, job_checker, response_class):
    """
    Handle gRPC errors uniformly with proper logging and cleanup.

    Args:
        error: The exception object
        operation_name: Name of the operation for logging (e.g., "Media enhancement")
        job_id: Job ID for cleanup
        context: gRPC context
        job_checker: JobCancellationManager instance
        response_class: Protobuf response class to instantiate

    Returns:
        Protobuf response with error set
    """
    error_msg = f"{operation_name} error: {str(error)}"
    logger.error(f"❌ {error_msg}")
    context.set_code(grpc.StatusCode.INTERNAL)
    context.set_details(error_msg)
    job_checker.complete_job(job_id)
    return response_class(error=error_msg)


def complete_and_log_job(job_id, operation_name, job_checker, additional_info=""):
    """
    Complete job and log completion with consistent formatting.

    Args:
        job_id: Job ID to complete
        operation_name: Name of the operation (e.g., "Media enhancement")
        job_checker: JobCancellationManager instance
        additional_info: Optional additional info for logging
    """
    job_checker.complete_job(job_id)
    log_msg = f"✅ {operation_name} completed: {job_id}"
    if additional_info:
        log_msg += f" - {additional_info}"
    logger.info(log_msg)


def convert_clip_protobuf_to_dict(clip):
    """
    Convert protobuf Clip message to dictionary.

    Args:
        clip: Protobuf Clip message

    Returns:
        dict: Dictionary representation of the clip
    """
    return {
        "clip_id": clip.clip_id,
        "testimonial_id": clip.testimonial_id,
        "storage_path": clip.storage_path,
        "preview_url": clip.preview_url,
        "start_time": clip.start_time,
        "end_time": clip.end_time,
        "duration": clip.duration,
        "highlight_type": clip.highlight_type,
        "text_content": clip.text_content
    }


def build_hook_candidate_response(hook, detector, hook_candidate_class):
    """
    Convert hook object to protobuf HookCandidate response.

    Args:
        hook: Hook object from detector
        detector: HookDetector instance
        hook_candidate_class: Protobuf HookCandidate class

    Returns:
        Populated HookCandidate protobuf message
    """
    hook_pb = hook_candidate_class()
    hook_pb.start_time = hook.start_time
    hook_pb.end_time = hook.end_time
    hook_pb.text = hook.text
    hook_pb.hook_type = hook.hook_type
    hook_pb.engagement_score = hook.engagement_score
    hook_pb.placement_recommendation = hook.placement_recommendation
    hook_pb.reasoning = hook.reasoning

    for keyword in hook.keywords:
        hook_pb.keywords.append(keyword)

    cut_timing = detector.create_hook_cut(hook)
    hook_pb.cut_timing.start_time = cut_timing["start_time"]
    hook_pb.cut_timing.end_time = cut_timing["end_time"]
    hook_pb.cut_timing.original_start = cut_timing["original_start"]
    hook_pb.cut_timing.original_end = cut_timing["original_end"]

    return hook_pb
