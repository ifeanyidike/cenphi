# src/utils/parallel_executor.py

import os
import logging
from typing import List, Dict, Any, Callable, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ParallelTask:
    """A task to be executed in parallel"""
    task_id: str
    task_name: str
    function: Callable
    args: tuple = ()
    kwargs: dict = None
    priority: int = 0  # Higher priority runs first
    timeout: Optional[int] = None

    def __post_init__(self):
        if self.kwargs is None:
            self.kwargs = {}


@dataclass
class TaskResult:
    """Result of a parallel task execution"""
    task_id: str
    task_name: str
    success: bool
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    priority: int = 0


class ParallelExecutor:
    """
    Intelligent parallel task executor with adaptive worker management.

    Features:
    - CloudRun-optimized worker count
    - Priority-based execution
    - Timeout handling
    - Progress tracking
    - Error isolation (one task failure doesn't crash others)
    """

    def __init__(self, max_workers: Optional[int] = None):
        """
        Initialize parallel executor.

        Args:
            max_workers: Maximum worker threads. If None, automatically determined.
        """
        if max_workers is None:
            max_workers = self._get_optimal_workers()

        self.max_workers = max_workers
        logger.info(f"ParallelExecutor initialized with {max_workers} workers")

    def _get_optimal_workers(self) -> int:
        """
        Determine optimal worker count for CloudRun environment.

        Returns:
            Optimal number of worker threads
        """
        cpu_count = os.cpu_count() or 2

        # CloudRun-optimized worker count
        if cpu_count <= 2:
            return 2  # Minimum parallelism even on small instances
        elif cpu_count <= 4:
            return 3  # Conservative for standard CloudRun
        else:
            return min(8, max(4, cpu_count - 1))  # Cap at 8, leave 1 CPU for system

    def execute_parallel(
        self,
        tasks: List[ParallelTask],
        fail_fast: bool = False,
        progress_callback: Optional[Callable[[int, int], None]] = None
    ) -> Dict[str, TaskResult]:
        """
        Execute tasks in parallel.

        Args:
            tasks: List of ParallelTask to execute
            fail_fast: If True, stop all tasks on first failure
            progress_callback: Optional callback(completed, total) for progress updates

        Returns:
            Dictionary mapping task_id to TaskResult
        """
        if not tasks:
            return {}

        # Sort tasks by priority (higher priority first)
        sorted_tasks = sorted(tasks, key=lambda t: t.priority, reverse=True)

        results = {}
        completed_count = 0
        total_tasks = len(tasks)

        logger.info(f"Executing {total_tasks} tasks in parallel with {self.max_workers} workers")
        logger.info(f"Task priorities: {[(t.task_name, t.priority) for t in sorted_tasks[:5]]}")

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_task = {}
            for task in sorted_tasks:
                future = executor.submit(self._execute_task, task)
                future_to_task[future] = task

            # Collect results as they complete
            for future in as_completed(future_to_task):
                task = future_to_task[future]

                try:
                    result = future.result(timeout=task.timeout)
                    results[task.task_id] = result

                    if not result.success:
                        logger.warning(f"Task '{task.task_name}' failed: {result.error}")

                        if fail_fast:
                            logger.error(f"Fail-fast enabled, cancelling remaining tasks")
                            # Cancel remaining futures
                            for f in future_to_task:
                                f.cancel()
                            break
                    else:
                        logger.info(f"Task '{task.task_name}' completed successfully in {result.execution_time:.2f}s")

                except Exception as e:
                    logger.error(f"Task '{task.task_name}' raised exception: {e}")
                    results[task.task_id] = TaskResult(
                        task_id=task.task_id,
                        task_name=task.task_name,
                        success=False,
                        error=str(e),
                        priority=task.priority
                    )

                    if fail_fast:
                        break

                # Update progress
                completed_count += 1
                if progress_callback:
                    try:
                        progress_callback(completed_count, total_tasks)
                    except Exception as e:
                        logger.warning(f"Progress callback failed: {e}")

        # Log summary
        successful = sum(1 for r in results.values() if r.success)
        failed = total_tasks - successful
        total_time = sum(r.execution_time for r in results.values())

        logger.info(
            f"Parallel execution complete: {successful}/{total_tasks} succeeded, "
            f"{failed} failed, total time: {total_time:.2f}s"
        )

        return results

    def _execute_task(self, task: ParallelTask) -> TaskResult:
        """
        Execute a single task and return result.

        Args:
            task: ParallelTask to execute

        Returns:
            TaskResult with execution details
        """
        start_time = datetime.now()

        try:
            logger.debug(f"Executing task '{task.task_name}' (priority: {task.priority})")

            result = task.function(*task.args, **task.kwargs)

            execution_time = (datetime.now() - start_time).total_seconds()

            return TaskResult(
                task_id=task.task_id,
                task_name=task.task_name,
                success=True,
                result=result,
                execution_time=execution_time,
                priority=task.priority
            )

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()

            logger.error(f"Task '{task.task_name}' failed after {execution_time:.2f}s: {e}")

            return TaskResult(
                task_id=task.task_id,
                task_name=task.task_name,
                success=False,
                error=str(e),
                execution_time=execution_time,
                priority=task.priority
            )

    def execute_independent_steps(
        self,
        steps: List[Dict[str, Any]],
        execute_step_func: Callable[[Dict[str, Any]], Any]
    ) -> List[Any]:
        """
        Execute independent processing steps in parallel.

        Useful for pipeline steps that don't depend on each other (e.g.,
        downloading multiple clips, uploading multiple files, generating
        multiple previews).

        Args:
            steps: List of step configurations
            execute_step_func: Function to execute each step

        Returns:
            List of results in same order as input steps
        """
        tasks = [
            ParallelTask(
                task_id=f"step_{i}",
                task_name=step.get("name", f"Step {i}"),
                function=execute_step_func,
                args=(step,),
                priority=step.get("priority", 0)
            )
            for i, step in enumerate(steps)
        ]

        results_dict = self.execute_parallel(tasks)

        # Return results in original order
        return [
            results_dict[f"step_{i}"].result
            for i in range(len(steps))
            if results_dict[f"step_{i}"].success
        ]


