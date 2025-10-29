# src/services/clipping/visual_overlay.py

import os
import uuid
import subprocess
import logging
import re
import tempfile
from typing import Optional, Dict, Any, List


logger = logging.getLogger(__name__)

class VisualOverlay:
    """Professional visual overlay system for subtitles, themes, and logos"""
    
    def __init__(self):
        self._storage_manager = None
        self._file_manager = None
        self._ffmpeg_optimizer = None
        self.theme_configs = {
            "emotional": {
                "color": "#FF6B9D",
                "icon": "💗",
                "position": "top_center",
                "font_size_multiplier": 1.2,
                "style": "elegant"
            },
            "entertaining": {
                "color": "#FFD93D",
                "icon": "🎉",
                "position": "top_center",
                "font_size_multiplier": 1.1,
                "style": "playful"
            },
            "inspiring": {
                "color": "#6BCF7F",
                "icon": "✨",
                "position": "top_center",
                "font_size_multiplier": 1.15,
                "style": "bold"
            },
            "educational": {
                "color": "#4D96FF",
                "icon": "📚",
                "position": "top_center",
                "font_size_multiplier": 1.0,
                "style": "clean"
            },
            "testimonial": {
                "color": "#9B59B6",
                "icon": "⭐",
                "position": "top_center",
                "font_size_multiplier": 1.1,
                "style": "professional"
            },
            "success": {
                "color": "#2ECC71",
                "icon": "🚀",
                "position": "top_center",
                "font_size_multiplier": 1.2,
                "style": "bold"
            },
            "transformation": {
                "color": "#E67E22",
                "icon": "🔄",
                "position": "top_center",
                "font_size_multiplier": 1.1,
                "style": "dynamic"
            },
            "roi": {
                "color": "#F39C12",
                "icon": "💰",
                "position": "top_center",
                "font_size_multiplier": 1.0,
                "style": "professional"
            },
            "recommendation": {
                "color": "#3498DB",
                "icon": "👍",
                "position": "top_center",
                "font_size_multiplier": 1.0,
                "style": "friendly"
            }
        }
        
        logger.debug("VisualOverlay initialized")

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    
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
    
    def apply_overlays(
        self,
        clip_path: str,
        text: str = "",
        theme: str = "",
        logo_config: Optional[Dict[str, Any]] = None,
        watermark_config: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Apply visual overlays to clip with enhanced error handling and watermark support
        
        Args:
            clip_path: Path to source clip
            text: Subtitle text
            theme: Theme name for theme overlay
            logo_config: Logo configuration dict
            watermark_config: Watermark configuration dict
            output_dir: Output directory
            
        Returns:
            Path to processed clip or None if failed
        """
        try:
            if not os.path.exists(clip_path):
                raise ValueError(f"Clip not found: {clip_path}")
            
            # Validate inputs
            text = text.strip() if text else ""
            theme = theme.strip() if theme else ""
            
            # Check if any overlays are actually needed
            has_text = bool(text)
            has_theme = bool(theme and theme in self.theme_configs)
            has_logo = bool(logo_config and logo_config.get("logo_path"))
            has_watermark = bool(watermark_config)
            
            if not (has_text or has_theme or has_logo or has_watermark):
                logger.debug("No overlays needed, returning original clip")
                return clip_path
            
            # Generate output path
            output_path = self.file_manager.create_temp_video("overlay_")
            
            # Get clip dimensions with validation
            clip_info = self.storage_manager.get_video_info(clip_path)
            if not clip_info:
                raise Exception("Failed to get clip dimensions")
            
            width, height = clip_info["width"], clip_info["height"]
            
            # Validate dimensions
            if width < 100 or height < 100:
                raise Exception(f"Invalid clip dimensions: {width}x{height}")
            
            # Build overlay filters progressively
            filters = []
            current_label = "[0:v]"
            input_index = 1  # Start from 1 since 0 is the main video
            

            # Add watermark overlay FIRST (background layer)
            if has_watermark:
                try:
                    watermark_filter, new_label = self._build_watermark_filter(
                        watermark_config, width, height, current_label
                    )
                    if watermark_filter and new_label:
                        filters.append(watermark_filter)
                        current_label = new_label
                        logger.debug("Watermark overlay filter added")
                    else:
                        logger.warning("Watermark filter creation failed")
                except Exception as e:
                    logger.warning(f"Watermark filter error: {e}")

            # Add logo overlay with error handling
            if has_logo:
                try:
                    logo_filter, new_label = self._build_logo_filter(
                        logo_config, width, height, input_index, current_label
                    )
                    if logo_filter and new_label:
                        filters.append(logo_filter)
                        current_label = new_label
                        input_index += 1
                        logger.debug("Logo overlay filter added")
                    else:
                        logger.warning("Logo filter creation failed")
                        has_logo = False  # Disable logo for command building
                except Exception as e:
                    logger.warning(f"Logo filter error: {e}")
                    has_logo = False
            
            # # Add watermark overlay
            # if has_watermark:
            #     try:
            #         watermark_filter, new_label = self._build_watermark_filter(
            #             watermark_config, width, height, current_label
            #         )
            #         if watermark_filter and new_label:
            #             filters.append(watermark_filter)
            #             current_label = new_label
            #             logger.debug("Watermark overlay filter added")
            #         else:
            #             logger.warning("Watermark filter creation failed")
            #     except Exception as e:
            #         logger.warning(f"Watermark filter error: {e}")
            
            # Add theme overlay with error handling
            if has_theme:
                try:
                    theme_filter, new_label = self._build_theme_filter(
                        theme, width, height, current_label
                    )
                    if theme_filter and new_label:
                        filters.append(theme_filter)
                        current_label = new_label
                        logger.debug("Theme overlay filter added")
                    else:
                        logger.warning("Theme filter creation failed")
                except Exception as e:
                    logger.warning(f"Theme filter error: {e}")
            
            # Add subtitle overlay with error handling  
            if has_text:
                try:
                    subtitle_filter, new_label = self._build_subtitle_filter(
                        text, width, height, current_label
                    )
                    if subtitle_filter and new_label:
                        filters.append(subtitle_filter)
                        current_label = new_label
                        logger.debug("Subtitle overlay filter added")
                    else:
                        logger.warning("Subtitle filter creation failed")
                except Exception as e:
                    logger.warning(f"Subtitle filter error: {e}")
            
            # If no valid filters were created, just copy the file
            if not filters:
                logger.debug("No valid filters created, copying original file")
                return self._copy_clip(clip_path, output_path)
            
            # Build and execute command with timeout
            try:
                cmd = self._build_overlay_command(
                    clip_path, output_path, filters, current_label, 
                    logo_config if has_logo else None
                )
                
                if not cmd:
                    raise Exception("Failed to build overlay command")
                
                # Execute overlay with extended timeout for complex overlays
                timeout = 300 + (len(filters) * 60)  # Base 5 min + 1 min per filter
                logger.debug(f"Applying overlays to {clip_path} (timeout: {timeout}s)")
                
                # result = subprocess.run(
                #     cmd,
                #     capture_output=True,
                #     text=True,
                #     timeout=timeout,
                #     check=False
                # )
                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=timeout, check=False, video_info=clip_info)
                
                if result.returncode != 0:
                    logger.error(f"FFmpeg command: {' '.join(cmd)}")
                    raise Exception(f"FFmpeg overlay failed: {result.stderr}")
                
            except subprocess.TimeoutExpired:
                logger.error("Overlay processing timeout")
                return None
            
            # Verify output with detailed checks
            if not os.path.exists(output_path):
                logger.error(f"Overlay output not created: {output_path}")
                return None
            
            output_size = os.path.getsize(output_path)
            if output_size < 1024:
                logger.error(f"Overlay output too small: {output_size} bytes")
                self._safe_cleanup(output_path)
                return None
            
            logger.debug(f"Overlays applied successfully: {output_path} ({output_size} bytes)")
            return output_path
            
        except Exception as e:
            logger.error(f"Overlay application failed: {e}")
            return None
        

    def _build_watermark_filter(
        self,
        watermark_config: Dict[str, Any],
        video_width: int,
        video_height: int,
        input_label: str
    ) -> tuple:
        """Build background watermark overlay filter"""
        
        try:
            watermark_text = watermark_config.get("text", "")
            # Force center position for background watermark
            watermark_opacity = watermark_config.get("opacity", 0.15)  # Much more transparent
            watermark_color = watermark_config.get("color", "#FFFFFF")

            if not watermark_color or watermark_color in [None, "None", "", "null"]:
                watermark_color = "#FFFFFF"

            if not watermark_color.startswith('#'):
                watermark_color = "#FFFFFF"
            
            if not watermark_text:
                return None, None
            
            # Clean watermark text
            clean_watermark_text = self._clean_subtitle_text(watermark_text)
            if not clean_watermark_text:
                return None, None
            
            # Calculate larger font size for background watermark
            font_size = max(int(video_width * 0.12), 64)  # Much larger for background effect
            
            # Always center for background watermark
            x_pos = "(w-text_w)/2"
            y_pos = "(h-text_h)/2"
            
            output_label = "[watermark_overlay]"
            
            # Build background watermark filter with rotation and transparency
            filter_params = [
                f"text='{clean_watermark_text}'",
                f"fontsize={font_size}",
                f"fontcolor={watermark_color}@{watermark_opacity}",  # Very transparent
                f"x={x_pos}",
                f"y={y_pos}",
                # f"angle=45*PI/180",  # 45-degree rotation for watermark effect
                f"shadowcolor=black@0.05",  # Very subtle shadow
                f"shadowx=1",
                f"shadowy=1"
                # Removed box background for cleaner watermark look
            ]
            
            # Build filter with proper syntax
            watermark_filter = f"{input_label}drawtext={':'.join(filter_params)}{output_label}"
            logger.debug(f"Watermark filter created: {watermark_filter}")
            return watermark_filter, output_label
            
        except Exception as e:
            logger.error(f"Watermark filter build failed: {e}")
            return None, None

    def _build_logo_filter(
        self,
        logo_config: Dict[str, Any],
        video_width: int,
        video_height: int,
        input_index: int,
        input_label: str
    ) -> tuple:
        """Build logo overlay filter"""
        
        try:
            logo_path = logo_config.get("logo_path", "")
            if not os.path.exists(logo_path):
                return None, None
            
            # Calculate logo size (12.5% of video width, max 150px)
            logo_size = min(video_width // 8, 150)
            
            # Position logo (top-right with padding)
            padding = 20
            x_pos = video_width - logo_size - padding
            y_pos = padding
            
            # Create proper filter with correct syntax
            output_label = "[logo_overlay]"
            
            logo_filter = (
                f"[{input_index}:v]scale={logo_size}:{logo_size}:"
                f"force_original_aspect_ratio=decrease[logo_scaled];"
                f"{input_label}[logo_scaled]overlay={x_pos}:{y_pos}{output_label}"
            )
            
            return logo_filter, output_label
            
        except Exception as e:
            logger.error(f"Logo filter build failed: {e}")
            return None, None
    
    def _build_theme_filter(
        self,
        theme: str,
        video_width: int,
        video_height: int,
        input_label: str
    ) -> tuple:
        """Build theme overlay filter"""
        
        try:
            theme_config = self.theme_configs.get(theme, {})
            if not theme_config:
                return None, None
            
            icon = theme_config.get("icon", "")
            color = theme_config.get("color", "#FFFFFF")
            
            # Clean the icon text
            clean_icon = icon.replace("'", "\\'").replace(":", "\\:")
            
            # Calculate theme position and size
            font_size = max(min(video_width // 30, 36), 20)
            
            # Position at top center with padding
            x_pos = "(w-text_w)/2"
            y_pos = "20"
            
            output_label = "[theme_overlay]"
            
            # Create theme overlay with icon and background
            theme_filter = (
                f"{input_label}drawtext=text='{clean_icon}':"
                f"fontsize={font_size}:"
                f"fontcolor={color}:"
                f"x={x_pos}:y={y_pos}:"
                f"shadowcolor=black@0.8:shadowx=2:shadowy=2{output_label}"
            )
            
            return theme_filter, output_label
            
        except Exception as e:
            logger.error(f"Theme filter build failed: {e}")
            return None, None
    
    def _build_subtitle_filter(
        self,
        text: str,
        video_width: int,
        video_height: int,
        input_label: str
    ) -> tuple:
        """Build professional subtitle filter with FIXED syntax"""
        
        try:
            # Clean and prepare text
            clean_text = self._clean_subtitle_text(text)
            if not clean_text:
                return None, None
            
            # Calculate font size based on video dimensions
            base_font_size = max(min(video_width // 40, 32), 16)
            
            # Position subtitles at bottom with padding
            y_position = f"h-text_h-{video_height // 15}"
            
            output_label = "[subtitle_overlay]"
            
            # FIXED: Build filter parameters separately to avoid concatenation issues
            filter_params = [
                f"text='{clean_text}'",
                f"fontsize={base_font_size}",
                f"fontcolor=white",
                f"x=(w-text_w)/2",
                f"y={y_position}",
                f"shadowcolor=black@0.8",
                f"shadowx=2",
                f"shadowy=2", 
                f"box=1",
                f"boxcolor=black@0.6",
                f"boxborderw=8"
            ]
            
            # FIXED: Build filter with proper FFmpeg syntax
            # Format: [input]drawtext=param1:param2:param3[output]
            subtitle_filter = f"{input_label}drawtext={':'.join(filter_params)}{output_label}"
            
            return subtitle_filter, output_label
            
        except Exception as e:
            logger.error(f"Subtitle filter build failed: {e}")
            return None, None

    def _build_overlay_command(
        self,
        input_path: str,
        output_path: str,
        filters: list,
        final_label: str,
        logo_config: Optional[Dict[str, Any]] = None
    ) -> list:
        """Build complete FFmpeg overlay command"""
        
        cmd = ["ffmpeg", "-y"]
        
        # Add input files
        cmd.extend(["-i", input_path])
        
        # Add logo input if needed
        if logo_config and logo_config.get("logo_path"):
            cmd.extend(["-i", logo_config["logo_path"]])
        
        # Add filter complex
        if filters:
            filter_complex = ";".join(filters)
            cmd.extend(["-filter_complex", filter_complex])
            
            # FIXED: Map the final filter output correctly
            if final_label.startswith('[') and final_label.endswith(']'):
                cmd.extend(["-map", final_label])
            else:
                cmd.extend(["-map", f"[{final_label}]"])
        else:
            # No filters applied, map the original video stream directly
            cmd.extend(["-map", "0:v"])
        
        # Copy audio from original (? means optional, won't fail if no audio)
        cmd.extend(["-map", "0:a?"])
        
        # Output encoding settings - HIGH QUALITY to preserve video quality
        cmd.extend([
            "-c:v", "libx264",
            "-crf", "17",  # Excellent quality (lower = better)
            "-preset", "medium",  # Balanced preset
            "-x264-params", "ref=5:bframes=3:me=umh:subme=7:trellis=2",  # Quality-focused params
            "-pix_fmt", "yuv420p",  # Ensure compatibility
            "-profile:v", "high",  # Use high profile for better compression
            "-level", "4.1",  # H.264 level for HD content
            "-c:a", "aac",
            "-b:a", "192k",  # Higher audio bitrate for quality
            "-movflags", "+faststart",
            output_path
        ])
        
        return cmd
    
    # def _get_clip_dimensions(self, clip_path: str) -> Optional[Dict[str, int]]:
    #     """Get clip width and height"""
        
    #     try:
    #         cmd = [
    #             "ffprobe",
    #             "-v", "quiet",
    #             "-print_format", "json",
    #             "-show_streams",
    #             "-select_streams", "v:0",
    #             clip_path
    #         ]
            
    #         result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
    #         import json
    #         data = json.loads(result.stdout)
            
    #         if data.get("streams"):
    #             stream = data["streams"][0]
    #             return {
    #                 "width": int(stream.get("width", 1920)),
    #                 "height": int(stream.get("height", 1080))
    #             }
            
    #         return None
            
    #     except Exception as e:
    #         logger.error(f"Failed to get clip dimensions: {e}")
    #         return None
    
    def _clean_subtitle_text(self, text: str) -> str:
        """Clean and prepare subtitle text with IMPROVED escaping"""
        
        if not text:
            return ""
        
        # Remove extra whitespace
        clean_text = re.sub(r'\s+', ' ', text.strip())
        
        # Limit length (approximately 2 lines at 40 chars per line)
        if len(clean_text) > 80:
            # Try to break at a sentence boundary
            sentences = re.split(r'[.!?]+', clean_text)
            if sentences and len(sentences[0]) <= 80:
                clean_text = sentences[0].strip()
            else:
                # Break at word boundary
                words = clean_text.split()
                truncated = []
                char_count = 0
                
                for word in words:
                    if char_count + len(word) + 1 <= 77:  # +1 for space, -3 for "..."
                        truncated.append(word)
                        char_count += len(word) + 1
                    else:
                        break
                
                clean_text = " ".join(truncated) + "..."
        
        # IMPROVED: Less aggressive FFmpeg escaping to avoid parsing issues
        # Only escape what's absolutely necessary for FFmpeg drawtext
        clean_text = clean_text.replace("\\", "\\\\")  # Escape backslashes first
        clean_text = clean_text.replace("'", "\\'")    # Escape single quotes for shell safety
        clean_text = clean_text.replace(":", "\\:")    # Escape colons (FFmpeg parameter separator)
        
        return clean_text
    

    def apply_branding(
        self,
        video_path: str,
        logo_url: str,
        temp_files: List[str],
        logo_position: Optional[str] = "top-right",
        watermark_text: Optional[str] = "",
        watermark_position: Optional[str] = "bottom-right",
        brand_color: Optional[str] = None
    ) -> str:
        """✅  Apply story-level branding if logo_url exists"""
        
        try:
            if not logo_url and not watermark_text:
                logger.info("No logo URL or watermark text provided, skipping branding")
                return video_path
            
            if not video_path:
                raise FileNotFoundError("video path not found")
            
            # ✅ Download logo if provided
            logo_path = None
            if logo_url:
                logo_path = self.storage_manager.download_media(logo_url)
                if logo_path:
                    temp_files.append(logo_path)
            
            # ✅ Apply logo using VisualOverlay
            logo_config = {
                "logo_path": logo_path,
                "position": logo_position,
                "size_ratio": 0.08  # Smaller for story-level
            } if logo_path else None

            if brand_color is None or brand_color == "None":
                brand_color = "#FFFFFF"

            watermark_config = {
                "text": watermark_text,
                "position": watermark_position,
                "color": brand_color or "#FFFFFF",
                "opacity": 0.15,
                "size": "medium"
            } if watermark_text else None
            
            branded_video_path = self.apply_overlays(
                clip_path=video_path,
                text="",  # No text at story level
                theme="professional",
                logo_config=logo_config,
                watermark_config=watermark_config
            )
            
            if branded_video_path and branded_video_path != video_path:
                temp_files.append(branded_video_path)
                logger.info("✅ Story-level logo branding applied")
                return branded_video_path
            
            return video_path
            
        except Exception as e:
            logger.warning(f"Branding application for logo and watermark failed: {e}")
            return video_path
    
    def _copy_clip(self, input_path: str, output_path: str) -> Optional[str]:
        """Copy clip without modifications"""
        
        try:
            import shutil
            shutil.copy2(input_path, output_path)
            return output_path
        except Exception as e:
            logger.error(f"Clip copy failed: {e}")
            return None
    
    def _safe_cleanup(self, file_path: str):
        """Safely cleanup a file"""
        try:
            if file_path and os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            logger.warning(f"Cleanup failed for {file_path}: {e}")