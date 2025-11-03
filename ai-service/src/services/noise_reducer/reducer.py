import os
import uuid
import logging
from typing import List, Dict
import intelligence_pb2

logger = logging.getLogger(__name__)
class NoiseReducer:
    def __init__(self):
        self._file_manager = None
        self._noise_service = None
        self._storage_manager = None

    @property
    def file_manager(self):
        """Get the file manager instance."""
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager
    
    @property
    def storage_manager(self):
        """Get the storage manager instance."""
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    
    @property
    def noise_service(self):
        """Get the noise reduction service instance."""
        if self._noise_service is None:
            from ..shared.noise_service import NoiseService
            self._noise_service = NoiseService()
        return self._noise_service
    

    def batch_process(self, options: List[Dict[str, str]], level="medium"):
        """ Process a batch of noise reduction requests use thread executor.
        Args:
            options: List of dictionaries where each dictionary contains:
                - testimonial_id: Unique identifier for the testimonial
                - media_url: Path to source media OR URL
            level: Noise reduction level (e.g., "low", "medium", "high")
        
        Returns:
            List of dictionaries with processed results.
        """
        results = []
        from concurrent.futures import ThreadPoolExecutor, as_completed
        optimal_workers = min(8, max(2, os.cpu_count() - 1))
        with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
            future_to_option = {
                executor.submit(
                    self.process, 
                    option.get('media_url'), 
                    level,
                ): option for option in options}
            for future in as_completed(future_to_option):
                option = future_to_option[future]
                try:
                    result = future.result()
                    results.append({
                        "testimonial_id": option.get('testimonial_id', 'unknown'),
                        "denoised_media_url": result.get("media_url", ""),
                        "error": result.get("error", "")
                    })
                except Exception as e:
                    logger.error(f"Noise reduction failed for {option['media_url']}: {e}")
                    results.append({
                        "testimonial_id": option.get('testimonial_id', 'unknown'),
                        "denoised_media_url": option['media_url'],
                        "error": str(e)
                    })
        return results  


    def process(self, testimonial_id: str, media_url: str, level: str = "medium", job_id: str = None):
        """
        Process noise reduction for a media_url.

        Args:
            options: List of dictionaries where each dictionary contains:
                - testimonial_id: Unique identifier for the testimonial
                - media_url: Path to source media OR URL

        Returns:
            List of dictionaries with processed results.
        """
        temp_files = []
        try:
            # Validate media_url
            if not media_url:
                raise ValueError("Invalid media url")

            # NOTE: Caching disabled - each platform optimization needs independent denoising
            # since the same video processed for different platforms (e.g., 16:9 vs 9:16)
            # will have different dimensions after cropping, requiring separate denoising

            # Download media if it's a URL
            media_path = self.storage_manager.download_media(media_url) if not os.path.exists(media_url) else None

            if not media_path:
                raise FileNotFoundError(f"Media file not found: {media_url}")
            
            temp_files.append(media_path)
            
            # Process noise reduction
            processed_media = self.noise_service.process_with_denoising(
                video_path=media_path,
                noise_reduction_level=level,
                temp_files=temp_files,
                story_id="noise_reduction"
            )

            if not processed_media or processed_media == media_url:
                raise RuntimeError("Noise reduction failed or returned no output")
            
            temp_files.append(processed_media)

            # Upload processed media to temp storage (will be cleaned up by session cleanup)
            session_id = job_id if job_id else str(uuid.uuid4())
            processed_url = self.storage_manager.upload_file_with_retry(processed_media, f"temp/{session_id}/denoised/{testimonial_id}.mp4")

            if not processed_url:
                raise RuntimeError("Failed to upload processed media")

           
            return intelligence_pb2.NoiseReductionResponse(
                testimonial_id=testimonial_id,
                denoised_media_url=processed_url,
            )
        except Exception as e:
            logger.error(f"Noise reduction failed for {media_url}: {e}")
            return intelligence_pb2.NoiseReductionResponse(
                testimonial_id=testimonial_id,
                denoised_media_url="",
                error = str(e)
            )
        finally:
            # Cleanup temporary files
            self._cleanup_temp_files(temp_files)
            self.file_manager.cleanup_all_temp_files()

    def generate_noise_cache_key(self, media_url: str, level: str):
        """Generate deterministic cache key"""
        import hashlib
        from urllib.parse import urlparse

        NOISE_ALGORITHM_VERSION = "v1.0"
        parsed_url = urlparse(media_url)
        media_id = f"{parsed_url.netloc}{parsed_url.path}"

        
        cache_data = f"{NOISE_ALGORITHM_VERSION}|{media_id}|{level}"
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()
        return f"{cache_hash}"

    def _cleanup_temp_files(self, temp_files):
        """Cleanup temporary files created during processing."""
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.error(f"Failed to remove temporary file {temp_file}: {e}")