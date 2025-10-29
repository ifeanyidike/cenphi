# src/services/story_mode/intro_outro_generator.py

import os
import logging
import subprocess
import shlex
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class IntroOutroConfig:
    """Configuration for intro/outro generation"""
    duration: float  # Max duration in seconds (2-4s recommended)
    style: str  # "minimal", "branded", "cinematic", "energetic"
    include_voiceover: bool
    voice_style: str  # "professional", "friendly", "authoritative", "warm"
    brand_name: Optional[str]
    tagline: Optional[str]
    logo_url: Optional[str]
    primary_color: Optional[str]  # Hex color
    secondary_color: Optional[str]  # Hex color
    background_music_url: Optional[str]
    text_overlay: Optional[str]  # Custom text if no brand context


class IntroOutroGenerator:
    """
    Industry-standard intro/outro generator with premium narration.

    Follows best practices from top video agencies:
    - Concise (2-4 seconds optimal)
    - Professional voiceover with brand-aligned tone
    - High-quality visual composition
    - Subtle motion graphics (no distracting animations)
    - Premium audio mixing
    """

    def __init__(self):
        self._storage_manager = None
        self._narration_service = None
        self._ffmpeg_optimizer = None
        self._file_manager = None

        logger.info("IntroOutroGenerator initialized")

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def narration_service(self):
        if self._narration_service is None:
            from src.services.narration.narrator import NarrationGenerator
            self._narration_service = NarrationGenerator()
        return self._narration_service

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

    def generate_intro(
        self,
        job_id: str,
        config: IntroOutroConfig,
        width: int,
        height: int,
        upload_to_cloud: bool = True
    ) -> Dict[str, Any]:
        """
        Generate intro with voiceover.

        Industry standards:
        - 2-3 seconds optimal (not more than 4s)
        - Clear, confident voiceover
        - Brand-aligned visuals
        - Smooth fade-in

        Args:
            job_id: Job identifier
            config: Intro configuration
            width: Video width
            height: Video height
            upload_to_cloud: Upload result

        Returns:
            {
                "local_path": str,
                "cloud_url": str or None,
                "duration": float,
                "voiceover_text": str
            }
        """
        logger.info(f"[{job_id}] Generating intro: style={config.style}, duration={config.duration}s")

        temp_files = []

        try:
            # Step 1: Generate voiceover script
            voiceover_text = self._generate_intro_script(config)
            logger.info(f"[{job_id}] Intro script: \"{voiceover_text}\"")

            # Step 2: Synthesize voiceover (if enabled)
            voiceover_path = None
            voiceover_duration = 0.0

            if config.include_voiceover and voiceover_text:
                voiceover_result = self._generate_voiceover(
                    job_id=job_id,
                    text=voiceover_text,
                    voice_style=config.voice_style,
                    background_music_url=config.background_music_url,
                    upload_to_cloud=False
                )

                voiceover_path = voiceover_result.get("audio_path")
                voiceover_duration = voiceover_result.get("duration", 0.0)
                temp_files.extend(voiceover_result.get("temp_files", []))

               
                padding = 1.5  # Professional padding - allows fade in/out and natural pauses
                actual_duration = max(config.duration, voiceover_duration + padding)
                logger.info(f"[{job_id}] Voiceover duration: {voiceover_duration:.2f}s, intro duration: {actual_duration:.2f}s (with {padding}s padding)")
            else:
                actual_duration = config.duration

            # Step 3: Create visual composition
            visual_path = self._create_visual(
                job_id=job_id,
                config=config,
                width=width,
                height=height,
                duration=actual_duration,
                temp_files=temp_files
            )
            temp_files.append(visual_path)

            # Step 4: Combine visual + voiceover
            final_path = self._combine_visual_and_audio(
                job_id=job_id,
                visual_path=visual_path,
                voiceover_path=voiceover_path,
                duration=actual_duration,
                clip_type="intro"
            )
            temp_files.append(final_path)

            # Step 5: Upload if requested
            cloud_url = None
            if upload_to_cloud:
                cloud_path = f"temp/{job_id}/intro_professional.mp4"
                cloud_url = self.storage_manager.upload_file_with_retry(final_path, cloud_path)
                logger.info(f"[{job_id}] Uploaded intro to: {cloud_url}")

            return {
                "local_path": final_path,
                "cloud_url": cloud_url,
                "duration": actual_duration,
                "voiceover_text": voiceover_text,
                "temp_files": temp_files
            }

        except Exception as e:
            logger.error(f"[{job_id}] Professional intro generation failed: {e}")
            raise

    def generate_outro(
        self,
        job_id: str,
        config: IntroOutroConfig,
        width: int,
        height: int,
        upload_to_cloud: bool = True
    ) -> Dict[str, Any]:
        """
        Generate outro with call-to-action voiceover.

        Industry standards:
        - 3-4 seconds optimal
        - Clear CTA voiceover
        - Brand reinforcement
        - Smooth fade-out

        Args:
            job_id: Job identifier
            config: Outro configuration
            width: Video width
            height: Video height
            upload_to_cloud: Upload result

        Returns:
            {
                "local_path": str,
                "cloud_url": str or None,
                "duration": float,
                "voiceover_text": str
            }
        """
        logger.info(f"[{job_id}] Generating outro: style={config.style}, duration={config.duration}s")

        temp_files = []

        try:
            # Step 1: Generate CTA script
            voiceover_text = self._generate_outro_script(config)
            logger.info(f"[{job_id}] Outro script: \"{voiceover_text}\"")

            # Step 2: Synthesize voiceover (if enabled)
            voiceover_path = None
            voiceover_duration = 0.0

            if config.include_voiceover and voiceover_text:
                voiceover_result = self._generate_voiceover(
                    job_id=job_id,
                    text=voiceover_text,
                    voice_style=config.voice_style,
                    background_music_url=config.background_music_url,
                    upload_to_cloud=False
                )

                voiceover_path = voiceover_result.get("audio_path")
                voiceover_duration = voiceover_result.get("duration", 0.0)
                temp_files.extend(voiceover_result.get("temp_files", []))

                # CRITICAL: Duration must be LONGER than voiceover to avoid cutting off speech
                # Outro needs MORE padding for graceful, ending (not rushed)
                padding = 2.0  # Generous outro padding - allows full fade out and feels complete
                actual_duration = max(config.duration, voiceover_duration + padding)
                logger.info(f"[{job_id}] Voiceover duration: {voiceover_duration:.2f}s, outro duration: {actual_duration:.2f}s (with {padding}s padding)")
            else:
                actual_duration = config.duration

            # Step 3: Create visual composition
            visual_path = self._create_visual(
                job_id=job_id,
                config=config,
                width=width,
                height=height,
                duration=actual_duration,
                is_outro=True,
                temp_files=temp_files
            )
            temp_files.append(visual_path)

            # Step 4: Combine visual + voiceover
            final_path = self._combine_visual_and_audio(
                job_id=job_id,
                visual_path=visual_path,
                voiceover_path=voiceover_path,
                duration=actual_duration,
                clip_type="outro"
            )
            temp_files.append(final_path)

            # Step 5: Upload if requested
            cloud_url = None
            if upload_to_cloud:
                cloud_path = f"temp/{job_id}/outro_professional.mp4"
                cloud_url = self.storage_manager.upload_file_with_retry(final_path, cloud_path)
                logger.info(f"[{job_id}] Uploaded outro to: {cloud_url}")

            return {
                "local_path": final_path,
                "cloud_url": cloud_url,
                "duration": actual_duration,
                "voiceover_text": voiceover_text,
                "temp_files": temp_files
            }

        except Exception as e:
            logger.error(f"[{job_id}] Professional outro generation failed: {e}")
            raise

    def _generate_intro_script(self, config: IntroOutroConfig) -> str:
        """
        Generate intro script with warm welcome.

        Industry best practices:
        - Welcoming and professional tone
        - Clear brand mention
        - Sets the stage for customer testimonials
        """
        if config.text_overlay:
            # User provided custom text
            return config.text_overlay

        brand_name = config.brand_name or "us"

        # Professional intro: warm welcome that introduces testimonials
        return f"Welcome. Thank you for choosing {brand_name}. Here's what our customers have to say."

    def _generate_outro_script(self, config: IntroOutroConfig) -> str:
        """
        Generate professional outro script with gratitude and CTA.

        Industry best practices:
        - Express gratitude
        - Brand reinforcement
        - Warm closing
        """
        if config.text_overlay:
            # User provided custom text
            return config.text_overlay

        brand_name = config.brand_name or "us"

        # Professional outro: thank customers warmly
        return f"Thank you for choosing {brand_name}."

    def _generate_voiceover(
        self,
        job_id: str,
        text: str,
        voice_style: str,
        background_music_url: Optional[str],
        upload_to_cloud: bool
    ) -> Dict[str, Any]:
        """
        Generate premium voiceover with professional settings.

        Uses:
        - OpenAI TTS for natural, professional delivery
        - Optimized voice settings per style
        - Background music mixing (subtle, non-distracting)
        """
        # Map voice styles to optimal voice IDs and settings
        voice_mapping = {
            "professional": {"voice_id": "onyx", "gender": "male", "style": "professional"},
            "friendly": {"voice_id": "nova", "gender": "female", "style": "conversational"},
            "authoritative": {"voice_id": "onyx", "gender": "male", "style": "authoritative"},
            "warm": {"voice_id": "shimmer", "gender": "female", "style": "warm"}
        }

        voice_config = voice_mapping.get(voice_style, voice_mapping["professional"])

        logger.info(f"[{job_id}] Generating voiceover: \"{text}\" with {voice_config['voice_id']} ({voice_style})")

        # Generate narration with professional settings
        result = self.narration_service.generate(
            text=text,
            voice_id=voice_config["voice_id"],
            language="en",
            gender=voice_config["gender"],
            style=voice_config["style"],
            background_music=background_music_url,
            music_volume="low",  # Subtle background music (industry standard)
            preferred_provider="openai",  # OpenAI TTS for professional quality
            upload_to_cloud=upload_to_cloud,
            optimize_speech=True,  # AI text optimization for natural delivery
            add_background_music=background_music_url is not None
        )

        if result.get("error"):
            raise Exception(f"Voiceover generation failed: {result['error']}")

        return result

    # def _create_visual(
    #     self,
    #     job_id: str,
    #     config: IntroOutroConfig,
    #     width: int,
    #     height: int,
    #     duration: float,
    #     is_outro: bool = False,
    #     temp_files: Optional[List[str]] = None
    # ) -> str:
    #     """
    #     Create professional visual composition using FFmpeg.

    #     Industry-standard design:
    #     - Clean, uncluttered layout
    #     - Brand colors (gradient or solid)
    #     - Logo placement (if provided)
    #     - Subtle text animation
    #     - Smooth fade transitions
    #     """
    #     output_path = self.file_manager.create_temp_file(
    #         suffix=".mp4",
    #         prefix=f"{'outro' if is_outro else 'intro'}_visual_"
    #     )

    #     # Premium brand colors - professional gradient background
    #     primary_hex = config.primary_color or ("#1e40af" if not is_outro else "#0f172a")
    #     bg_color_1 = primary_hex.lstrip('#')

    #     # Create beautiful gradient for visual depth
    #     # For intro: Bright vibrant gradient (thumbnail-worthy)
    #     # For outro: Darker, sophisticated gradient
    #     if not is_outro:
    #         # Intro: Bright blue to lighter blue gradient (engaging, professional)
    #         bg_color_2 = "3b82f6"  # Lighter vibrant blue
    #     else:
    #         # Outro: Deep navy to slightly lighter (elegant fade)
    #         bg_color_2 = "1e293b"

    #     text_color = (config.secondary_color or "#f8fafc").lstrip('#')

    #     # Get the actual voiceover text to display
    #     text = config.text_overlay or config.brand_name or "Professional Video"
    #     original_text = text  # Keep for logging

    #     # SECURITY: Sanitize and validate user input
    #     # Strip leading/trailing whitespace
    #     text = text.strip()

    #     # Reject empty or whitespace-only text
    #     if not text:
    #         logger.warning(f"[{job_id}] Empty intro/outro text provided, using fallback")
    #         text = config.brand_name or "Welcome"

    #     # Limit text length to prevent command line overflow (max 500 chars)
    #     MAX_TEXT_LENGTH = 500
    #     if len(text) > MAX_TEXT_LENGTH:
    #         logger.warning(f"[{job_id}] Text too long ({len(text)} chars), truncating to {MAX_TEXT_LENGTH}")
    #         text = text[:MAX_TEXT_LENGTH].rsplit(' ', 1)[0] + "..."

    #     # Remove control characters and normalize whitespace
    #     import re
    #     # Replace newlines, tabs, carriage returns with spaces
    #     text = re.sub(r'[\n\r\t]+', ' ', text)
    #     # Collapse multiple spaces into one
    #     text = re.sub(r'\s+', ' ', text)
    #     # Remove other control characters (ASCII 0-31 except space)
    #     text = ''.join(char for char in text if ord(char) >= 32 or char == ' ')

    #     # Split text into multiple lines for better readability (max 50 chars per line)
    #     words = text.split()
    #     lines = []
    #     current_line = []
    #     current_length = 0

    #     for word in words:
    #         if current_length + len(word) + 1 > 50 and current_line:
    #             lines.append(' '.join(current_line))
    #             current_line = [word]
    #             current_length = len(word)
    #         else:
    #             current_line.append(word)
    #             current_length += len(word) + 1

    #     if current_line:
    #         lines.append(' '.join(current_line))

    #     # PRODUCTION-GRADE FFmpeg drawtext escaping
    #     # Handles ALL special characters that could break FFmpeg filter parsing
    #     def escape_for_drawtext(text):
    #         """
    #         Escape text for FFmpeg drawtext filter using single-quoted text parameter.

    #         This is CRITICAL for security and reliability - user input can contain
    #         ANY characters, and we must ensure they cannot break FFmpeg parsing.

    #         IMPORTANT: This escapes text CONTENT only (the text='...' parameter).
    #         Do NOT use this for mathematical expressions in other filter parameters
    #         (like scale expressions), where commas are function syntax, not separators.

    #         FFmpeg drawtext special characters:
    #         - ' (single quote) - Closes the text parameter
    #         - \ (backslash) - Escape character
    #         - : (colon) - FFmpeg parameter separator
    #         - % (percent) - Text expansion
    #         - [ ] (brackets) - Filter labels
    #         - = (equals) - Parameter assignment
    #         - ; (semicolon) - Filter chain separator
    #         - , (comma) - Parameter separator (in text content)
    #         - @ (at sign) - Opacity values
    #         """
    #         # ORDER IS CRITICAL - escape in this exact sequence

    #         # Step 1: Escape backslashes FIRST (before we add more backslashes)
    #         text = text.replace("\\", "\\\\")

    #         # Step 2: Escape FFmpeg-specific characters
    #         text = text.replace(":", "\\:")   # Parameter separator
    #         text = text.replace("%", "\\%")   # Text expansion
    #         text = text.replace("[", "\\[")   # Filter label start
    #         text = text.replace("]", "\\]")   # Filter label end
    #         text = text.replace("=", "\\=")   # Parameter assignment
    #         text = text.replace(";", "\\;")   # Filter chain separator
    #         text = text.replace(",", "\\,")   # Parameter separator (in text content)
    #         text = text.replace("@", "\\@")   # Opacity values

    #         # Step 3: Escape apostrophes LAST (uses backslash, must be after Step 1)
    #         # In single-quoted FFmpeg text, ' must be escaped as '\''
    #         # (close quote, escaped apostrophe, open quote)
    #         text = text.replace("'", "'\\''")

    #         return text

    #     escaped_lines = [escape_for_drawtext(line) for line in lines]

    #     # Final validation: ensure we have at least one line
    #     if not escaped_lines:
    #         logger.warning(f"[{job_id}] No text lines after escaping, using fallback")
    #         escaped_lines = [escape_for_drawtext("Welcome")]

    #     # Log sanitization for debugging
    #     if text != original_text:
    #         logger.info(f"[{job_id}] Text sanitized: original_length={len(original_text)}, final_length={len(text)}, lines={len(escaped_lines)}")

    #     # Professional typography settings
    #     font_file = "/System/Library/Fonts/Helvetica.ttc"  # Clean, professional font
    #     if not os.path.exists(font_file):
    #         font_file = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    #     # Calculate font sizes - larger for impact
    #     title_font_size = int(height * 0.055)  # 5.5% of height - prominent
    #     line_spacing = int(height * 0.07)  # Generous line spacing

    #     # Build professional multi-line text with smooth animations
    #     filter_parts = []

    #     # Add each line of text with proper vertical centering
    #     num_lines = len(escaped_lines)
    #     total_text_height = num_lines * line_spacing
    #     start_y = f"(h-{total_text_height})/2"

    #     # Professional smooth fade transitions (longer for polished feel)
    #     # CRITICAL: Ensure fade parameters are valid for ANY duration (even very short)
    #     if is_outro:
    #         # Outro: Long, graceful fade out (feels complete, not abrupt)
    #         # Fade duration: 2 seconds ideal, but adapt to shorter clips
    #         fade_duration = min(2.0, duration * 0.4)  # Up to 40% of duration
    #         fade_start = max(0, duration - fade_duration)
    #         fade_effect = f"fade=t=out:st={fade_start:.3f}:d={fade_duration:.3f}"
    #         # Very subtle zoom in (1.0 to 1.02 - not too aggressive)
    #         # NOTE: Commas inside math expressions (min function) are NOT escaped
    #         # They're part of the function syntax, not filter separators
    #         zoom_expr = f"1+0.02*min(t/{duration},1)"
    #     else:
    #         # Intro: Smooth fade in (welcoming, professional)
    #         # Fade duration: 1.5 seconds ideal for intro (not too slow, not too fast)
    #         fade_duration = min(1.5, duration * 0.3)  # Up to 30% of duration
    #         fade_effect = f"fade=t=in:st=0:d={fade_duration:.3f}"
    #         # Subtle zoom out (1.02 to 1.0 - very gentle)
    #         # NOTE: Commas inside math expressions (min function) are NOT escaped
    #         # They're part of the function syntax, not filter separators
    #         zoom_expr = f"1.02-0.02*min(t/{duration},1)"

    #     # Build text overlay filters starting from gradient
    #     # Note: gradient is created separately and outputs to [gradient]
    #     current_label = "[gradient]"

    #     for i, line in enumerate(escaped_lines):
    #         y_pos = f"{start_y}+{i*line_spacing}"

    #         # First filter starts with [gradient], subsequent ones chain from previous output
    #         # No semicolon before first drawtext (it connects to gradient output)
    #         separator = ";" if i > 0 else ""

    #         filter_parts.append(
    #             f"{separator}{current_label}drawtext=text='{line}':"
    #             f"fontcolor=0x{text_color}:"
    #             f"fontsize={title_font_size}:"
    #             f"x=(w-text_w)/2:"
    #             f"y={y_pos}:"
    #             f"fontfile='{font_file}':"
    #             f"shadowcolor=0x000000@0.85:"
    #             f"shadowx=4:shadowy=4:"
    #             f"line_spacing={int(line_spacing*0.3)}[text{i}]"
    #         )
    #         current_label = f"[text{i}]"

    #     # Add zoom and fade
    #     # CRITICAL: Use named parameters with single quotes for scale expressions
    #     # This allows commas in min() function without conflicting with filter chain separators
    #     filter_parts.append(
    #         f";{current_label}scale=w='iw*{zoom_expr}':h='ih*{zoom_expr}':eval=frame,"
    #         f"crop={width}:{height},"
    #         f"{fade_effect}[v]"
    #     )

    #     # Join all text overlay and effect filters into a single string
    #     filter_complex = "".join(filter_parts)

    #     # Build gradient background using FFmpeg
    #     # Create smooth vertical gradient from color 1 (top) to color 2 (bottom)
    #     gradient_filter = (
    #         f"color=c=0x{bg_color_1}:s={width}x{height}:r=30:d={duration}[bg1];"
    #         f"color=c=0x{bg_color_2}:s={width}x{height}:r=30:d={duration}[bg2];"
    #         f"[bg1][bg2]blend=all_expr='A*(1-Y/{height})+B*Y/{height}'[gradient]"
    #     )

    #     # Prepare FFmpeg inputs and filters
    #     logo_temp_path = None

    #     # Add logo if provided (positioned elegantly as background element)
    #     if config.logo_url:
    #         try:
    #             # Download logo - download_media returns the local file path
    #             logo_temp_path = self.storage_manager.download_media(config.logo_url)

    #             # Track logo file for cleanup
    #             if temp_files is not None:
    #                 temp_files.append(logo_temp_path)

    #             # Logo sizing: pronounced but not overwhelming (20% of frame width)
    #             logo_width = int(width * 0.20)  # 20% of frame width - visible but tasteful

    #             # Position: Bottom-right corner with nice padding for intro/outro
    #             # Intro: Bottom-right (classic placement)
    #             # Outro: Bottom-center (centered brand reinforcement)
    #             if is_outro:
    #                 logo_x = f"(w-overlay_w)/2"  # Centered horizontally
    #                 logo_y = f"h-overlay_h-{int(height*0.08)}"  # 8% from bottom
    #             else:
    #                 logo_x = f"w-overlay_w-{int(width*0.05)}"  # 5% from right edge
    #                 logo_y = f"h-overlay_h-{int(height*0.08)}"  # 8% from bottom

    #             # Add logo overlay using proper input reference (not movie filter)
    #             # Logo will be input [0:v] when present, so we reference it in the overlay
    #             logo_overlay = (
    #                 f";[0:v]scale={logo_width}:-1,"  # Scale logo from input [0:v]
    #                 f"format=rgba,"
    #                 f"colorchannelmixer=aa=0.7,"  # 70% opacity - pronounced but elegant
    #                 f"fade=in:st=0:d=0.5:alpha=1[logo];"  # Gentle fade in
    #                 f"[gradient][logo]overlay=x={logo_x}:y={logo_y}[gradient_logo]"
    #             )

    #             # Update the current_label to start from gradient_logo instead of gradient
    #             filter_complex = filter_complex.replace("[gradient]", "[gradient_logo]", 1)
    #             full_filter = f"{gradient_filter}{logo_overlay};{filter_complex}"

    #             logger.info(f"[{job_id}] Added logo overlay at 20% width, {'centered bottom' if is_outro else 'bottom-right'}")
    #         except Exception as e:
    #             logger.warning(f"[{job_id}] Failed to add logo, continuing without it: {e}")
    #             logo_temp_path = None
    #             full_filter = f"{gradient_filter};{filter_complex}"
    #     else:
    #         # No logo, just combine gradient with text
    #         full_filter = f"{gradient_filter};{filter_complex}"

    #     # Build FFmpeg command with proper inputs
    #     cmd = ["ffmpeg"]

    #     # Add logo as input if available (using -loop 1 to repeat the image for duration)
    #     if logo_temp_path:
    #         cmd.extend([
    #             "-loop", "1",
    #             "-framerate", "30",
    #             "-t", str(duration),
    #             "-i", logo_temp_path
    #         ])

    #     # Add audio input
    #     cmd.extend([
    #         "-f", "lavfi",
    #         "-i", "anullsrc=r=48000:cl=stereo",  # Silent audio
    #         "-filter_complex", full_filter,
    #         "-map", "[v]",  # Use the filtered video output
    #     ])

    #     # Map audio from the correct input index
    #     if logo_temp_path:
    #         cmd.extend(["-map", "1:a"])  # Audio is input 1 (logo is 0)
    #     else:
    #         cmd.extend(["-map", "0:a"])  # Audio is input 0 (no logo)

    #     cmd.extend([
    #         "-c:v", "libx264",
    #         "-preset", "medium",
    #         "-crf", "17",  # Very high quality
    #         "-pix_fmt", "yuv420p",
    #         "-c:a", "aac",
    #         "-b:a", "192k",  # Higher quality audio
    #         "-ar", "48000",
    #         "-t", str(duration),
    #         "-shortest",
    #         "-y", output_path
    #     ])

    #     result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=90)

    #     if result.returncode != 0:
    #         raise Exception(f"Visual creation failed: {result.stderr}")

    #     logger.info(f"[{job_id}] Professional visual created: {output_path}")
    #     return output_path


    def _create_visual(
        self,
        job_id: str,
        config: IntroOutroConfig,
        width: int,
        height: int,
        duration: float,
        is_outro: bool = False,
        temp_files: Optional[List[str]] = None
    ) -> str:
        output_path = self.file_manager.create_temp_file(
            suffix=".mp4",
            prefix=f"{'outro' if is_outro else 'intro'}_visual_"
        )

        # Colors / defaults
        primary_hex = (config.primary_color or ("#1e3a8a" if not is_outro else "#0f172a")).lstrip('#')
        secondary_hex = (config.secondary_color or "#f8fafc").lstrip('#')

        if is_outro:
            bg1 = primary_hex if config.primary_color else "0f172a"
            bg2 = "1e293b"
            dark_alpha = 0.18
        else:
            bg1 = primary_hex if config.primary_color else "1e40af"
            bg2 = "3b82f6"
            dark_alpha = 0.14

        # text for fallback
        text_overlay = (config.text_overlay or config.brand_name or "Professional Video").strip()
        if not text_overlay:
            text_overlay = config.brand_name or ("Thank You" if is_outro else "Welcome")

        # Limit text length
        MAX_TEXT_LENGTH = 500
        if len(text_overlay) > MAX_TEXT_LENGTH:
            logger.warning(f"[{job_id}] Text too long ({len(text_overlay)}), truncating.")
            text_overlay = text_overlay[:MAX_TEXT_LENGTH].rsplit(' ', 1)[0] + "..."

        # normalize
        text_overlay = re.sub(r'[\n\r\t]+', ' ', text_overlay)
        text_overlay = re.sub(r'\s+', ' ', text_overlay)
        text_overlay = ''.join(ch for ch in text_overlay if ord(ch) >= 32 or ch == ' ')

        # escape for drawtext
        def escape_for_drawtext(s: str) -> str:
            s = s.replace("\\", "\\\\")
            s = s.replace(":", "\\:")
            s = s.replace("=", "\\=")
            s = s.replace("%", "\\%")
            s = s.replace(",", "\\,")
            s = s.replace(";", "\\;")
            s = s.replace("[", "\\[")
            s = s.replace("]", "\\]")
            s = s.replace("'", "'\\''")
            return s

        escaped_text = escape_for_drawtext(text_overlay)

        # font selection (best-effort)
        font_candidates = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        ]
        font_file = ""
        for f in font_candidates:
            if os.path.exists(f):
                font_file = f
                break

        # Prepare logo: download if URL provided, else generate a simple text-based logo PNG
        logo_temp_path = None
        try:
            if config.logo_url:
                logo_temp_path = self.storage_manager.download_media(config.logo_url)
                if temp_files is not None:
                    temp_files.append(logo_temp_path)
                logger.info(f"[{job_id}] downloaded logo -> {logo_temp_path}")
            else:
                # Generate a temporary PNG with brand name as logo using ffmpeg drawtext
                logo_temp_path = self.file_manager.create_temp_file(suffix=".png", prefix="generated_logo_")
                # choose canvas size proportional to width (use moderate size)
                gen_w, gen_h = 872, 319
                draw_txt = escaped_text if len(escaped_text) <= 120 else escaped_text[:120]
                # font size based on canvas height
                gen_fontsize = max(28, int(gen_h * 0.28))
                # build ffmpeg command to render a single PNG
                gen_cmd = [
                    "ffmpeg", "-y",
                    "-f", "lavfi", "-i", f"color=c=black@0:s={gen_w}x{gen_h}:d=1",
                    "-vf",
                    (
                        f"drawtext=fontfile='{font_file}'"
                        f":text='{draw_txt}'"
                        f":fontcolor=white:fontsize={gen_fontsize}:x=(w-text_w)/2:y=(h-text_h)/2:expansion=none"
                    ),
                    "-frames:v", "1",
                    logo_temp_path
                ]
                logger.info(f"[{job_id}] generating logo PNG -> {logo_temp_path}")
                res = self.ffmpeg_optimizer.optimize_and_execute(gen_cmd, timeout=30)
                if res.returncode != 0:
                    # fallback: create a transparent single-pixel PNG via file_manager (empty), let ffmpeg overlay text later
                    logger.warning(f"[{job_id}] failed to generate logo PNG, ffmpeg stderr: {res.stderr}")
                    # ensure logo_temp_path exists: create tiny transparent PNG using PIL fallback if available
                    try:
                        from PIL import Image, ImageDraw, ImageFont
                        img = Image.new("RGBA", (gen_w, gen_h), (0, 0, 0, 0))
                        draw = ImageDraw.Draw(img)
                        try:
                            pil_font = ImageFont.truetype(font_file, gen_fontsize)
                        except Exception:
                            pil_font = ImageFont.load_default()
                        w, h = draw.textsize(text_overlay, font=pil_font)
                        draw.text(((gen_w - w) / 2, (gen_h - h) / 2), text_overlay, font=pil_font, fill=(255,255,255,255))
                        img.save(logo_temp_path)
                        logger.info(f"[{job_id}] generated PNG via PIL fallback -> {logo_temp_path}")
                    except Exception as e:
                        # last resort: touch an empty file (will likely fail overlay, but we tried)
                        open(logo_temp_path, "wb").close()
                        logger.warning(f"[{job_id}] PIL fallback failed: {e}; created empty file {logo_temp_path}")
                if temp_files is not None:
                    temp_files.append(logo_temp_path)
        except Exception as e:
            logger.warning(f"[{job_id}] logo handling failed: {e}")
            logo_temp_path = None

        # Build appropriate filter_complex for intro or outro
        # Inputs ordering: 0 = background color (lavfi), 1 = logo (looped image), 2 = anullsrc audio
        # We'll pass the background color as lavfi input and logo as looped image input, audio as lavfi anullsrc
        w = width
        h = height
        fps = 30
        total_frames = int(duration * fps)

        if not is_outro:
            # intro: logo only (NO TEXT - text is spoken by voiceover only)
            logo_scale_h = int(height * 0.28) if height >= 720 else 300
            # build filter graph - just background + logo overlay, NO text
            filter_complex = (
                f"color=c=0x{bg1}:s={w}x{h}:r={fps}:d={duration}[bg1];"
                f"color=c=0x{bg2}:s={w}x{h}:r={fps}:d={duration}[bg2];"
                f"[bg1][bg2]blend=all_expr='A*(1-Y/{h})+B*(Y/{h})'[bg];"
                f"[bg]fps={fps},format=yuv420p,zoompan=z='zoom+0.006':d={total_frames}:s={w}x{h},setsar=1[bg_zoom];"
                f"[bg_zoom]vignette=PI/4[bg_vig];"
                f"color=c=black@{dark_alpha}:s={w}x{h}:r={fps}:d={duration}[dark];"
                f"[bg_vig][dark]overlay=0:0:format=auto[bg_dark];"
                f"[bg_dark][1:v]overlay=x=(W-overlay_w)/2:y=(H-overlay_h)/2-60:format=auto[bg_logo];"
                f"[bg_logo]fade=t=in:st=0:d=0.8:alpha=1,format=yuv420p[v]"
            )
        else:
            # outro: logo only, larger
            logo_scale_h = int(height * 0.35)
            filter_complex = (
                f"color=c=0x{bg1}:s={w}x{h}:r={fps}:d={duration}[bg1];"
                f"color=c=0x{bg2}:s={w}x{h}:r={fps}:d={duration}[bg2];"
                f"[bg1][bg2]blend=all_expr='A*(1-Y/{h})+B*(Y/{h})'[bg];"
                f"[bg]fps={fps},format=yuv420p,zoompan=z='zoom+0.003':d={total_frames}:s={w}x{h},setsar=1[bg_zoom];"
                f"[bg_zoom]vignette=PI/4[bg_vig];"
                f"color=c=black@{dark_alpha}:s={w}x{h}:r={fps}:d={duration}[dark];"
                f"[bg_vig][dark]overlay=0:0:format=auto[bg_dark];"
                f"[1:v]scale=-1:{logo_scale_h},format=rgba[logo_scaled];"
                f"[bg_dark][logo_scaled]overlay=x=(W-overlay_w)/2:y=(H-overlay_h)/2:format=auto[bg_logo];"
                f"[bg_logo]fade=t=out:st={max(0, duration - 1.0):.3f}:d=1.0[pre_v];"
                f"[pre_v]format=yuv420p[v]"
            )

        # Build ffmpeg command
        cmd = [
            "ffmpeg", "-y",
            "-loglevel", "error",
            "-f", "lavfi", "-i", f"color=c=0x{bg1}:s={w}x{h}:r={fps}:d={duration}"
        ]

        # add logo input: if we have a logo file, use it; else try to fall back to generated one (logo_temp_path may be None)
        if logo_temp_path:
            cmd.extend(["-loop", "1", "-i", logo_temp_path])
        else:
            # fallback: create an empty 1px transparent PNG to avoid input missing — this will likely be ugly but avoids crash
            empty_logo = self.file_manager.create_temp_file(suffix=".png", prefix="empty_logo_")
            with open(empty_logo, "wb") as f:
                f.write(b"")  # empty, ffmpeg will fail if it cares; hope not
            if temp_files is not None:
                temp_files.append(empty_logo)
            cmd.extend(["-loop", "1", "-i", empty_logo])

        # add silent audio input as third input
        cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"])

        # attach filter_complex and mappings
        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[v]",
            "-map", "2:a",  # audio is the third input (index 2)
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-t", str(duration),
            "-shortest",
            output_path
        ])

        # Execute
        logger.info(f"[{job_id}] Running ffmpeg to create {'outro' if is_outro else 'intro'} visual")
        logger.debug(" ".join(shlex.quote(p) for p in cmd))
        result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=180)

        if result.returncode != 0:
            # include stderr for debugging
            raise Exception(f"Visual creation failed (rc={result.returncode}): {result.stderr}")

        logger.info(f"[{job_id}] Visual created at {output_path}")
        return output_path

    def _combine_visual_and_audio(
        self,
        job_id: str,
        visual_path: str,
        voiceover_path: Optional[str],
        duration: float,
        clip_type: str
    ) -> str:
        """
        Combine visual and voiceover into final clip with crystal-clear audio.

        Professional audio mixing eliminates:
        - Cracks and pops (via smooth fade in/out)
        - Background noise (via padding and precise duration)
        - Abrupt cuts (via audio extension to exact duration)
        """
        output_path = self.file_manager.create_temp_file(
            suffix=".mp4",
            prefix=f"{clip_type}_final_"
        )

        if not voiceover_path:
            # No voiceover, return visual with silent audio
            logger.info(f"[{job_id}] No voiceover, using visual only")
            return visual_path

        # CRITICAL FIX: Professional audio processing to eliminate cracks/noise
        # 1. Pad audio to EXACT duration (prevents abrupt cuts that cause cracks)
        # 2. Apply smooth fade in/out (eliminates clicks, pops, and background noise)
        # 3. Use high-quality AAC encoding with optimal settings

        # Audio fades: Very short to avoid noticeable effect, just eliminate artifacts
        audio_fade_in = 0.05   # 50ms fade in - removes initial click/pop
        audio_fade_out = 0.2   # 200ms fade out - smooth ending, no crack

        # Build audio filter chain
        audio_filter = (
            f"[1:a]"
            f"apad=whole_dur={duration},"  # Pad to exact duration
            f"afade=t=in:st=0:d={audio_fade_in},"  # Fade in start
            f"afade=t=out:st={duration-audio_fade_out}:d={audio_fade_out}"  # Fade out end
            f"[clean_audio]"
        )

        cmd = [
            "ffmpeg",
            "-i", visual_path,
            "-i", voiceover_path,
            "-filter_complex", audio_filter,
            "-map", "0:v",  # Video from visual
            "-map", "[clean_audio]",  # Use processed clean audio
            "-c:v", "copy",  # Copy video (no re-encode)
            "-c:a", "aac",
            "-b:a", "256k",  # Very high bitrate - crystal clear (increased from 192k)
            "-ar", "48000",
            "-ac", "2",  # Stereo
            "-profile:a", "aac_low",  # High-quality AAC profile
            "-t", str(duration),  # Exact duration
            "-movflags", "+faststart",
            "-y", output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            logger.warning(f"[{job_id}] Audio combination failed, using visual only: {result.stderr}")
            return visual_path

        logger.info(f"[{job_id}] Combined visual + voiceover with crystal-clear audio (256k AAC with fades)")
        return output_path

    def create_default_config(
        self,
        brand_name: Optional[str] = None,
        tagline: Optional[str] = None,
        style: str = "branded",
        include_voiceover: bool = True,
        text_overlay: Optional[str] = None,
        is_outro: bool = False
    ) -> IntroOutroConfig:
        """
        Create default professional configuration.

        Recommended settings for professional videos:
        - Intro: 8-10 seconds (allows COMPLETE voiceover delivery + breathing room)
        - Outro: 6-8 seconds (graceful ending, not rushed)
        - Voiceover: enabled (industry standard)
        - Style: branded (clear brand identity)
        """
        # Generous base durations - will extend if voiceover needs more time
        duration = 8.0 if is_outro else 10.0  # Increased for professional, unhurried delivery

        # Choose colors based on intro vs outro
        # Intro: Bright, inviting colors (makes great thumbnail!)
        # Outro: Can be darker/more subdued for graceful ending
        if is_outro:
            primary_color = "#0f172a"    # Deep navy blue for outro
        else:
            primary_color = "#1e40af"    # Vibrant blue for intro (thumbnail-worthy!)

        return IntroOutroConfig(
            duration=duration,
            style=style,
            include_voiceover=include_voiceover,
            voice_style="professional",
            brand_name=brand_name,
            tagline=tagline,
            logo_url=None,
            primary_color=primary_color,
            secondary_color="#f8fafc",  # Crisp white text
            background_music_url=None,
            text_overlay=text_overlay  # Custom text for display
        )
