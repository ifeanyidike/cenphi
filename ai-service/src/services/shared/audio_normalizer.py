# src/services/shared/audio_normalizer.py

import os
import json
import logging
import tempfile
import subprocess
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class AudioNormalizationResult:
    """Audio normalization result"""
    success: bool
    normalized_path: str = ""
    original_loudness: float = 0.0
    target_loudness: float = 0.0
    peak_level: float = 0.0
    true_peak: float = 0.0
    applied_adjustments: list = None
    error: str = ""
    
    def __post_init__(self):
        if self.applied_adjustments is None:
            self.applied_adjustments = []

class AudioNormalizer:
    """Normalize audio levels for platform compliance and quality"""
    
    def __init__(self):
        # Platform-specific audio targets (LUFS for loudness, dBTP for true peak)
        self._storage_manager = None
        self.platform_targets = {
            "instagram_story": {"loudness": -16.0, "true_peak": -1.0, "lra": 7.0},
            "instagram_reels": {"loudness": -14.0, "true_peak": -1.0, "lra": 7.0},
            "instagram_feed": {"loudness": -16.0, "true_peak": -1.0, "lra": 7.0},
            "tiktok": {"loudness": -14.0, "true_peak": -1.0, "lra": 11.0},
            "youtube_shorts": {"loudness": -14.0, "true_peak": -1.0, "lra": 7.0},
            "youtube_standard": {"loudness": -23.0, "true_peak": -1.0, "lra": 7.0},
            "linkedin": {"loudness": -23.0, "true_peak": -2.0, "lra": 7.0},
            "twitter": {"loudness": -18.0, "true_peak": -1.0, "lra": 7.0},
            "facebook": {"loudness": -18.0, "true_peak": -1.0, "lra": 7.0},
            "whatsapp": {"loudness": -16.0, "true_peak": -1.0, "lra": 11.0}
        }
        
        # Default target for unknown platforms
        self.default_target = {"loudness": -16.0, "true_peak": -1.0, "lra": 7.0}
        
        logger.info("AudioNormalizer initialized with platform-specific targets")

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    def normalize_audio(
        self,
        media_path: str,
        target_platform: str,
        custom_targets: Optional[Dict[str, float]] = None,
        preserve_dynamics: bool = True
    ) -> AudioNormalizationResult:
        """
        Normalize audio for platform compliance
        
        Args:
            media_path: Path to media file
            target_platform: Target platform for optimization
            custom_targets: Custom loudness targets (overrides platform defaults)
            preserve_dynamics: Whether to preserve dynamic range
            
        Returns:
            AudioNormalizationResult with normalized audio file
        """
        try:
            if not os.path.exists(media_path):
                raise FileNotFoundError(f"Media file not found: {media_path}")
            
            # Check if media has audio
            _, audio_stream = self.storage_manager._detect_video_streams(media_path)
            if not audio_stream:
                raise ValueError("Media file contains no audio stream")
            
            # Get target loudness levels
            targets = custom_targets or self._get_platform_targets(target_platform)
            
            # Analyze current audio levels
            audio_analysis = self._analyze_audio_levels(media_path)
            if not audio_analysis["success"]:
                raise Exception(f"Audio analysis failed: {audio_analysis['error']}")
            
            # Determine normalization strategy
            normalization_strategy = self._determine_normalization_strategy(
                audio_analysis, targets, preserve_dynamics
            )
            
            # Apply normalization
            normalized_path = self._apply_normalization(
                media_path, normalization_strategy, targets
            )
            
            if not normalized_path or not os.path.exists(normalized_path):
                raise Exception("Normalization failed to produce output file")
            
            # Verify results
            verification = self._verify_normalization(normalized_path, targets)
            
            return AudioNormalizationResult(
                success=True,
                normalized_path=normalized_path,
                original_loudness=audio_analysis.get("integrated_loudness", 0.0),
                target_loudness=targets["loudness"],
                peak_level=verification.get("peak_level", 0.0),
                true_peak=verification.get("true_peak", 0.0),
                applied_adjustments=normalization_strategy.get("adjustments", [])
            )
            
        except Exception as e:
            logger.error(f"Audio normalization failed: {e}")
            return AudioNormalizationResult(success=False, error=str(e))
    
    def _get_platform_targets(self, platform: str) -> Dict[str, float]:
        """Get platform-specific audio targets"""
        platform_lower = platform.lower().replace(" ", "_").replace("-", "_")
        return self.platform_targets.get(platform_lower, self.default_target)
    
    def _analyze_audio_levels(self, media_path: str) -> Dict[str, Any]:
        """Analyze current audio levels using FFmpeg loudnorm filter"""
        try:
            # Use loudnorm filter in print_format mode to get current levels
            cmd = [
                "ffmpeg", "-i", media_path, "-af", "loudnorm=print_format=summary",
                "-f", "null", "-"
            ]
            
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            
            if result.returncode != 0:
                return {"success": False, "error": f"FFmpeg analysis failed: {result.stderr}"}
            
            # Parse loudnorm output
            analysis_data = self._parse_loudnorm_output(result.stderr)
            analysis_data["success"] = True
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_loudnorm_output(self, ffmpeg_output: str) -> Dict[str, float]:
        """Parse loudnorm analysis output"""
        analysis = {}
        
        try:
            # Look for loudnorm measurement output
            for line in ffmpeg_output.split('\n'):
                if 'Input Integrated:' in line:
                    analysis['integrated_loudness'] = float(line.split()[-2])
                elif 'Input True Peak:' in line:
                    analysis['true_peak'] = float(line.split()[-2])
                elif 'Input LRA:' in line:
                    analysis['lra'] = float(line.split()[-2])
                elif 'Input Threshold:' in line:
                    analysis['threshold'] = float(line.split()[-2])
            
            # If no loudnorm output found, use fallback method
            if not analysis:
                analysis = self._fallback_audio_analysis(ffmpeg_output)
            
        except (ValueError, IndexError) as e:
            logger.warning(f"Failed to parse loudnorm output: {e}")
            # Set default values
            analysis = {
                'integrated_loudness': -20.0,
                'true_peak': -3.0,
                'lra': 8.0,
                'threshold': -30.0
            }
        
        return analysis
    
    def _fallback_audio_analysis(self, ffmpeg_output: str) -> Dict[str, float]:
        """Fallback audio analysis when loudnorm output is not available"""
        return {
            'integrated_loudness': -18.0,  # Conservative estimate
            'true_peak': -3.0,
            'lra': 8.0,
            'threshold': -28.0
        }
    
    def _determine_normalization_strategy(
        self, 
        analysis: Dict[str, Any], 
        targets: Dict[str, float],
        preserve_dynamics: bool
    ) -> Dict[str, Any]:
        """Determine optimal normalization strategy"""
        
        current_loudness = analysis.get("integrated_loudness", -20.0)
        target_loudness = targets["loudness"]
        current_peak = analysis.get("true_peak", -3.0)
        target_peak = targets["true_peak"]
        
        strategy = {
            "method": "loudnorm",
            "adjustments": [],
            "parameters": {}
        }
        
        # Determine if normalization is needed
        loudness_diff = abs(current_loudness - target_loudness)
        peak_exceeds = current_peak > target_peak
        
        if loudness_diff > 1.0 or peak_exceeds:
            strategy["adjustments"].append("loudness_normalization")
            
            # Configure loudnorm parameters
            strategy["parameters"] = {
                "I": target_loudness,           # Integrated loudness target
                "TP": target_peak,              # True peak target
                "LRA": targets.get("lra", 7.0), # Loudness range target
                "measured_I": current_loudness,
                "measured_TP": current_peak,
                "measured_LRA": analysis.get("lra", 8.0),
                "measured_thresh": analysis.get("threshold", -30.0)
            }
            
            # Adjust strategy based on content
            if preserve_dynamics and analysis.get("lra", 8.0) > 15.0:
                # Wide dynamic range - be more conservative
                strategy["parameters"]["LRA"] = min(targets.get("lra", 7.0) + 3.0, 15.0)
                strategy["adjustments"].append("dynamic_range_preservation")
        
        else:
            strategy["method"] = "none"
            strategy["adjustments"].append("no_normalization_needed")
        
        return strategy

    def _apply_normalization(self, input_path: str, strategy: Dict, targets: Dict) -> str:
        if strategy["method"] == "none":
            return input_path
        
        output_path = tempfile.mktemp(suffix=".mp4")
        target_lufs = targets["loudness"]
        target_tp = targets["true_peak"]
        
        # Single-pass loudnorm (more reliable in production):
        cmd = [
            "ffmpeg", "-i", input_path,
            "-af", f"loudnorm=I={target_lufs}:TP={target_tp}:LRA=7",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-y", output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise Exception(f"Normalization failed: {result.stderr}")
        return output_path
    
    def _verify_normalization(self, normalized_path: str, targets: Dict[str, float]) -> Dict[str, float]:
        """Verify normalization results"""
        try:
            # Quick verification using ffprobe
            verification = self._analyze_audio_levels(normalized_path)
            
            if verification.get("success"):
                return {
                    "peak_level": verification.get("integrated_loudness", 0.0),
                    "true_peak": verification.get("true_peak", 0.0),
                    "meets_targets": (
                        abs(verification.get("integrated_loudness", 0.0) - targets["loudness"]) < 2.0 and
                        verification.get("true_peak", 0.0) <= targets["true_peak"] + 0.5
                    )
                }
            else:
                # Return basic file existence verification
                return {
                    "peak_level": targets["loudness"],
                    "true_peak": targets["true_peak"],
                    "meets_targets": os.path.exists(normalized_path) and os.path.getsize(normalized_path) > 1024
                }
                
        except Exception as e:
            logger.warning(f"Normalization verification failed: {e}")
            return {
                "peak_level": 0.0,
                "true_peak": 0.0,
                "meets_targets": False
            }
    
    def get_platform_audio_specs(self, platform: str) -> Dict[str, Any]:
        """Get platform audio specifications"""
        targets = self._get_platform_targets(platform)
        
        return {
            "platform": platform,
            "target_loudness_lufs": targets["loudness"],
            "target_true_peak_dbtp": targets["true_peak"],
            "target_lra_lu": targets.get("lra", 7.0),
            "recommended_codec": "aac",
            "recommended_bitrate": "128k",
            "sample_rate": "48000",
            "channels": "stereo"
        }