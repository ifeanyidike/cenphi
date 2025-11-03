import os
import json
import logging
import tempfile
import subprocess
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
import intelligence_pb2

logger = logging.getLogger(__name__)

@dataclass
class CaptionResult:
    """Caption generation result"""
    success: bool
    srt_path: str = ""
    vtt_path: str = ""
    transcript_text: str = ""
    word_count: int = 0
    duration: float = 0.0
    error: str = ""

class CaptionGenerator:
    """Generate captions/subtitles for platform content using TranscriptSegment"""
    
    def __init__(self):
        self.max_line_length = 42  # Optimal for readability
        self.max_lines_per_subtitle = 2
        self.min_duration = 1.0  # Minimum subtitle duration
        self._file_manager = None
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        logger.info("CaptionGenerator initialized for TranscriptSegment processing")
    
    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    @property
    def file_manager(self):
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager
    
    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    
    def generate_captions(
        self,
        media_path: str,
        target_platform: str,
        transcript: str = None,
        word_segments: Optional[List[intelligence_pb2.Word]] = None,
        transcript_segments: Optional[List[intelligence_pb2.TranscriptSegment]] = None,
        style_options: Optional[Dict[str, Any]] = None
    ) -> CaptionResult:
        """
        Generate platform-optimized captions from transcript segments
        
        Args:
            media_path: Path to media file
            target_platform: Target platform for optimization
            transcript: Legacy transcript text (fallback)
            word_segments: Legacy word segments (fallback) 
            transcript_segments: TranscriptSegment list (preferred)
            style_options: Caption styling options
            
        Returns:
            CaptionResult with generated caption files
        """
        try:
            if not os.path.exists(media_path):
                raise FileNotFoundError(f"Media file not found: {media_path}")
            
            media_duration = self.storage_manager.get_video_duration(media_path)
            if media_duration <= 0:
                raise ValueError("Invalid media duration")
            
            logger.info(f"Generating captions for {target_platform} (media: {media_duration:.1f}s)")
            
            # Prioritize transcript_segments over legacy inputs
            if transcript_segments and len(transcript_segments) > 0:
                logger.info(f"Processing {len(transcript_segments)} transcript segments")
                
                # Quick timing unit verification for debugging
                self.quick_segment_timing_test(transcript_segments)
                
                # Validate segment consistency
                self._validate_segment_consistency(transcript_segments, media_duration)
                
                # Process segments into caption format
                timed_segments = self._process_transcript_segments(transcript_segments, target_platform)
                
                # Extract full transcript text
                transcript_text = " ".join([segment.text for segment in transcript_segments])
                
            elif word_segments and len(word_segments) > 0:
                logger.warning("Using legacy word_segments - consider using transcript_segments for better accuracy")
                timed_segments = self._group_words_into_segments(word_segments, target_platform)
                transcript_text = " ".join([word.text for word in word_segments if hasattr(word, 'text') and word.text.strip()])
                
            elif transcript and transcript.strip():
                logger.warning("Using legacy transcript with estimated timing")
                transcript_text = transcript.strip()
                timed_segments = self._generate_timing_segments(transcript_text, media_duration)
                
            else:
                raise ValueError("transcript_segments, word_segments, or transcript is required")
            
            if not timed_segments:
                raise ValueError("No caption segments generated")
            
            logger.info(f"Generated {len(timed_segments)} caption segments")
            
            # Platform-specific optimization
            optimized_segments = self._optimize_for_platform(timed_segments, target_platform, style_options)
            
            # Generate caption files
            srt_path = self._generate_srt_file(optimized_segments)
            if not srt_path:
                raise ValueError("Failed to generate SRT file")
            
            vtt_path = self._generate_vtt_file(optimized_segments, target_platform, style_options)
            if not vtt_path:
                raise ValueError("Failed to generate VTT file")
            
            # Final validation
            self._validate_generated_files(srt_path, vtt_path, len(optimized_segments))
            
            logger.info(f"✅ Successfully generated captions:")
            logger.info(f"   SRT: {srt_path}")
            logger.info(f"   VTT: {vtt_path}")
            logger.info(f"   Segments: {len(optimized_segments)}")
            logger.info(f"   Words: {len(transcript_text.split())}")
            
            return CaptionResult(
                success=True,
                srt_path=srt_path,
                vtt_path=vtt_path,
                transcript_text=transcript_text,
                word_count=len(transcript_text.split()),
                duration=media_duration
            )
            
        except Exception as e:
            logger.error(f"Caption generation failed: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return CaptionResult(success=False, error=str(e))
    
    def _validate_segment_consistency(self, transcript_segments: List[intelligence_pb2.TranscriptSegment], media_duration: float):
        """Validate transcript segment timing consistency (handles millisecond timing)"""
        if not transcript_segments:
            raise ValueError("Empty transcript segments")
        
        logger.info("Validating transcript segment consistency...")
        
        issues = []
        total_segments = len(transcript_segments)
        
        # Check each segment
        for i, segment in enumerate(transcript_segments):
            # Validate segment has required fields
            if not hasattr(segment, 'text') or not segment.text.strip():
                logger.warning(f"Segment {i}: Empty text")
                issues.append(f"Segment {i}: Empty text")
                continue
            
            if not hasattr(segment, 'start_time') or not hasattr(segment, 'end_time'):
                logger.warning(f"Segment {i}: Missing timing")
                issues.append(f"Segment {i}: Missing timing")
                continue
            
            # Convert milliseconds to seconds (CRITICAL FIX)
            start_time_ms = float(segment.start_time)
            end_time_ms = float(segment.end_time)
            start_time = start_time_ms / 1000.0
            end_time = end_time_ms / 1000.0
            
            if start_time < 0:
                logger.warning(f"Segment {i}: Negative start time {start_time_ms}ms ({start_time:.2f}s)")
                issues.append(f"Segment {i}: Negative start time {start_time_ms}ms ({start_time:.2f}s)")
            
            if end_time <= start_time:
                logger.warning(f"Segment {i}: Invalid duration {start_time_ms}ms-{end_time_ms}ms ({start_time:.2f}s-{end_time:.2f}s)")
                issues.append(f"Segment {i}: Invalid duration {start_time_ms}ms-{end_time_ms}ms ({start_time:.2f}s-{end_time:.2f}s)")
            
            tolerance = min(1.0, media_duration * 0.05) # 5% of duration or 1s max
            if end_time > media_duration + tolerance:
                logger.warning(f"Segment {i}: Extends beyond media {end_time:.2f}s > {media_duration:.2f}s")
                issues.append(f"Segment {i}: Extends beyond media {end_time:.2f}s > {media_duration:.2f}s")
            
            # Check gap to next segment
            if i < total_segments - 1:
                next_segment = transcript_segments[i + 1]
                next_start_ms = float(next_segment.start_time)
                next_start = next_start_ms / 1000.0
                gap = next_start - end_time
                
                if gap > 5.0:  # Large gap
                    logger.warning(f"Large gap between segments {i}-{i+1}: {gap:.1f}s")
                elif gap < -0.1:  # Overlap
                    logger.warning(f"Segment overlap {i}-{i+1}: {abs(gap):.1f}s")
        
        # Report validation results
        if issues:
            logger.error(f"Found {len(issues)} segment validation issues:")
            for issue in issues[:5]:  # Show first 5
                logger.error(f"  {issue}")
            if len(issues) > 5:
                logger.error(f"  ... and {len(issues) - 5} more issues")
            raise ValueError(f"Segment validation failed: {len(issues)} issues found")
        

        if media_duration < 10.0:  # Likely a clip
            logger.info(f"🎬 CLIP MODE: Validating {len(transcript_segments)} segments for {media_duration:.2f}s clip")
            
            # Log segment coverage for clips
            if transcript_segments:
                first_start = float(transcript_segments[0].start_time) / 1000.0
                last_end = float(transcript_segments[-1].end_time) / 1000.0
                
                logger.info(f"📊 Clip segment coverage: {first_start:.3f}s - {last_end:.3f}s of {media_duration:.3f}s")
                
                if first_start > 0.1:
                    logger.warning(f"⚠️ Segments start late: {first_start:.3f}s delay")
                if last_end < media_duration - 0.1:
                    logger.warning(f"⚠️ Segments end early: {media_duration - last_end:.3f}s gap")
                    
        
        # Overall timing analysis (convert to seconds)
        first_start_ms = float(transcript_segments[0].start_time)
        last_end_ms = float(transcript_segments[-1].end_time)
        first_start = first_start_ms / 1000.0
        last_end = last_end_ms / 1000.0
        coverage = (last_end / media_duration) * 100 if media_duration > 0 else 0
        
        logger.info(f"✅ Segment validation passed:")
        logger.info(f"   Segments: {total_segments}")
        logger.info(f"   Time span (ms): {first_start_ms:.0f}ms - {last_end_ms:.0f}ms")
        logger.info(f"   Time span (sec): {first_start:.1f}s - {last_end:.1f}s")
        logger.info(f"   Coverage: {coverage:.1f}% of media")

        expected_min = 60 if media_duration < 5.0 else 70  # Lower expectation for short clips
        expected_max = 110 if media_duration < 5.0 else 105  # Higher tolerance for clips
        
        if coverage < expected_min:
            logger.warning(f"Low coverage: {coverage:.1f}% - speech might extend beyond segments")
        elif coverage > expected_max:
            logger.warning(f"High coverage: {coverage:.1f}% - segments might extend beyond media")
    
    def _process_transcript_segments(
        self, 
        transcript_segments: List[intelligence_pb2.TranscriptSegment], 
        target_platform: str
    ) -> List[Dict[str, Any]]:
        """Process transcript segments into caption format with platform optimization (handles millisecond timing)"""
        
        logger.info(f"Processing {len(transcript_segments)} segments for {target_platform}")
        
        # Platform-specific parameters
        platform_config = self._get_platform_config(target_platform)
        
        caption_segments = []
        
        for i, segment in enumerate(transcript_segments):
            # Convert milliseconds to seconds (CRITICAL FIX)
            start_time_ms = float(segment.start_time)
            end_time_ms = float(segment.end_time)
            start_time = start_time_ms / 1000.0
            end_time = end_time_ms / 1000.0
            
            text = segment.text.strip()
            duration = end_time - start_time
            
            # Skip empty segments
            if not text:
                logger.warning(f"Skipping empty segment {i}")
                continue
            
            # Validate converted timing
            if duration <= 0:
                logger.error(f"Segment {i} has invalid duration after conversion: {start_time_ms}ms-{end_time_ms}ms -> {start_time:.3f}s-{end_time:.3f}s")
                continue
            
            logger.info(f"Segment {i}: {start_time_ms}ms-{end_time_ms}ms -> {start_time:.2f}s-{end_time:.2f}s ({duration:.2f}s)")
            
            # Check if segment needs splitting for platform
            if (duration > platform_config['max_duration'] or 
                len(text.split()) > platform_config['max_words']):
                
                logger.info(f"Splitting long segment {i}: {duration:.1f}s, {len(text.split())} words")
                split_segments = self._split_long_segment(segment, platform_config)
                caption_segments.extend(split_segments)
                
            else:
                # Use segment as-is (with converted timing)
                caption_segments.append({
                    "start_time": start_time,
                    "end_time": end_time,
                    "text": text,
                    "word_count": len(text.split()),
                    "duration": duration,
                    "timing_source": "transcript_segment_ms_converted",
                    "original_index": i,
                    "original_start_ms": start_time_ms,
                    "original_end_ms": end_time_ms,
                    "confidence": getattr(segment, 'confidence', 1.0),
                    "speaker": getattr(segment, 'speaker', '')
                })
        
        logger.info(f"Processed into {len(caption_segments)} caption segments")
        
        # Validate no timing gaps
        self._validate_caption_timing(caption_segments)
        
        return caption_segments
    
    def _get_platform_config(self, target_platform: str) -> Dict[str, Any]:
        """Get platform-specific configuration"""
        
        platform_lower = target_platform.lower()
        
        if platform_lower in ["tiktok", "instagram_reels", "youtube_shorts"]:
            return {
                'max_words': 8,
                'max_duration': 3.5,
                'max_line_length': 25,
                'prefer_short': True
            }
        elif platform_lower in ["instagram_story"]:
            return {
                'max_words': 6,
                'max_duration': 2.8,
                'max_line_length': 20,
                'prefer_short': True
            }
        elif platform_lower in ["youtube_standard"]:
            return {
                'max_words': 15,
                'max_duration': 5.0,
                'max_line_length': 50,
                'prefer_short': False
            }
        elif platform_lower == "linkedin":
            return {
                'max_words': 12,
                'max_duration': 4.5,
                'max_line_length': 45,
                'prefer_short': False
            }
        else:
            # Default configuration
            return {
                'max_words': 12,
                'max_duration': 4.5,
                'max_line_length': 42,
                'prefer_short': False
            }
    
    def _split_long_segment(
        self, 
        segment: intelligence_pb2.TranscriptSegment, 
        platform_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Split a long transcript segment into smaller caption segments (handles millisecond timing)"""
        
        # Convert milliseconds to seconds (CRITICAL FIX)
        start_time_ms = float(segment.start_time)
        end_time_ms = float(segment.end_time)
        start_time = start_time_ms / 1000.0
        end_time = end_time_ms / 1000.0
        
        text = segment.text.strip()
        total_duration = end_time - start_time
        
        logger.info(f"Splitting segment: {start_time_ms}ms-{end_time_ms}ms -> {start_time:.2f}s-{end_time:.2f}s")
        
        # Check if we have word-level timing for precise splits
        if hasattr(segment, 'words') and segment.words:
            return self._split_using_word_timing(segment, platform_config)
        else:
            return self._split_using_estimation(segment, platform_config)
    
    def _split_using_word_timing(
        self, 
        segment: intelligence_pb2.TranscriptSegment, 
        platform_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Split segment using word-level timing for precision"""
        
        words = segment.words
        max_words = platform_config['max_words']
        max_duration = platform_config['max_duration']
        
        split_segments = []
        current_words = []
        
        for i, word in enumerate(words):
            # Convert word timing from milliseconds to seconds
            word_start = float(word.start) / 1000.0 if hasattr(word, 'start') else 0
            word_end = float(word.end) / 1000.0 if hasattr(word, 'end') else 0
            word_text = word.text if hasattr(word, 'text') else ""
            
            if not word_text.strip():
                continue
            
            current_words.append({
                'text': word_text.strip(),
                'start': word_start,
                'end': word_end
            })
            
            # Check if we should end current split
            if current_words:
                segment_start = current_words[0]['start']
                segment_end = word_end
                segment_duration = segment_end - segment_start
                
                should_split = False
                
                # Natural break points
                if word_text.rstrip().endswith(('.', '!', '?', ':')):
                    should_split = True
                # Hard limits
                elif len(current_words) >= max_words or segment_duration >= max_duration:
                    should_split = True
                # Last word
                elif i == len(words) - 1:
                    should_split = True
                
                if should_split:
                    segment_text = " ".join([w['text'] for w in current_words])
                    
                    split_segments.append({
                        "start_time": segment_start,
                        "end_time": segment_end,
                        "text": segment_text,
                        "word_count": len(current_words),
                        "duration": segment_duration,
                        "timing_source": "word_split",
                        "confidence": getattr(segment, 'confidence', 1.0),
                        "speaker": getattr(segment, 'speaker', '')
                    })
                    
                    current_words = []
        
        return split_segments
    
    def _split_using_estimation(
        self, 
        segment: intelligence_pb2.TranscriptSegment, 
        platform_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Split segment using time estimation when word timing unavailable (handles millisecond timing)"""
        
        # Convert milliseconds to seconds (CRITICAL FIX)
        start_time_ms = float(segment.start_time)
        end_time_ms = float(segment.end_time)
        start_time = start_time_ms / 1000.0
        end_time = end_time_ms / 1000.0
        
        text = segment.text.strip()
        total_duration = end_time - start_time
        
        words = text.split()
        max_words = platform_config['max_words']
        
        split_segments = []
        words_per_second = len(words) / total_duration if total_duration > 0 else 2.0
        
        current_time = start_time
        i = 0
        
        while i < len(words):
            # Determine how many words for this segment
            words_in_segment = min(max_words, len(words) - i)
            segment_words = words[i:i + words_in_segment]
            segment_text = " ".join(segment_words)
            
            # Calculate estimated duration
            estimated_duration = len(segment_words) / words_per_second
            estimated_duration = max(self.min_duration, estimated_duration)
            
            segment_end_time = min(current_time + estimated_duration, end_time)
            
            split_segments.append({
                "start_time": current_time,
                "end_time": segment_end_time,
                "text": segment_text,
                "word_count": len(segment_words),
                "duration": segment_end_time - current_time,
                "timing_source": "estimated_split_ms_converted",
                "original_start_ms": start_time_ms,
                "original_end_ms": end_time_ms,
                "confidence": getattr(segment, 'confidence', 1.0),
                "speaker": getattr(segment, 'speaker', '')
            })
            
            current_time = segment_end_time
            i += words_in_segment
        
        return split_segments
    
    def _validate_caption_timing(self, caption_segments: List[Dict[str, Any]]):
        """Validate caption segment timing consistency"""
        
        if len(caption_segments) < 2:
            return
        
        gaps = []
        overlaps = []
        
        for i in range(len(caption_segments) - 1):
            current_end = caption_segments[i]["end_time"]
            next_start = caption_segments[i + 1]["start_time"]
            gap = next_start - current_end
            
            if gap > 2.0:  # Large gap
                gaps.append(f"Segment {i}-{i+1}: {gap:.1f}s gap")
            elif gap < -0.1:  # Overlap
                overlaps.append(f"Segment {i}-{i+1}: {abs(gap):.1f}s overlap")
        
        if gaps:
            logger.warning(f"Found {len(gaps)} large gaps: {gaps[:3]}")
        if overlaps:
            logger.warning(f"Found {len(overlaps)} overlaps: {overlaps[:3]}")
        
        if not gaps and not overlaps:
            logger.info("✅ Caption timing validation passed")
    
    def _group_words_into_segments(self, word_segments: List[intelligence_pb2.Word], platform: str) -> List[Dict[str, Any]]:
        """Legacy method for word-level processing (fallback)"""
        
        logger.warning("Using legacy word grouping - consider using transcript_segments")
        
        if not word_segments:
            return []
        
        platform_config = self._get_platform_config(platform)
        segments = []
        current_words = []
        
        for i, word in enumerate(word_segments):
            if not hasattr(word, 'text') or not word.text.strip():
                continue
            
            # Convert milliseconds to seconds
            start_time = float(word.start) / 1000.0
            end_time = float(word.end) / 1000.0
            
            current_words.append({
                'text': word.text.strip(),
                'start': start_time,
                'end': end_time
            })
            
            # Simple grouping logic
            if (len(current_words) >= platform_config['max_words'] or 
                word.text.rstrip().endswith(('.', '!', '?')) or
                i == len(word_segments) - 1):
                
                if current_words:
                    segment_start = current_words[0]['start']
                    segment_end = current_words[-1]['end']
                    segment_text = " ".join([w['text'] for w in current_words])
                    
                    segments.append({
                        "start_time": segment_start,
                        "end_time": segment_end,
                        "text": segment_text,
                        "word_count": len(current_words),
                        "duration": segment_end - segment_start,
                        "timing_source": "legacy_words"
                    })
                    
                    current_words = []
        
        return segments
    
    def _generate_timing_segments(self, transcript: str, duration: float) -> List[Dict[str, Any]]:
        """Legacy method for transcript-only processing (fallback)"""
        
        logger.warning("Using legacy transcript timing - consider using transcript_segments")
        
        if duration <= 0 or not transcript.strip():
            return []
        
        words = transcript.split()
        segments = []
        
        # Simple estimation
        words_per_second = len(words) / (duration * 0.85)  # 85% coverage
        current_time = 0.5  # Start delay
        
        i = 0
        while i < len(words):
            words_in_segment = min(12, len(words) - i)
            segment_words = words[i:i + words_in_segment]
            segment_text = " ".join(segment_words)
            
            segment_duration = max(self.min_duration, len(segment_words) / words_per_second)
            
            segments.append({
                "start_time": current_time,
                "end_time": current_time + segment_duration,
                "text": segment_text,
                "word_count": len(segment_words),
                "duration": segment_duration,
                "timing_source": "estimated"
            })
            
            current_time += segment_duration + 0.2
            i += words_in_segment
        
        return segments
    
    def _optimize_for_platform(
        self, 
        segments: List[Dict[str, Any]], 
        platform: str, 
        style_options: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Optimize segments for specific platform"""
        
        platform_config = self._get_platform_config(platform)
        style_options = style_options or {}
        
        optimized_segments = []
        
        for segment in segments:
            optimized_segment = segment.copy()
            
            # Platform-specific text optimization
            if platform_config['prefer_short']:
                optimized_segment["text"] = self._optimize_for_short_form(segment["text"])
            
            # Set line length
            optimized_segment["max_line_length"] = platform_config['max_line_length']
            
            # Apply text wrapping
            optimized_segment["formatted_lines"] = self._wrap_text(
                optimized_segment["text"], 
                optimized_segment["max_line_length"]
            )
            
            optimized_segments.append(optimized_segment)
        
        return optimized_segments
    
    def _optimize_for_short_form(self, text: str) -> str:
        """Optimize text for short-form platforms"""
        # Remove common filler words
        filler_words = ["um", "uh", "like", "you know", "actually", "basically", "so", "well"]
        words = text.split()
        
        filtered_words = []
        for word in words:
            # Keep word if it's not a filler or if removing it would make sentence too short
            if word.lower() not in filler_words or len(filtered_words) < 3:
                filtered_words.append(word)
        
        return " ".join(filtered_words)
    
    def _wrap_text(self, text: str, max_line_length: int) -> List[str]:
        """Wrap text into lines with proper word boundaries"""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            word_length = len(word)
            space_needed = 1 if current_line else 0
            total_length_if_added = current_length + word_length + space_needed
            
            if total_length_if_added > max_line_length and current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
                current_length = word_length
            else:
                current_line.append(word)
                current_length += word_length + space_needed
        
        if current_line:
            lines.append(" ".join(current_line))
        
        # Limit to max lines per subtitle
        if len(lines) > self.max_lines_per_subtitle:
            lines = lines[:self.max_lines_per_subtitle]
            if len(lines) == self.max_lines_per_subtitle:
                lines[-1] += "..."
        
        return lines
    
    def _generate_srt_file(self, segments: List[Dict[str, Any]]) -> str:
        """Generate SRT caption file"""
        try:
            # srt_path = tempfile.mktemp(suffix=".srt")
            srt_path = self.file_manager.create_temp_srt()
            
            logger.debug(f"Generating SRT file with {len(segments)} segments")
            
            with open(srt_path, 'w', encoding='utf-8') as f:
                for i, segment in enumerate(segments, 1):
                    start_time = self._format_srt_time(segment["start_time"])
                    end_time = self._format_srt_time(segment["end_time"])
                    
                    f.write(f"{i}\n")
                    f.write(f"{start_time} --> {end_time}\n")
                    
                    # Write formatted lines
                    lines = segment.get("formatted_lines", [segment["text"]])
                    for line in lines:
                        f.write(f"{line}\n")
                    
                    f.write("\n")
            
            logger.info(f"SRT file generated: {srt_path}")
            return srt_path
            
        except Exception as e:
            logger.error(f"SRT generation failed: {e}")
            return ""
    
    def _generate_vtt_file(
        self, 
        segments: List[Dict[str, Any]], 
        platform: str,
        style_options: Optional[Dict[str, Any]]
    ) -> str:
        """Generate WebVTT caption file with platform-specific styling"""
        try:
            # vtt_path = tempfile.mktemp(suffix=".vtt")
            vtt_path = self.file_manager.create_temp_vtt()
            style_options = style_options or {}
            
            with open(vtt_path, 'w', encoding='utf-8') as f:
                f.write("WEBVTT\n\n")
                
                # Add platform-specific styling
                styling = self._get_platform_vtt_styling(platform, style_options)
                if styling:
                    f.write(f"STYLE\n{styling}\n\n")
                
                for segment in segments:
                    start_time = self._format_vtt_time(segment["start_time"])
                    end_time = self._format_vtt_time(segment["end_time"])
                    
                    f.write(f"{start_time} --> {end_time}\n")
                    
                    # Write formatted lines
                    lines = segment.get("formatted_lines", [segment["text"]])
                    for line in lines:
                        f.write(f"{line}\n")
                    
                    f.write("\n")
            
            logger.info(f"VTT file generated: {vtt_path}")
            return vtt_path
            
        except Exception as e:
            logger.error(f"VTT generation failed: {e}")
            return ""
    
    def _get_platform_vtt_styling(self, platform: str, style_options: Dict[str, Any]) -> str:
        """Get platform-specific VTT styling with correct CSS format"""
        
        platform_lower = platform.lower()
        
        if platform_lower == "tiktok":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  position: align;
  vertical-align: bottom;
}"""
        elif platform_lower == "instagram_reels":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 15px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  position: align;
  vertical-align: bottom;
}"""
        elif platform_lower == "youtube_shorts":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 17px;
  font-weight: bold;
  text-align: center;
  line-height: 1.3;
  position: align;
  vertical-align: bottom;
}"""
        elif platform_lower == "instagram_story":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  line-height: 1.3;
  position: align;
  vertical-align: bottom;
}"""
        elif platform_lower == "linkedin":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 15px;
  font-weight: bold;
  text-align: center;
  line-height: 1.4;
  position: align;
  vertical-align: bottom;
}"""
        elif platform_lower == "youtube_standard":
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 16px;
  text-align: center;
  line-height: 1.3;
  position: align;
  vertical-align: bottom;
}"""
        else:
            return """STYLE
::cue {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 16px;
  text-align: center;
  line-height: 1.3;
  position: align;
  vertical-align: bottom;
}"""
    
    def _format_srt_time(self, seconds: float) -> str:
        """Format time for SRT format (HH:MM:SS,mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milliseconds = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"
    
    def _format_vtt_time(self, seconds: float) -> str:
        """Format time for VTT format (HH:MM:SS.mmm)"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milliseconds = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"
    
    def _validate_generated_files(self, srt_path: str, vtt_path: str, expected_segments: int):
        """Validate generated caption files"""
        
        issues = []
        
        # Check SRT file
        if not os.path.exists(srt_path):
            issues.append("SRT file not created")
        elif os.path.getsize(srt_path) < 10:
            issues.append("SRT file too small")
        else:
            try:
                with open(srt_path, 'r', encoding='utf-8') as f:
                    srt_content = f.read()
                    srt_segment_count = srt_content.count('\n\n')
                    if srt_segment_count != expected_segments:
                        issues.append(f"SRT segment count mismatch: {srt_segment_count} vs {expected_segments}")
            except Exception as e:
                issues.append(f"SRT file validation error: {e}")
        
        # Check VTT file
        if not os.path.exists(vtt_path):
            issues.append("VTT file not created")
        elif os.path.getsize(vtt_path) < 10:
            issues.append("VTT file too small")
        else:
            try:
                with open(vtt_path, 'r', encoding='utf-8') as f:
                    vtt_content = f.read()
                    if not vtt_content.startswith("WEBVTT"):
                        issues.append("VTT file missing WEBVTT header")
            except Exception as e:
                issues.append(f"VTT file validation error: {e}")
        
        if issues:
            logger.error(f"File validation issues: {issues}")
            raise ValueError(f"Generated files validation failed: {'; '.join(issues)}")
        
        logger.info("✅ Generated files validation passed")
    
    def burn_captions_to_video(
        self, 
        video_path: str, 
        srt_path: str, 
        platform: str,
        media_info: Dict[str, Any]
    ) -> str:
        """Burn captions directly into video for social media with proper path handling"""
        
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            if not os.path.exists(srt_path):
                raise FileNotFoundError(f"SRT file not found: {srt_path}")
            

            # output_path = tempfile.mktemp(suffix=".mp4")
            output_path = self.file_manager.create_temp_video()
            
            # Properly escape SRT path for FFmpeg (critical for Windows/special chars)
            # Convert backslashes to forward slashes and escape special characters
            normalized_srt_path = srt_path.replace("\\", "/")
            # Escape colons, commas, and other special characters that break FFmpeg
            escaped_srt_path = normalized_srt_path.replace(":", "\\:").replace("'", "\\'")
            
            # Platform-specific caption styling for FFmpeg (ASS format)
            # Verified compatible with FFmpeg 7.1.1 (tested: test_platform_captions.py)
            platform_lower = platform.lower()

            if platform_lower == "tiktok":
                # TikTok signature style: Bold text with YELLOW box background
                # BorderStyle=4 creates the iconic TikTok opaque box behind text
                # Industry standard: 16-18px for readability without overwhelming
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial Black,FontSize=18,Bold=1,BorderStyle=4,Outline=0,Shadow=2,"
                    f"PrimaryColour=&H000000&,BackColour=&H0000ffff&,"  # Black text on bright yellow (TikTok signature)
                    f"Alignment=2,MarginV=45,Spacing=2'"
                )
            elif platform_lower == "instagram_reels":
                # Instagram Reels style: Similar to TikTok but with PINK/purple accent
                # Industry standard: 16-18px with bold weight for mobile readability
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial Black,FontSize=17,Bold=1,BorderStyle=4,Outline=0,Shadow=2,"
                    f"PrimaryColour=&Hffffff&,BackColour=&H00ff69b4&,"  # White on hot pink (Instagram vibe)
                    f"Alignment=2,MarginV=40,Spacing=2'"
                )
            elif platform_lower == "youtube_shorts":
                # YouTube Shorts: Clean, modern with semi-transparent black box
                # Industry standard: 18-20px, less aggressive than TikTok
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial,FontSize=19,Bold=1,BorderStyle=4,Outline=0,Shadow=2,"
                    f"PrimaryColour=&Hffffff&,BackColour=&HCC000000&,"  # White on 80% black (clean, readable)
                    f"Alignment=2,MarginV=38,Spacing=2'"
                )
            elif platform_lower == "instagram_story":
                # Instagram Story: Compact, elegant style for mobile
                # Industry standard: 14-16px for story format
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial,FontSize=15,Bold=1,BorderStyle=4,Outline=0,Shadow=1,"
                    f"PrimaryColour=&Hffffff&,BackColour=&HCC000000&,"  # White on 80% black
                    f"Alignment=2,MarginV=32,Spacing=1'"
                )
            elif platform_lower == "linkedin":
                # LinkedIn: Professional, sophisticated - subtle box for credibility
                # Industry standard: 16-18px for professional appearance
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial,FontSize=17,Bold=1,BorderStyle=4,Outline=0,Shadow=1,"
                    f"PrimaryColour=&Hffffff&,BackColour=&HE6000000&,"  # White on very subtle black (10% transparency)
                    f"Alignment=2,MarginV=32,Spacing=1'"
                )
            elif platform_lower == "youtube_standard":
                # YouTube Standard: Traditional, clean subtitle style
                # Industry standard: 18-20px with outline for readability
                subtitle_filter = (
                    f"subtitles='{escaped_srt_path}':force_style='"
                    f"FontName=Arial,FontSize=18,Bold=1,BorderStyle=1,Outline=2,Shadow=1,"
                    f"PrimaryColour=&Hffffff&,OutlineColour=&H000000&,"  # White with black outline
                    f"Alignment=2,MarginV=28'"
                )
            else:
                # Default styling for unknown platforms
                subtitle_filter = f"subtitles='{escaped_srt_path}'"
            
            # HIGH QUALITY encoding to match crop/branding/enhancement quality
            cmd = [
                "ffmpeg", "-y",  # Overwrite output
                "-i", video_path,
                "-vf", subtitle_filter,
                "-c:v", "libx264",
                "-preset", "medium",     # Better quality than fast
                "-crf", "17",            # Excellent quality to match other pipeline steps
                "-profile:v", "high",
                "-level", "4.1",
                "-c:a", "copy",          # Don't re-encode audio
                "-movflags", "+faststart",  # Web optimization
                "-avoid_negative_ts", "make_zero",  # Fix timing issues
                output_path
            ]
            
            logger.debug(f"FFmpeg command: {' '.join(cmd)}")
            logger.debug(f"Escaped SRT path: {escaped_srt_path}")
            
            # result = subprocess.run(
            #     cmd, 
            #     capture_output=True, 
            #     text=True, 
            #     timeout=300  # 5 minute timeout
            # )
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, timeout=300, text=True, video_info=media_info)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg stderr: {result.stderr}")
                logger.error(f"FFmpeg stdout: {result.stdout}")
                raise Exception(f"Caption burning failed (exit code {result.returncode}): {result.stderr}")
            
            # Verify output file exists and is valid
            if not os.path.exists(output_path):
                raise Exception("FFmpeg did not produce output file")
            
            output_size = os.path.getsize(output_path)
            if output_size < 1024:  # Less than 1KB is suspicious
                raise Exception(f"Output file is too small ({output_size} bytes), likely corrupted")
            
            # Verify output has similar duration to input (basic sanity check)
            input_duration = self.storage_manager.get_video_duration(video_path)
            output_duration = self.storage_manager.get_video_duration(output_path)
            
            if input_duration > 0 and output_duration > 0:
                duration_diff = abs(output_duration - input_duration)
                if duration_diff > 1.0:  # More than 1 second difference
                    logger.warning(f"Duration mismatch: input {input_duration:.1f}s vs output {output_duration:.1f}s")
            
            logger.info(f"✅ Captions burned successfully for {platform}")
            logger.info(f"Input: {video_path} ({input_duration:.1f}s)")
            logger.info(f"Output: {output_path} ({output_duration:.1f}s, {output_size} bytes)")
            
            return output_path
            
        except subprocess.TimeoutExpired:
            logger.error("FFmpeg process timed out during caption burning")
            return ""
        except Exception as e:
            logger.error(f"Caption burning failed: {e}")
            return ""
    
    def debug_timing_issues(self, transcript_segments: List[intelligence_pb2.TranscriptSegment]) -> Dict[str, Any]:
        """Debug timing issues with transcript segments (handles millisecond timing)"""
        
        if not transcript_segments:
            return {"error": "No transcript segments provided"}
        
        debug_info = {
            "total_segments": len(transcript_segments),
            "timing_issues": [],
            "coverage_analysis": {},
            "sample_segments": []
        }
        
        prev_end_ms = 0
        prev_end_sec = 0
        
        # Check first 5 and last 2 segments
        sample_indices = list(range(min(5, len(transcript_segments)))) + [-2, -1]
        
        for i in sample_indices:
            if i < 0:
                i = len(transcript_segments) + i
            if i < 0 or i >= len(transcript_segments):
                continue
                
            segment = transcript_segments[i]
            
            # Convert milliseconds to seconds for analysis
            start_time_ms = getattr(segment, 'start_time', 0)
            end_time_ms = getattr(segment, 'end_time', 0)
            start_time_sec = start_time_ms / 1000.0
            end_time_sec = end_time_ms / 1000.0
            duration_sec = end_time_sec - start_time_sec
            
            segment_info = {
                "index": i,
                "text": getattr(segment, 'text', 'NO_TEXT')[:50] + "...",
                "start_time_ms": start_time_ms,
                "end_time_ms": end_time_ms,
                "start_time_sec": start_time_sec,
                "end_time_sec": end_time_sec,
                "duration_sec": duration_sec,
                "word_count": len(getattr(segment, 'text', '').split()),
                "has_words": hasattr(segment, 'words') and segment.words
            }
            
            # Check for issues
            if duration_sec <= 0:
                debug_info["timing_issues"].append(f"Segment {i}: Invalid duration {start_time_ms}ms-{end_time_ms}ms ({duration_sec:.3f}s)")
            
            if i > 0 and start_time_sec < prev_end_sec:
                debug_info["timing_issues"].append(f"Segment {i}: Overlaps with previous segment ({start_time_ms}ms < {prev_end_ms}ms)")
            
            debug_info["sample_segments"].append(segment_info)
            prev_end_ms = end_time_ms
            prev_end_sec = end_time_sec
        
        # Overall analysis (convert to seconds)
        if transcript_segments:
            first_start_ms = getattr(transcript_segments[0], 'start_time', 0)
            last_end_ms = getattr(transcript_segments[-1], 'end_time', 0)
            first_start_sec = first_start_ms / 1000.0
            last_end_sec = last_end_ms / 1000.0
            
            debug_info["coverage_analysis"] = {
                "first_segment_start_ms": first_start_ms,
                "last_segment_end_ms": last_end_ms,
                "first_segment_start_sec": first_start_sec,
                "last_segment_end_sec": last_end_sec,
                "total_span_sec": last_end_sec - first_start_sec,
                "average_duration_sec": (last_end_sec - first_start_sec) / len(transcript_segments) if transcript_segments else 0
            }
        
        logger.info(f"Debug analysis: {len(debug_info['timing_issues'])} issues found")
        logger.info(f"Time range: {debug_info['coverage_analysis'].get('first_segment_start_ms', 0)}ms - {debug_info['coverage_analysis'].get('last_segment_end_ms', 0)}ms")
        logger.info(f"Time range: {debug_info['coverage_analysis'].get('first_segment_start_sec', 0):.1f}s - {debug_info['coverage_analysis'].get('last_segment_end_sec', 0):.1f}s")
        
        return debug_info
    
    def quick_segment_timing_test(self, transcript_segments: List[intelligence_pb2.TranscriptSegment]):
        """Quick test to verify TranscriptSegment timing units (milliseconds vs seconds)"""
        
        if not transcript_segments or len(transcript_segments) < 3:
            logger.warning("Need at least 3 segments for timing test")
            return
        
        logger.info("=== TRANSCRIPT SEGMENT TIMING TEST ===")
        
        # Check first 3 segments
        for i in range(min(3, len(transcript_segments))):
            segment = transcript_segments[i]
            start_raw = getattr(segment, 'start_time', 0)
            end_raw = getattr(segment, 'end_time', 0)
            text = getattr(segment, 'text', 'NO_TEXT')[:30]
            
            # Show both interpretations
            if_seconds = f"{start_raw:.2f}s - {end_raw:.2f}s"
            if_milliseconds = f"{start_raw/1000.0:.2f}s - {end_raw/1000.0:.2f}s (converted from {start_raw:.0f}ms - {end_raw:.0f}ms)"
            
            logger.info(f"Segment {i}: '{text}'")
            logger.info(f"  Raw values: {start_raw} - {end_raw}")
            logger.info(f"  If seconds: {if_seconds}")
            logger.info(f"  If milliseconds: {if_milliseconds}")
        
        # Auto-detect likely unit based on values
        first_segment = transcript_segments[0]
        last_segment = transcript_segments[-1]
        span_raw = getattr(last_segment, 'end_time', 0) - getattr(first_segment, 'start_time', 0)
        
        if span_raw > 10000:  # Very likely milliseconds
            logger.info(f"✅ DETECTED: Timing appears to be in MILLISECONDS (span: {span_raw:.0f})")
            logger.info(f"   Converted span: {span_raw/1000.0:.1f} seconds")
        elif span_raw > 10:  # Likely seconds
            logger.info(f"🤔 DETECTED: Timing appears to be in SECONDS (span: {span_raw:.1f}s)")
            logger.warning("   This conflicts with Word timing being in milliseconds!")
        else:
            logger.warning(f"❓ UNCLEAR: Short span ({span_raw:.1f}) - check manually")
        
        logger.info("==========================================")