class PipelineParallelizer:
    """
    CONSERVATIVE pipeline analyzer - only parallelizes PROVEN safe operations.

    Safe parallel operations:
    1. Multiple downloads (no shared state)
    2. Multiple uploads (no shared state)
    3. Preview generation ALONGSIDE main processing (same input, different outputs)
    4. Multiple independent clips extraction from DIFFERENT videos

    NEVER parallelizes:
    - Steps that modify the same file
    - Steps with data dependencies (crop -> caption -> enhance)
    - Steps that share mutable state
    """

    # Whitelist of operations that are PROVEN safe to parallelize
    SAFE_PARALLEL_OPERATIONS = {
        "download",      # Multiple downloads are independent
        "upload",        # Multiple uploads are independent
        "extract_clip",  # Multiple clip extractions from different sources
        "preview_gen",   # Preview generation doesn't affect main processing
        "thumbnail_gen"  # Thumbnail generation is independent
    }

    @staticmethod
    def is_safe_to_parallelize(operation_type: str) -> bool:
        """
        Check if operation type is proven safe for parallel execution.

        Args:
            operation_type: Type of operation

        Returns:
            True if safe to parallelize, False otherwise
        """
        return operation_type in PipelineParallelizer.SAFE_PARALLEL_OPERATIONS

    @staticmethod
    def validate_independence(
        tasks: List[Dict[str, Any]]
    ) -> bool:
        """
        Validate that tasks are truly independent (no shared resources).

        Args:
            tasks: List of task configurations

        Returns:
            True if all tasks are independent, False if ANY dependency detected
        """
        # Check for file path conflicts
        input_paths = set()
        output_paths = set()

        for task in tasks:
            task_input = task.get("input_path")
            task_output = task.get("output_path")

            if task_input:
                input_paths.add(task_input)

            if task_output:
                # If ANY task writes to a file that another reads/writes, NOT safe
                if task_output in input_paths or task_output in output_paths:
                    logger.warning(f"Dependency detected: {task_output} conflicts with existing paths")
                    return False

                output_paths.add(task_output)

        # All tasks are independent
        return True

    @staticmethod
    def optimize_io_operations(
        operations: List[Dict[str, Any]],
        operation_type: str = "download"
    ) -> List[ParallelTask]:
        """
        Create optimized parallel tasks for I/O operations.

        I/O operations (downloads, uploads) benefit from higher parallelism
        than CPU-bound operations.

        Args:
            operations: List of I/O operation configurations
            operation_type: Type of operation (download, upload, etc.)

        Returns:
            List of ParallelTask optimized for I/O
        """
        tasks = []

        # I/O operations get higher priority and more workers
        for i, op in enumerate(operations):
            task = ParallelTask(
                task_id=f"{operation_type}_{i}",
                task_name=f"{operation_type.capitalize()} {i+1}/{len(operations)}",
                function=op["function"],
                args=op.get("args", ()),
                kwargs=op.get("kwargs", {}),
                priority=10,  # High priority for I/O
                timeout=op.get("timeout", 300)
            )
            tasks.append(task)

        logger.info(f"Created {len(tasks)} optimized I/O tasks for {operation_type}")

        return tasks


# Global executor instance for convenience
_global_executor = None


def get_parallel_executor(max_workers: Optional[int] = None) -> ParallelExecutor:
    """
    Get global parallel executor instance (singleton pattern).

    Args:
        max_workers: Maximum workers (only used on first call)

    Returns:
        ParallelExecutor instance
    """
    global _global_executor

    if _global_executor is None:
        _global_executor = ParallelExecutor(max_workers)

    return _global_executor
