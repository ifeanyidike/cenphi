# src/services/utils/music_mixer.py

import os
from typing import Optional, Dict, Any, List, Union
import logging
import subprocess

logger = logging.getLogger(__name__)


class MusicMixer:
    """Traditional Music Mixer - No AI Dependencies"""

    def __init__(self):
        self.music_library_path = os.getenv('MUSIC_LIBRARY_PATH', '/app/assets/music')
        self._storage_manager = None
        self._file_manager = None

        # Free royalty-free music from multiple sources
        self.free_music_tracks = {
            "corporate": {
                "url": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
                "filename": "corporate_background.mp3",
                "description": "Corporate Success - Pixabay"
            },
            "upbeat": {
                "url": "https://cdn.pixabay.com/download/audio/2025/07/08/audio_805ea6ff82.mp3", 
                "filename": "upbeat_background.mp3",
                "description": "Inspiring Energy - Pixabay"
            },
            "calm": {
                "url": "https://cdn.pixabay.com/download/audio/2025/07/10/audio_873bdee113.mp3",
                "filename": "calm_background.mp3", 
                "description": "Peaceful Ambient - Pixabay"
            },
            "professional": {
                "url": "https://cdn.pixabay.com/download/audio/2025/07/01/audio_b4ba06b5f2.mp3",
                "filename": "professional_background.mp3",
                "description": "Business Innovation - Pixabay"
            },
            "social": {
                "url": "https://cdn.pixabay.com/download/audio/2025/05/12/audio_6383868169.mp3",
                "filename": "social_background.mp3",
                "description": "Modern Social - Pixabay"
            }
        }

        self.standard_encoding = {
            "video_codec": "libx264",
            "audio_codec": "aac",
            "preset": "fast",
            "crf": "20",
            "audio_bitrate": "128k",
            "audio_sample_rate": "48000",
            "pixel_format": "yuv420p",
            "frame_rate": "30"
        }
        
        logger.info(f"🎵 Music Mixer initialized (Traditional mode)")
    
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

    def download_and_validate_music(self, music_style: str):
        """Download and validate music file"""
        track_info = self.free_music_tracks.get(music_style)
        music_path = os.path.join(self.music_library_path, f"{music_style}.mp3")
        
        if os.path.exists(music_path):
            logger.info(f"✅ Music file already exists: {music_path}")
            return music_path

        try:
            music_path = self.storage_manager.download_media(
                track_info.get("url"), self.music_library_path, music_style
            )
            logger.info(f"Music downloaded to path {music_path}")
            
            if self._validate_music_file(music_path):
                return music_path
            else:
                raise Exception("Downloaded music file failed validation")
                
        except Exception as e:
            logger.warning(f"❌ Failed to download: {e}")
            self._create_platform_optimized_music(music_path, music_style)
            return music_path
        
    def _validate_music_file(self, music_path: str) -> bool:
        """Validate downloaded music file is usable"""
        try:
            cmd = [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration,format_name",
                "-of", "csv=p=0",
                music_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if result.returncode == 0 and result.stdout:
                lines = result.stdout.strip().split('\n')
                if lines and ',' in lines[0]:
                    values = lines[0].split(',')
                    if len(values) >= 2:
                        duration = None
                        format_name = ""
                        
                        for value in values:
                            value = value.strip()
                            try:
                                potential_duration = float(value)
                                if potential_duration > 0:
                                    duration = potential_duration
                            except ValueError:
                                if value and not format_name:
                                    format_name = value
                        
                        if duration is not None and format_name:
                            valid_formats = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
                            return (duration >= 30.0 and 
                                any(fmt in format_name.lower() for fmt in valid_formats))
            
            return False
            
        except Exception as e:
            logger.warning(f"Music validation failed: {e}")
            return False

    def _create_platform_optimized_music(self, output_path: str, style: str):
        """Create optimized minimal music for specific platform styles"""
        try:
            music_configs = {
                "corporate": {
                    "frequencies": [440, 554, 659],  # A-C#-E major chord
                    "rhythm": "0.5,0.25,0.25",
                    "volume": "0.08"
                },
                "upbeat": {
                    "frequencies": [523, 659, 784],  # C-E-G major chord
                    "rhythm": "0.25,0.25,0.5", 
                    "volume": "0.12"
                },
                "calm": {
                    "frequencies": [261, 329, 392],  # C-E-G major chord (lower)
                    "rhythm": "1.0,0.5,0.5",
                    "volume": "0.06"
                },
                "professional": {
                    "frequencies": [349, 440, 523],  # F-A-C major chord
                    "rhythm": "0.75,0.25,0.5",
                    "volume": "0.07"
                },
                "social": {
                    "frequencies": [392, 494, 587],  # G-B-D major chord
                    "rhythm": "0.5,0.5,0.25",
                    "volume": "0.10"
                }
            }
            
            config = music_configs.get(style, music_configs["corporate"])
            
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"sine=frequency={config['frequencies'][0]}:duration=120",
                "-f", "lavfi", 
                "-i", f"sine=frequency={config['frequencies'][1]}:duration=120",
                "-f", "lavfi",
                "-i", f"sine=frequency={config['frequencies'][2]}:duration=120", 
                "-filter_complex", 
                f"[0][1][2]amix=inputs=3,volume={config['volume']}",
                "-t", "120",
                "-c:a", "mp3",
                "-b:a", "128k",
                "-ar", "44100",
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.warning(f"Platform music creation failed: {result.stderr}")
                
        except Exception as e:
            logger.warning(f"Could not create platform music: {e}")

    def get_music_path(self, background_music: str, temp_files: Optional[List[str]] = None) -> Optional[str]:
        """Get full path to music file"""
        os.makedirs(self.music_library_path, exist_ok=True)

        if background_music in self.free_music_tracks:
            return self.download_and_validate_music(background_music)

        try:
            path = self.storage_manager.download_media(background_music, self.music_library_path)
            if path and temp_files is not None:
                temp_files.append(path)
            return path
        except:
            return None

    def mix_with_music(
        self,
        video_path: str,
        music_path: Optional[str],
        video_info: Dict[str, Any],
        music_volume: Union[str, float] = "low",
        story_id: str = "tmp",
        audio_codec: str = "aac",
        audio_bitrate: str = "128k",
        fade_in: float = 1.0,
        fade_out: float = 1.0,
        timeout: int = 300,
    ) -> str:
        """Mix video with background music"""
        try:
            if not music_path or not os.path.exists(music_path) or not os.path.exists(video_path):
                logger.info("No background music - returning original video")
                return video_path

            duration = video_info.get("duration")
            if duration is None or duration <= 0:
                logger.warning("Could not read video duration, using 60s default")
                duration = 60.0

            # Convert volume - Balanced levels for good voice/music mix
            if isinstance(music_volume, str):
                volume_levels = {"low": "0.18", "medium": "0.35", "high": "0.50"}
                volume = volume_levels.get(music_volume.lower(), "0.18")
            else:
                volume = str(music_volume)

            output_path = self.file_manager.create_temp_video(f"music_mixed_{story_id}_")
            has_audio = video_info.get("has_audio", False)

            # Build filter
            filter_complex = []
            
            # Process music
            music_filter = (
                f"[1:a]volume={volume},"
                f"atrim=duration={duration},"
                f"afade=t=in:st=0:d={fade_in},"
                f"afade=t=out:st={max(duration - fade_out, 0):.3f}:d={fade_out}[music]"
            )
            filter_complex.append(music_filter)
            
            # Mix or use music only
            # Prioritize voice over music with adjusted weights
            if has_audio:
                filter_complex.append(
                    f"[0:a]volume=1.0[voice];"
                    f"[voice][music]amix=inputs=2:weights=2.5 0.8:duration=first[mix]"
                )
                map_audio = "[mix]"
            else:
                map_audio = "[music]"

            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", music_path,
                "-filter_complex", ";".join(filter_complex),
                "-map", "0:v:0", "-map", map_audio,
                "-c:v", "copy",
                "-c:a", audio_codec,
                "-b:a", audio_bitrate,
                "-shortest",
                "-movflags", "+faststart",
                output_path,
            ]

            logger.info(f"🎵 Mixing: {volume} volume, {duration:.1f}s duration")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

            if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 1024:
                logger.info("✅ Music mixing completed successfully")
                return output_path
            else:
                logger.warning(f"Music mix failed: {result.stderr}")
                return video_path

        except Exception as e:
            logger.warning(f"Music mix exception: {e}")
            return video_path

    def mix_audio_with_music(
        self,
        audio_path: str,
        music_path: Optional[str],
        audio_info: Dict[str, Any],
        music_volume: Union[str, float] = "low",
        story_id: str = "tmp",
        audio_codec: str = "pcm_s16le",
        audio_bitrate: str = "128k",
        fade_in: float = 1.0,
        fade_out: float = 1.0,
        timeout: int = 300,
    ) -> str:
        """Mix audio with background music"""
        try:
            # if not music_path or not os.path.exists(music_path):
            #     logger.info("No background music - returning original audio")
            #     return audio_path

            if not music_path:
                logger.info("No background music - returning original audio")
                return audio_path

            duration = audio_info.get("duration")
            if duration is None or duration <= 0:
                logger.warning("Could not read audio duration, using 30s default")
                duration = 30.0

            # Balanced volume levels for good narration/music balance
            if isinstance(music_volume, str):
                volume_levels = {"low": "0.15", "medium": "0.28", "high": "0.45"}
                volume = volume_levels.get(music_volume.lower(), "0.15")
            else:
                volume = str(music_volume)

            output_path = self.file_manager.create_temp_audio(f"audio_music_mixed_{story_id}_")

            filter_complex = (
                f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo[narration];"
                f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,"
                f"volume={volume},atrim=duration={duration},"
                f"afade=t=in:st=0:d={fade_in},"
                f"afade=t=out:st={max(duration - fade_out, 0):.3f}:d={fade_out}[music];"
                f"[narration][music]amix=inputs=2:duration=first:dropout_transition=1[mix]"
            )

            cmd = [
                "ffmpeg", "-y",
                "-i", audio_path,
                "-i", music_path,
                "-filter_complex", filter_complex,
                "-map", "[mix]",
                "-c:a", audio_codec,
                "-ar", "44100",
                "-ac", "2",
                output_path,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

            if result.returncode != 0:
                logger.warning("Audio music mix failed: %s", result.stderr)
                return audio_path

            if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                logger.warning("Audio music mix produced invalid file, returning original")
                return audio_path

            logger.info(f"Successfully mixed audio with background music: {output_path}")
            return output_path

        except Exception as e:
            logger.exception(f"Audio music mix exception: {e}")
            return audio_path

    def mix_music_with_cleanups(
        self,
        media_path: str,
        music_path: str,
        media_info: Dict[str, Any],
        story_id: str,
        temp_files: List[str],
        music_volume: Union[str, float] = "low",
        media_type: str = "video"
    ):
        """Mix music with cleanup handling"""
        try:
            if not media_path:
                logger.warning(f"No media path provided for story {story_id}")
                return media_path or ""
            
            media_path = media_path.strip()
            if not media_path:
                logger.warning(f"Empty media path provided for story {story_id}")
                return ""
            
            if media_type == "video":
                enhanced_media = self.mix_with_music(
                    media_path, music_path, media_info, music_volume, story_id
                )
            else:
                enhanced_media = self.mix_audio_with_music(
                    media_path, music_path, media_info, music_volume, story_id
                )

            if enhanced_media and enhanced_media != media_path:
                if os.path.getsize(enhanced_media) > 1024:
                    temp_files.append(enhanced_media)
                    logger.debug(f"Background music added successfully to story {story_id}")
                    return enhanced_media
                else: 
                    logger.warning(f"Music-enhanced story too small for story {story_id}, using original")
            else:
                logger.warning(f"Music enhancement failed for story {story_id}, using original")
            
            return media_path
            
        except Exception as e:
            logger.warning(f"Music enhancement attempt failed for story {story_id}: {e}, using original")
            return media_path

    def get_and_mix_music_with_cleanups(
        self, 
        media_path: str, 
        media_info: Dict[str, Any], 
        temp_files: List[str], 
        story_id: str, 
        music_volume: Union[str, float], 
        background_music: Optional[str],
        media_type: str = "video"
    ):
        """Handle entire music mixing process with cleanups"""
        try:
            if not media_path:
                raise Exception("No media path provided")
            
            media_path = media_path.strip()
            if not media_path:
                raise Exception("Empty media path provided")
            
            # ✅ FIX: Validate media_info
            if not media_info:
                logger.warning(f"No media info provided for story {story_id}, using defaults")
                media_info = {"duration": 60.0, "has_audio": True}
                
            music_path = self.get_music_path(background_music or "corporate", temp_files)
            return self.mix_music_with_cleanups(
                media_path, music_path, media_info, story_id, temp_files, music_volume, media_type
            )
            
        except Exception as e:
            logger.error(f"An error occurred with mixing media: {str(e)}")
            return media_path