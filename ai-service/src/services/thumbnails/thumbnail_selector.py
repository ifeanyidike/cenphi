# src/services/thumbnails/thumbnail_selector.py

import os
import subprocess
import tempfile
import uuid
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ThumbnailCandidate:
    """Data class for thumbnail candidate"""
    timestamp: float
    score: float
    emotion_data: Dict[str, Any]
    image_path: str
    quality_metrics: Dict[str, Any]

class SmartThumbnailSelector:
    """Production-grade smart thumbnail selector using visual emotion analysis"""
    
    def __init__(self):
        self._emotion_analyzer = None
        self._storage_manager = None
        # self._initialize_emotion_analyzer()
        
        # Quality thresholds
        self.min_face_confidence = 0.6
        self.min_emotion_confidence = 0.5
        self.min_image_quality = 0.4
        
        # Scoring weights
        self.scoring_weights = {
            "emotion_positivity": 0.35,
            "face_prominence": 0.25,
            "image_quality": 0.20,
            "expression_clarity": 0.20
        }
        
        # Positive emotions for thumbnail selection
        self.positive_emotions = ["satisfaction", "confidence", "enthusiasm", "trust", "gratitude", "amazement"]
        
        logger.info("SmartThumbnailSelector initialized")

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    @property
    def emotional_analyzer(self):
        from src.services.emotions.analyzer import EmotionsAnalyzer
        if self._emotion_analyzer is None:
            self._emotion_analyzer = EmotionsAnalyzer()
            logger.info("✅ Emotion analyzer initialized for thumbnail selection")
        return self._emotion_analyzer
    
    def select_thumbnails(self, media_url: str, max_thumbnails: int = 3) -> List[str]:
        """
        Select best thumbnails from video using visual emotion analysis with robust error handling
        
        Args:
            media_url: URL or path to video file
            max_thumbnails: Maximum number of thumbnails to return
            
        Returns:
            List of thumbnail URLs
        """
        temp_files = []
        
        try:
            if max_thumbnails <= 0:
                logger.warning("Invalid max_thumbnails value, using default")
                max_thumbnails = 3
            
            logger.info(f"Starting smart thumbnail selection for {media_url}")
            
            # Step 1: Download media using existing storage pattern
            local_media_path = self.storage_manager.download_media(media_url)
            if not local_media_path or not os.path.exists(local_media_path):
                raise Exception(f"Failed to download media: {media_url}")
            
            temp_files.append(local_media_path)
            
            # Step 2: Get video information with validation
            video_info = self.storage_manager.get_video_info(local_media_path)
            duration = video_info.get("duration", 30.0)
            
            if duration < 5.0:
                logger.warning("Video too short for meaningful thumbnail selection")
                max_thumbnails = 1
            
            # Step 3: Analyze emotions throughout video
            emotion_segments = self._analyze_video_emotions(local_media_path)
            
            # Step 4: Generate candidate thumbnails at key moments
            candidates = self._generate_thumbnail_candidates(
                local_media_path, emotion_segments, duration, max_thumbnails
            )
            temp_files.extend([c.image_path for c in candidates if c.image_path])
            
            if not candidates:
                logger.warning("No thumbnail candidates generated, creating fallback thumbnails")
                candidates = self._generate_fallback_thumbnails(local_media_path, duration, max_thumbnails)
                temp_files.extend([c.image_path for c in candidates if c.image_path])
            
            # Step 5: Score and rank candidates
            scored_candidates = self._score_thumbnail_candidates(candidates)
            
            # Step 6: Select top thumbnails with diversity
            selected_candidates = self._select_top_candidates(scored_candidates, max_thumbnails)
            
            # Step 7: Upload thumbnails using existing storage pattern
            thumbnail_urls = []
            for i, candidate in enumerate(selected_candidates):
                try:
                    if candidate.image_path and os.path.exists(candidate.image_path):
                        thumbnail_url = self.storage_manager.upload_file_with_retry(candidate.image_path)
                        if thumbnail_url:
                            thumbnail_urls.append(thumbnail_url)
                            logger.debug(f"Uploaded thumbnail {i+1}: {thumbnail_url}")
                except Exception as e:
                    logger.warning(f"Failed to upload thumbnail {i+1}: {e}")
            
            # Ensure we have at least one thumbnail
            if not thumbnail_urls and selected_candidates:
                logger.warning("No thumbnails uploaded successfully, retrying with first candidate")
                try:
                    first_candidate = selected_candidates[0]
                    if first_candidate.image_path and os.path.exists(first_candidate.image_path):
                        thumbnail_url = self.storage_manager.upload_file_with_retry(first_candidate.image_path)
                        if thumbnail_url:
                            thumbnail_urls.append(thumbnail_url)
                except Exception as e:
                    logger.error(f"Final thumbnail upload attempt failed: {e}")
            
            logger.info(f"Successfully selected {len(thumbnail_urls)} thumbnails")
            return thumbnail_urls
            
        except Exception as e:
            logger.error(f"Thumbnail selection failed: {str(e)}")
            return []
        
        finally:
            self._cleanup_temp_files(temp_files)

    def _parse_fps(self, fps_str: str) -> float:
        """Parse FPS from FFprobe output"""
        try:
            if "/" in fps_str:
                num, denom = fps_str.split("/")
                return float(num) / float(denom)
            return float(fps_str)
        except Exception:
            return 30.0
    
    def _analyze_video_emotions(self, video_path: str) -> List[Dict[str, Any]]:
        """Analyze emotions with robust fallback"""
        if not self.emotional_analyzer:
            logger.info("Emotion analyzer not available, using strategic timestamps")
            return self._generate_strategic_emotion_segments(video_path)
        
        try:
            # Use the existing emotion analyzer with proper format
            analysis_result = self.emotional_analyzer.analyze(
                media_path=video_path,
                target_emotions=self.positive_emotions,
                analysis_depth="standard"
            )
            
            # Convert to expected format
            segments = analysis_result.get("emotion_segments", [])
            converted_segments = []
            
            for segment in segments:
                converted_segments.append({
                    "start_time": segment.get("start_time", 0),
                    "end_time": segment.get("end_time", 5),
                    "emotion_type": segment.get("emotion_type", "neutral"),
                    "strength": segment.get("strength", 0.5),
                    "confidence": segment.get("confidence", 0.5),
                    "facial_expression": segment.get("facial_expression", "neutral"),
                    "authenticity_score": segment.get("authenticity_score", 0.5)
                })
            
            logger.info(f"Emotion analysis found {len(converted_segments)} segments")
            return converted_segments
            
        except Exception as e:
            logger.warning(f"Emotion analysis failed: {e}, using strategic fallback")
            return self._generate_strategic_emotion_segments(video_path)
    
    def _generate_strategic_emotion_segments(self, video_path: str) -> List[Dict[str, Any]]:
        """Generate strategic emotion segments when analyzer unavailable"""
        try:
            video_info = self.storage_manager.get_video_info(video_path)
            duration = video_info["duration"]
            
            # Generate segments at strategic intervals for thumbnail selection
            segments = []
            
            # Key moments for thumbnails: avoid very beginning/end, focus on middle sections
            strategic_points = []
            
            if duration <= 30:
                # Short video: 3-5 points
                strategic_points = [0.2, 0.4, 0.6, 0.8]
            elif duration <= 120:
                # Medium video: 5-8 points
                strategic_points = [0.15, 0.3, 0.45, 0.6, 0.75, 0.85]
            else:
                # Long video: focus on early-middle sections
                strategic_points = [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9]
            
            for i, point in enumerate(strategic_points):
                start_time = duration * point
                end_time = min(start_time + 5, duration)
                
                # Assign varying confidence to create diversity
                confidence = 0.6 + (i % 3) * 0.1  # Vary between 0.6-0.8
                
                segments.append({
                    "start_time": start_time,
                    "end_time": end_time,
                    "emotion_type": "satisfaction",  # Default positive emotion
                    "strength": 0.6 + (i % 2) * 0.2,
                    "confidence": confidence,
                    "facial_expression": "content_smile",
                    "authenticity_score": 0.7
                })
            
            logger.info(f"Generated {len(segments)} strategic segments for {duration:.1f}s video")
            return segments
            
        except Exception as e:
            logger.error(f"Could not generate strategic segments: {e}")
            return []
    
    def _generate_thumbnail_candidates(
        self, 
        video_path: str, 
        emotion_segments: List[Dict[str, Any]], 
        duration: float,
        max_thumbnails: int
    ) -> List[ThumbnailCandidate]:
        """Generate thumbnail candidates with robust error handling"""
        candidates = []
        
        try:
            # Extract candidate timestamps with smart distribution
            candidate_timestamps = set()
            
            # Add emotion-based timestamps (high priority)
            for segment in emotion_segments:
                confidence = segment.get("confidence", 0)
                strength = segment.get("strength", 0)
                
                if confidence >= self.min_emotion_confidence and strength > 0.4:
                    # Use middle of segment for best emotional expression
                    timestamp = (segment["start_time"] + segment["end_time"]) / 2
                    candidate_timestamps.add(timestamp)
            
            # Add strategic timestamps to ensure coverage
            strategic_points = [0.15, 0.35, 0.55, 0.75, 0.85]  # Avoid very start/end
            for point in strategic_points[:max_thumbnails * 2]:  # More candidates than needed
                candidate_timestamps.add(duration * point)
            
            # Ensure minimum temporal spacing
            sorted_timestamps = sorted(candidate_timestamps)
            spaced_timestamps = []
            min_gap = max(duration / 20, 2.0)  # At least 2 seconds apart
            
            for timestamp in sorted_timestamps:
                if not spaced_timestamps or timestamp - spaced_timestamps[-1] >= min_gap:
                    spaced_timestamps.append(timestamp)
            
            # Limit to reasonable number to avoid excessive processing
            max_candidates = min(max_thumbnails * 3, 15)
            spaced_timestamps = spaced_timestamps[:max_candidates]
            
            # Extract frames for each timestamp
            for i, timestamp in enumerate(spaced_timestamps):
                try:
                    frame_path = self._extract_frame(video_path, timestamp, i)
                    if frame_path:
                        # Find corresponding emotion data
                        emotion_data = self._get_emotion_data_for_timestamp(emotion_segments, timestamp)
                        
                        # Analyze frame quality
                        quality_metrics = self._analyze_frame_quality(frame_path)
                        
                        candidate = ThumbnailCandidate(
                            timestamp=timestamp,
                            score=0.0,  # Will be calculated later
                            emotion_data=emotion_data,
                            image_path=frame_path,
                            quality_metrics=quality_metrics
                        )
                        candidates.append(candidate)
                        
                except Exception as e:
                    logger.warning(f"Failed to generate candidate at {timestamp:.1f}s: {e}")
                    continue
            
            logger.info(f"Generated {len(candidates)} thumbnail candidates from {len(spaced_timestamps)} timestamps")
            return candidates
            
        except Exception as e:
            logger.error(f"Candidate generation failed: {e}")
            return []
    
    def _extract_frame(self, video_path: str, timestamp: float, index: int) -> Optional[str]:
        """Extract frame with robust error handling"""
        try:
            output_path = os.path.join(
                tempfile.gettempdir(),
                f"thumbnail_{uuid.uuid4().hex}_{index}_{timestamp:.1f}s.jpg"
            )
            
            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-ss", str(timestamp),
                "-vframes", "1",
                "-q:v", "2",  # High quality
                "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
                "-f", "image2",
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                logger.warning(f"Frame extraction failed at {timestamp:.1f}s: {result.stderr}")
                return None
            
            # Validate extracted frame
            if os.path.exists(output_path) and os.path.getsize(output_path) > 5000:  # At least 5KB
                return output_path
            else:
                logger.warning(f"Extracted frame too small at {timestamp:.1f}s")
                return None
                
        except Exception as e:
            logger.warning(f"Frame extraction error at {timestamp:.1f}s: {e}")
            return None
    
    def _generate_fallback_thumbnails(self, video_path: str, duration: float, max_thumbnails: int) -> List[ThumbnailCandidate]:
        """Generate fallback thumbnails when emotion analysis fails"""
        candidates = []
        
        try:
            # Use simple time-based extraction
            timestamps = []
            if duration <= 30:
                timestamps = [duration * 0.3, duration * 0.6]
            else:
                step = duration / (max_thumbnails + 1)
                timestamps = [step * (i + 1) for i in range(max_thumbnails)]
            
            for i, timestamp in enumerate(timestamps):
                try:
                    frame_path = self._extract_frame(video_path, timestamp, f"fallback_{i}")
                    if frame_path:
                        candidate = ThumbnailCandidate(
                            timestamp=timestamp,
                            score=0.5,  # Neutral score
                            emotion_data={"emotion_type": "neutral", "confidence": 0.5, "strength": 0.5},
                            image_path=frame_path,
                            quality_metrics={"quality_score": 0.6, "file_size": os.path.getsize(frame_path)}
                        )
                        candidates.append(candidate)
                except Exception as e:
                    logger.warning(f"Fallback thumbnail generation failed at {timestamp:.1f}s: {e}")
            
            logger.info(f"Generated {len(candidates)} fallback thumbnails")
            return candidates
            
        except Exception as e:
            logger.error(f"Fallback thumbnail generation failed: {e}")
            return []
    
    def _get_emotion_data_for_timestamp(self, segments: List[Dict[str, Any]], timestamp: float) -> Dict[str, Any]:
        """Get emotion data for specific timestamp"""
        for segment in segments:
            if segment["start_time"] <= timestamp <= segment["end_time"]:
                return segment
        
        # Default emotion data
        return {
            "emotion_type": "neutral",
            "confidence": 0.5,
            "strength": 0.5,
            "facial_expression": "neutral",
            "authenticity_score": 0.5
        }
    
    def _analyze_frame_quality(self, frame_path: str) -> Dict[str, Any]:
        """Analyze frame quality with robust fallback"""
        try:
            file_size = os.path.getsize(frame_path) if os.path.exists(frame_path) else 0
            
            # Basic quality scoring based on file size and validation
            quality_score = min(file_size / 80000, 1.0)  # Normalize by expected size (~80KB)
            
            # Additional checks could be added here (sharpness, contrast, etc.)
            
            return {
                "file_size": file_size,
                "quality_score": max(quality_score, 0.3),  # Minimum baseline quality
                "sharpness_score": 0.7,  # Placeholder
                "contrast_score": 0.7,   # Placeholder
                "brightness_score": 0.7  # Placeholder
            }
            
        except Exception as e:
            logger.warning(f"Frame quality analysis failed: {e}")
            return {
                "file_size": 0,
                "quality_score": 0.5,
                "sharpness_score": 0.5,
                "contrast_score": 0.5,
                "brightness_score": 0.5
            }
    
    def _score_thumbnail_candidates(self, candidates: List[ThumbnailCandidate]) -> List[ThumbnailCandidate]:
        """Score thumbnail candidates with robust error handling"""
        for candidate in candidates:
            try:
                # Emotion positivity score
                emotion_type = candidate.emotion_data.get("emotion_type", "neutral")
                strength = candidate.emotion_data.get("strength", 0.5)
                
                # Boost score for positive emotions
                if emotion_type in self.positive_emotions:
                    positivity_score = strength * 1.2  # Boost positive emotions
                elif emotion_type == "neutral":
                    positivity_score = 0.5
                else:
                    positivity_score = strength * 0.8  # Reduce negative emotions
                
                positivity_score = min(positivity_score, 1.0)
                
                # Emotion confidence
                emotion_confidence = candidate.emotion_data.get("confidence", 0.5)
                
                # Image quality metrics
                quality_metrics = candidate.quality_metrics
                image_quality = quality_metrics.get("quality_score", 0.5)
                
                # Calculate composite score
                composite_score = (
                    self.scoring_weights["emotion_positivity"] * positivity_score +
                    self.scoring_weights["face_prominence"] * emotion_confidence +
                    self.scoring_weights["image_quality"] * image_quality +
                    self.scoring_weights["expression_clarity"] * quality_metrics.get("sharpness_score", 0.5)
                )
                
                candidate.score = min(composite_score, 1.0)
                
            except Exception as e:
                logger.warning(f"Scoring failed for candidate at {candidate.timestamp:.1f}s: {e}")
                candidate.score = 0.3  # Low but not zero score
        
        # Sort by score descending
        return sorted(candidates, key=lambda c: c.score, reverse=True)
    
    def _select_top_candidates(self, scored_candidates: List[ThumbnailCandidate], max_thumbnails: int) -> List[ThumbnailCandidate]:
        """Select top candidates with robust diversity ensuring"""
        if not scored_candidates:
            return []
        
        selected = []
        min_time_gap = 3.0  # Minimum 3 seconds between thumbnails
        
        try:
            for candidate in scored_candidates:
                if len(selected) >= max_thumbnails:
                    break
                
                # Check temporal diversity
                is_diverse = True
                for selected_candidate in selected:
                    if abs(candidate.timestamp - selected_candidate.timestamp) < min_time_gap:
                        is_diverse = False
                        break
                
                # Accept if diverse and meets minimum quality
                if is_diverse and candidate.score > 0.2:  # Minimum quality threshold
                    selected.append(candidate)
            
            # If we don't have enough diverse candidates, fill with best remaining
            while len(selected) < max_thumbnails and len(selected) < len(scored_candidates):
                for candidate in scored_candidates:
                    if candidate not in selected and len(selected) < max_thumbnails:
                        selected.append(candidate)
                        break
                else:
                    break  # No more candidates available
            
            logger.info(f"Selected {len(selected)} diverse, high-quality thumbnails")
            return selected
            
        except Exception as e:
            logger.error(f"Candidate selection failed: {e}")
            # Return top candidates without diversity check as fallback
            return scored_candidates[:max_thumbnails]
    
    def _cleanup_temp_files(self, temp_files: List[str]):
        """Clean up temporary files with robust error handling"""
        for file_path in temp_files:
            try:
                if file_path and os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception as e:
                logger.warning(f"Could not remove temp file {file_path}: {e}")
    
    def get_selection_statistics(self, media_url: str) -> Dict[str, Any]:
        """Get statistics about thumbnail selection for debugging"""
        try:
            # Use existing storage pattern
            local_media_path = self.storage_manager.download_media(media_url)
            if not local_media_path:
                return {"error": "Could not download media"}
            
            video_info = self.storage_manager.get_video_info(local_media_path)
            emotion_segments = self._analyze_video_emotions(local_media_path)
            
            stats = {
                "video_duration": video_info.get("duration"),
                "video_resolution": f"{video_info.get('width')}x{video_info.get('height')}",
                "emotion_segments_found": len(emotion_segments),
                "positive_emotion_segments": len([s for s in emotion_segments if s.get("emotion_type") in self.positive_emotions]),
                "average_confidence": sum(s.get("confidence", 0) for s in emotion_segments) / len(emotion_segments) if emotion_segments else 0,
                "emotion_analyzer_available": self.emotion_analyzer is not None
            }
            
            # Cleanup
            if os.path.exists(local_media_path):
                os.unlink(local_media_path)
            
            return stats
            
        except Exception as e:
            return {"error": str(e)}