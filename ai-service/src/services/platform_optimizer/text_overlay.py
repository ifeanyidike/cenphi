# src/services/platform_optimizer/text_overlay.py

"""
Animated text overlay service for brand intros and outros.
Production-grade implementation with FFmpeg 7.1.1 compatibility.
"""

import os
import re
import logging
import subprocess
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class AnimatedTextOverlay:
    """
    Professional animated text overlay service for brand intros and outros.

    Supports:
    - Brand intro animations (slide-in, fade-in)
    - Speaker information display
    - Brand outro with tagline
    - Multiple animation styles

    FFmpeg 7.1.1 compatible with Cloud Run optimizations.
    """

    def __init__(self):
        self._storage_manager = None
        self._session_manager = None
        self._ffmpeg_optimizer = None
        self._file_manager = None

        logger.info("AnimatedTextOverlay service initialized")

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def session_manager(self):
        if self._session_manager is None:
            from src.utils.session_manager import get_session_manager
            self._session_manager = get_session_manager()
        return self._session_manager

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer

    @property
    def file_manager(self):
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager

    def apply_text_overlays(
        self,
        video_path: str,
        config: Dict[str, Any],
        job_id: str,
        output_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Apply animated text overlays (intro and/or outro) to video.

        Args:
            video_path: Path to input video
            config: Configuration dict with:
                - enable_intro (bool): Enable brand intro
                - enable_outro (bool): Enable brand outro
                - workspace_name (str): Company/workspace name
                - speaker_name (str): Testimonial speaker name
                - role (str): Speaker role
                - location (str): Speaker location
                - tagline (str): Brand tagline
                - brand_color (str): Hex color for outro background
                - animation_style (str): "slide", "fade", "pop", "elegant"
                - intro_duration (float): Intro duration in seconds (default: 4.0)
                - outro_duration (float): Outro duration in seconds (default: 6.0)
            job_id: Job ID for caching
            output_dir: Output directory (optional, uses session cache if not provided)

        Returns:
            Dict with:
                - success (bool): Operation success
                - output_path (str): Path to output video
                - error (str): Error message if failed
                - duration (float): Video duration
                - width (int): Video width
                - height (int): Video height

        Raises:
            ValueError: If input validation fails
            RuntimeError: If FFmpeg processing fails
        """
        if not os.path.exists(video_path):
            error_msg = f"Input video not found: {video_path}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}

        try:
            # Validate config
            enable_intro = config.get('enable_intro', False)
            enable_outro = config.get('enable_outro', False)

            if not enable_intro and not enable_outro:
                logger.info("No overlays enabled, returning original video")
                video_info = self.storage_manager.get_video_info(video_path)
                return {
                    "success": True,
                    "output_path": video_path,
                    "duration": video_info.get("duration", 0),
                    "width": video_info.get("width", 0),
                    "height": video_info.get("height", 0)
                }

            # Get video info
            video_info = self.storage_manager.get_video_info(video_path)
            if not video_info:
                error_msg = "Could not get video information"
                logger.error(f"❌ {error_msg}")
                return {"success": False, "error": error_msg}

            duration = video_info.get("duration", 0)
            width = video_info.get("width", 1920)
            height = video_info.get("height", 1080)

            if duration <= 0:
                error_msg = f"Invalid video duration: {duration}"
                logger.error(f"❌ {error_msg}")
                return {"success": False, "error": error_msg}

            logger.info(f"[{job_id}] Applying text overlays - intro: {enable_intro}, outro: {enable_outro}")
            logger.info(f"[{job_id}] Video: {width}x{height}, {duration:.1f}s")

            # Prepare output path
            if output_dir is None:
                output_dir = self.session_manager.get_step_dir(job_id, "text_overlay")
            os.makedirs(output_dir, exist_ok=True)

            output_path = os.path.join(
                output_dir,
                f"text_overlay_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            )

            # Build FFmpeg filters
            filters = []

            if enable_intro:
                intro_duration = min(config.get('intro_duration', 4.0), duration * 0.3)
                intro_filters = self._build_intro_filters(
                    config=config,
                    duration=intro_duration,
                    style=config.get('animation_style', 'elegant'),
                    video_width=width,
                    video_height=height
                )
                filters.extend(intro_filters)
                logger.debug(f"[{job_id}] Added {len(intro_filters)} intro filters")

            if enable_outro:
                outro_duration = min(config.get('outro_duration', 6.0), duration * 0.3)
                outro_start = duration - outro_duration
                outro_filters = self._build_outro_filters(
                    config=config,
                    start_time=outro_start,
                    duration=outro_duration,
                    style=config.get('animation_style', 'elegant'),
                    video_width=width,
                    video_height=height
                )
                filters.extend(outro_filters)
                logger.debug(f"[{job_id}] Added {len(outro_filters)} outro filters")

            # Execute FFmpeg
            result = self._execute_ffmpeg(
                input_path=video_path,
                output_path=output_path,
                filters=filters,
                job_id=job_id
            )

            if result.get("error"):
                return result

            # Get output video info
            output_info = self.storage_manager.get_video_info(output_path)

            logger.info(f"[{job_id}] ✅ Text overlays applied successfully")

            # Store output in session cache for next stage (30-min TTL)
            self.session_manager.store_file(job_id, "text_overlay", output_path)
            logger.info(f"[{job_id}] Stored output in session cache for next stage")

            return {
                "success": True,
                "output_path": output_path,
                "duration": output_info.get("duration", duration),
                "width": output_info.get("width", width),
                "height": output_info.get("height", height)
            }

        except Exception as e:
            error_msg = f"Failed to apply text overlays: {str(e)}"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg}

    def _build_intro_filters(
        self,
        config: Dict[str, Any],
        duration: float,
        style: str,
        video_width: int,
        video_height: int
    ) -> List[str]:
        """
        Build FFmpeg drawtext filters for professional brand intro animation.

        Enhanced with:
        - Smooth easing curves (cubic bezier)
        - Subtle text shadows for readability
        - Better choreography and timing
        - Responsive layout for all aspect ratios

        Intro timeline:
        - 0 to duration/2: Workspace name slides in with ease
        - duration/2+0.3: Speaker name fades in (slight delay for elegance)
        - duration/2+0.8: Role and location fade in together

        Returns:
            List of FFmpeg filter strings
        """
        filters = []
        workspace_name = self._sanitize_text(config.get('workspace_name', ''))
        speaker_name = self._sanitize_text(config.get('speaker_name', ''))
        role = self._sanitize_text(config.get('role', ''))
        location = self._sanitize_text(config.get('location', ''))

        font_settings = self._get_font_settings(style, video_width, video_height)
        mid_point = duration / 2.0

        # Timing choreography for natural flow
        # Ensure timings don't exceed duration (for very short intros)
        speaker_start = min(mid_point + 0.3, duration - 0.5)  # At least 0.5s to show
        info_start = min(mid_point + 0.8, duration - 0.2)     # At least 0.2s to show

        # 1. Workspace name - smooth slide-in with easing (0 to mid_point+1)
        if workspace_name:
            workspace_lines = self._split_text_lines(workspace_name, max_chars=30)

            for line_idx, line in enumerate(workspace_lines):
                escaped_line = self._escape_for_drawtext(line)
                y_offset = line_idx * (font_settings['brand_size'] + 12)

                # Calculate Y position with better vertical centering
                if font_settings['format_type'] == 'portrait':
                    # Portrait: Higher up for better composition
                    base_y = (video_height // 3) - (font_settings['brand_size'] // 2)
                else:
                    # Landscape/Square: Center
                    base_y = (video_height // 2) - (font_settings['brand_size'] + 30)

                workspace_filter = (
                    f"drawtext="
                    f"text='{escaped_line}':"
                    f"fontsize={font_settings['brand_size']}:"
                    f"fontcolor={font_settings['color']}:"
                    f"borderw=3:"
                    f"bordercolor={font_settings['border']}:"
                    # Add subtle shadow for depth and readability
                    f"shadowx=2:"
                    f"shadowy=2:"
                    f"shadowcolor={font_settings['shadow_color']}:"
                    # Smooth slide-in with ease-out (cubic bezier approximation)
                    # Using t^3 for smooth deceleration
                    f"x='if(lt(t,{mid_point}), (w-text_w)/2 - 500 + 500*pow(t/{mid_point},3), (w-text_w)/2)':"
                    f"y={base_y + y_offset}:"
                    # Smooth alpha fade-in with ease (0 to 0.8s)
                    f"alpha='if(lt(t,0.8), pow(t/0.8,2), 1)':"
                    f"enable='between(t,0,{mid_point + 1})'"
                )
                filters.append(workspace_filter)

        # 2. Speaker name - elegant fade-in with slight delay
        if speaker_name:
            escaped_name = self._escape_for_drawtext(speaker_name)

            # Smart positioning based on aspect ratio
            if font_settings['format_type'] == 'portrait':
                # Portrait: Place between brand and middle for balance
                speaker_y = (video_height // 2) - 80
            else:
                # Landscape/Square: Below center
                speaker_y = (video_height // 2) + 30

            speaker_filter = (
                f"drawtext="
                f"text='{escaped_name}':"
                f"fontsize={font_settings['speaker_size']}:"
                f"fontcolor={font_settings['color']}:"
                f"borderw=2:"
                f"bordercolor={font_settings['border']}:"
                # Subtle shadow for depth
                f"shadowx=2:"
                f"shadowy=2:"
                f"shadowcolor={font_settings['shadow_color']}:"
                f"x='(w-text_w)/2':"
                f"y={speaker_y}:"
                # Smooth ease-in fade with cubic curve
                f"alpha='if(lt(t,{speaker_start}), 0, if(lt(t,{speaker_start+0.6}), pow((t-{speaker_start})/0.6,2), 1))':"
                f"enable='between(t,{speaker_start},{duration})'"
            )
            filters.append(speaker_filter)

        # 3. Role and Location - synchronized fade-in with stagger
        if role:
            role_lines = role.split()

            # Responsive positioning
            if font_settings['format_type'] == 'portrait':
                role_x = 80  # Slightly more padding in portrait
                role_base_y = video_height - 280  # Higher to avoid captions
            else:
                role_x = 100
                role_base_y = video_height - 220

            for line_idx, line in enumerate(role_lines):
                escaped_line = self._escape_for_drawtext(line)
                # Slight stagger for multi-line elegance
                line_delay = line_idx * 0.1

                role_filter = (
                    f"drawtext="
                    f"text='{escaped_line}':"
                    f"fontsize={font_settings['info_size']}:"
                    f"fontcolor={font_settings['secondary_color']}:"
                    # Shadow for readability
                    f"shadowx=1:"
                    f"shadowy=1:"
                    f"shadowcolor=black@0.4:"
                    f"x={role_x}:"
                    f"y={role_base_y + (line_idx * 38)}:"
                    # Smooth ease-in
                    f"alpha='if(lt(t,{info_start+line_delay}), 0, if(lt(t,{info_start+line_delay+0.5}), pow((t-{info_start+line_delay})/0.5,2), 1))':"
                    f"enable='between(t,{info_start+line_delay},{duration})'"
                )
                filters.append(role_filter)

        if location:
            escaped_location = self._escape_for_drawtext(location)

            # Location positioning - upper area, subtle
            if font_settings['format_type'] == 'portrait':
                location_y = (video_height // 3) - (font_settings['brand_size'] + 60)
            else:
                location_y = (video_height // 2) - (font_settings['brand_size'] + 60)

            location_filter = (
                f"drawtext="
                f"text='{escaped_location}':"
                f"fontsize={font_settings['info_size']}:"
                f"fontcolor={font_settings['secondary_color']}:"
                # Shadow for readability
                f"shadowx=1:"
                f"shadowy=1:"
                f"shadowcolor=black@0.4:"
                f"x='(w-text_w)/2':"
                f"y={location_y}:"
                # Synchronized smooth fade with role
                f"alpha='if(lt(t,{info_start}), 0, if(lt(t,{info_start+0.5}), pow((t-{info_start})/0.5,2), 1))':"
                f"enable='between(t,{info_start},{duration})'"
            )
            filters.append(location_filter)

        return filters

    def _build_outro_filters(
        self,
        config: Dict[str, Any],
        start_time: float,
        duration: float,
        style: str,
        video_width: int,
        video_height: int
    ) -> List[str]:
        """
        Build FFmpeg drawtext filters for professional brand outro animation.

        Enhanced with:
        - Smooth easing curves (cubic bezier)
        - Subtle text shadows for readability
        - Better choreography and timing
        - Responsive layout for all aspect ratios

        Outro timeline:
        - start_time to start_time+1: Workspace name elegant fade-in
        - start_time+1.2 to end: Tagline appears with smooth ease

        Returns:
            List of FFmpeg filter strings
        """
        filters = []
        workspace_name = self._sanitize_text(config.get('workspace_name', ''))
        tagline = self._sanitize_text(config.get('tagline', ''))

        font_settings = self._get_font_settings(style, video_width, video_height)

        # Better choreography - tagline appears shortly after brand name
        # Ensure tagline has time to show (for short outros)
        end_time = start_time + duration
        # For short outros, tagline starts immediately; for longer ones, delay by 1.2s
        tagline_start = max(start_time, min(start_time + 1.2, end_time - 1.0))  # At least 1s to show

        # 1. Workspace name - elegant fade-in (start_time to end)
        if workspace_name:
            workspace_lines = self._split_text_lines(workspace_name, max_chars=30)

            for line_idx, line in enumerate(workspace_lines):
                escaped_line = self._escape_for_drawtext(line)
                y_offset = line_idx * (font_settings['brand_size'] + 12)

                # Responsive positioning for better composition
                if font_settings['format_type'] == 'portrait':
                    # Portrait: Upper third for balance
                    base_y = (video_height // 3) - (font_settings['brand_size'] // 2)
                else:
                    # Landscape/Square: Center-top
                    base_y = (video_height // 2) - (font_settings['brand_size'] + 80)

                workspace_filter = (
                    f"drawtext="
                    f"text='{escaped_line}':"
                    f"fontsize={font_settings['brand_size']}:"
                    f"fontcolor={font_settings['color']}:"
                    f"borderw=3:"
                    f"bordercolor={font_settings['border']}:"
                    # Subtle shadow for depth
                    f"shadowx=2:"
                    f"shadowy=2:"
                    f"shadowcolor={font_settings['shadow_color']}:"
                    f"x='(w-text_w)/2':"
                    f"y={base_y + y_offset}:"
                    # Smooth ease-in fade (1 second)
                    f"alpha='if(lt(t,{start_time}), 0, if(lt(t,{start_time+1}), pow((t-{start_time})/1,2), 1))':"
                    f"enable='gte(t,{start_time})'"
                )
                filters.append(workspace_filter)

        # 2. Tagline - elegant fade-in with slight delay
        if tagline:
            tagline_lines = self._split_text_lines(tagline, max_chars=40)

            # Calculate base Y for tagline with better spacing
            if font_settings['format_type'] == 'portrait':
                # Portrait: Below brand with good spacing
                tagline_base_y = (video_height // 3) + (font_settings['brand_size'] + 40)
            else:
                # Landscape/Square: Below center
                tagline_base_y = (video_height // 2) + 40

            for line_idx, line in enumerate(tagline_lines):
                escaped_line = self._escape_for_drawtext(line)
                y_offset = line_idx * (font_settings['tagline_size'] + 12)
                # Slight stagger for multi-line elegance
                line_delay = line_idx * 0.15

                tagline_filter = (
                    f"drawtext="
                    f"text='{escaped_line}':"
                    f"fontsize={font_settings['tagline_size']}:"
                    f"fontcolor={font_settings['color']}:"
                    f"borderw=2:"
                    f"bordercolor={font_settings['border']}:"
                    # Subtle shadow
                    f"shadowx=2:"
                    f"shadowy=2:"
                    f"shadowcolor={font_settings['shadow_color']}:"
                    f"x='(w-text_w)/2':"
                    f"y={tagline_base_y + y_offset}:"
                    # Smooth ease-in fade (0.8 seconds)
                    f"alpha='if(lt(t,{tagline_start+line_delay}), 0, if(lt(t,{tagline_start+line_delay+0.8}), pow((t-{tagline_start+line_delay})/0.8,2), 1))':"
                    f"enable='gte(t,{tagline_start+line_delay})'"
                )
                filters.append(tagline_filter)

        return filters

    def _calculate_responsive_font_sizes(
        self,
        video_width: int,
        video_height: int
    ) -> Dict[str, int]:
        """
        Calculate professional, responsive font sizes based on video dimensions and aspect ratio.

        This ensures text looks perfect on any video format:
        - Portrait (9:16, TikTok/Instagram): Optimized for vertical viewing
        - Square (1:1, Instagram): Balanced sizing
        - Landscape (16:9, YouTube): Professional presentation sizing

        Font sizes scale proportionally to video dimensions while maintaining readability.
        """
        # Calculate aspect ratio
        aspect_ratio = video_width / video_height if video_height > 0 else 1.78

        # Determine video format
        if aspect_ratio < 0.75:
            # Portrait (9:16 ≈ 0.56, 4:5 ≈ 0.8)
            format_type = "portrait"
            base_size = min(video_width, video_height) / 12  # Base on narrower dimension
        elif aspect_ratio < 1.2:
            # Square-ish (1:1)
            format_type = "square"
            base_size = (video_width + video_height) / 32
        else:
            # Landscape (16:9 ≈ 1.78, 4:3 ≈ 1.33)
            format_type = "landscape"
            base_size = video_height / 18  # Base on height for landscape

        # Apply resolution scaling factor (avoid too small on low-res videos)
        pixel_count = video_width * video_height
        if pixel_count < 500000:  # < 720p
            scale_factor = 1.2  # Boost for low-res
        elif pixel_count < 2073600:  # < 1080p
            scale_factor = 1.0
        elif pixel_count < 8294400:  # < 4K
            scale_factor = 0.95
        else:  # 4K+
            scale_factor = 0.85  # Reduce for ultra-high-res

        base_size *= scale_factor

        # Calculate all font sizes with professional hierarchy
        # Brand name: Largest (110% of base) - slightly increased for better visibility
        # Speaker name: Medium-large (72% of base) - slightly increased
        # Info/tagline: Readable (60% of base) - slightly increased
        # Role/location: Smaller (50% of base) - slightly increased

        sizes = {
            "brand_size": int(base_size * 1.1),        # Primary brand name (increased from 1.0)
            "speaker_size": int(base_size * 0.72),     # Speaker name (increased from 0.65)
            "tagline_size": int(base_size * 0.60),     # Tagline/motto (increased from 0.55)
            "info_size": int(base_size * 0.50),        # Role/location info (increased from 0.45)
            "format_type": format_type,
            "aspect_ratio": aspect_ratio
        }

        # Enforce reasonable bounds (prevent extreme sizes)
        sizes["brand_size"] = max(26, min(sizes["brand_size"], 130))      # Slightly increased mins/maxs
        sizes["speaker_size"] = max(20, min(sizes["speaker_size"], 88))   # Slightly increased mins/maxs
        sizes["tagline_size"] = max(18, min(sizes["tagline_size"], 76))   # Slightly increased mins/maxs
        sizes["info_size"] = max(16, min(sizes["info_size"], 56))         # Slightly increased mins/maxs

        return sizes

    def _get_font_settings(
        self,
        style: str,
        video_width: int = 1920,
        video_height: int = 1080
    ) -> Dict[str, Any]:
        """
        Get responsive font settings based on animation style and video dimensions.

        Now includes dynamic sizing for professional appearance on any video format.
        """
        # Calculate responsive font sizes
        sizes = self._calculate_responsive_font_sizes(video_width, video_height)

        # Font must exist in container - Cloud Run uses DejaVu fonts
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

        # Style-specific color schemes (professional and readable)
        color_schemes = {
            "elegant": {
                "color": "white",
                "secondary_color": "#E5E7EB",  # Lighter for better contrast
                "border": "black@0.7",         # Semi-transparent black border
                "shadow_color": "black@0.5"
            },
            "slide": {
                "color": "white",
                "secondary_color": "#F3F4F6",
                "border": "#1F2937@0.8",
                "shadow_color": "black@0.6"
            },
            "fade": {
                "color": "#FFFFFF",
                "secondary_color": "#E5E7EB",
                "border": "#111827@0.7",
                "shadow_color": "black@0.5"
            },
            "pop": {
                "color": "#FFFFFF",            # Pure white for pop style
                "secondary_color": "#FEF3C7",  # Warm accent
                "border": "#92400E@0.8",       # Darker border for contrast
                "shadow_color": "black@0.7"
            }
        }

        colors = color_schemes.get(style, color_schemes["elegant"])

        return {
            "font": font_path,
            "brand_size": sizes["brand_size"],
            "speaker_size": sizes["speaker_size"],
            "info_size": sizes["info_size"],
            "tagline_size": sizes["tagline_size"],
            "format_type": sizes["format_type"],
            "aspect_ratio": sizes["aspect_ratio"],
            **colors
        }

    def _sanitize_text(self, text: str) -> str:
        """
        Sanitize text for FFmpeg drawtext filter.

        Based on intro_outro_generator.py patterns.
        """
        if not text:
            return ""

        # Limit length
        text = text.strip()[:500]

        # Normalize whitespace
        text = re.sub(r'[\n\r\t]+', ' ', text)
        text = re.sub(r'\s+', ' ', text)

        # Remove control characters (keep only ASCII >= 32)
        text = ''.join(char for char in text if ord(char) >= 32)

        return text.strip()

    def _split_text_lines(self, text: str, max_chars: int = 50) -> List[str]:
        """
        Split text into lines for better readability.
        """
        if len(text) <= max_chars:
            return [text]

        words = text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            word_length = len(word) + (1 if current_line else 0)
            if current_length + word_length <= max_chars:
                current_line.append(word)
                current_length += word_length
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)

        if current_line:
            lines.append(' '.join(current_line))

        return lines[:3]  # Max 3 lines

    def _escape_for_drawtext(self, text: str) -> str:
        """
        Escape text for FFmpeg drawtext filter.

        CRITICAL: Order matters! Must escape in this exact sequence:
        1. Backslashes first
        2. FFmpeg special characters
        3. Single quotes last

        Based on intro_outro_generator.py (lines 728-748) and test_ffmpeg_escaping.py
        """
        if not text:
            return ""

        # Step 1: Backslashes FIRST
        text = text.replace("\\", "\\\\")

        # Step 2: FFmpeg special characters
        text = text.replace(":", "\\:")      # Parameter separator
        text = text.replace("%", "\\%")      # Text expansion
        text = text.replace("[", "\\[")      # Filter labels
        text = text.replace("]", "\\]")
        text = text.replace("=", "\\=")      # Parameter assignment
        text = text.replace(";", "\\;")      # Filter chain separator
        text = text.replace(",", "\\,")      # Parameter separator
        text = text.replace("@", "\\@")      # Opacity values

        # Step 3: Single quotes LAST (uses backslash from Step 1)
        text = text.replace("'", "'\\''")    # Shell-safe escaping

        return text

    def _execute_ffmpeg(
        self,
        input_path: str,
        output_path: str,
        filters: List[str],
        job_id: str
    ) -> Dict[str, Any]:
        """
        Execute FFmpeg command with text overlay filters.

        Uses Cloud Run optimized settings:
        - CRF 17 for excellent quality
        - Preset medium for balanced speed/quality
        - Threads 2 for Cloud Run (2 CPU)
        """
        if not filters:
            # No filters to apply
            import shutil
            shutil.copy2(input_path, output_path)
            return {"success": True, "output_path": output_path}

        # Build filter_complex
        filter_complex = ','.join(filters)

        # Build FFmpeg command
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-vf', filter_complex,
            # Video encoding (match visual_overlay.py quality)
            '-c:v', 'libx264',
            '-crf', '17',                    # Excellent quality
            '-preset', 'medium',             # Balanced
            '-threads', '2',                 # Cloud Run optimization
            '-x264-params', 'ref=5:bframes=3:me=umh:subme=7:trellis=2',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'high',
            '-level', '4.1',
            # Audio encoding
            '-c:a', 'aac',
            '-b:a', '192k',
            # Web optimization
            '-movflags', '+faststart',
            # Overwrite output
            '-y',
            output_path
        ]

        logger.debug(f"[{job_id}] FFmpeg command: {' '.join(cmd[:6])}... (filter complex with {len(filters)} filters)")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
                timeout=600  # 10 minute timeout for complex filters
            )

            if result.returncode == 0:
                logger.info(f"[{job_id}] ✅ FFmpeg completed successfully")
                return {"success": True, "output_path": output_path}
            else:
                error_msg = f"FFmpeg failed with code {result.returncode}: {result.stderr}"
                logger.error(f"[{job_id}] ❌ {error_msg}")
                return {"success": False, "error": error_msg}

        except subprocess.TimeoutExpired:
            error_msg = "FFmpeg timeout after 10 minutes"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"FFmpeg execution error: {str(e)}"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg}
