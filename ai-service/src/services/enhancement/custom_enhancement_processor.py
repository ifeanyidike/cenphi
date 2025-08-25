import os
import cv2
import numpy as np
import logging
import subprocess
import tempfile
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class CustomEnhancement:
    """Custom enhancement configuration"""
    name: str
    type: str  # 'filter', 'ai_processing', 'audio_processing', 'composite'
    parameters: Dict[str, Any]
    description: str
    ai_required: bool = False
    priority: int = 1  # 1=highest, 5=lowest


class CustomEnhancementProcessor:
    """🤖 Custom enhancement processor for user-defined enhancements"""
    
    def __init__(self):
        self._ffmpeg_optimizer = None
        self.enhancement_registry = self._initialize_enhancement_registry()
        logger.info("🛠️  Custom Enhancement Processor initialized")

    
    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer

    def _initialize_enhancement_registry(self) -> Dict[str, CustomEnhancement]:
        """Initialize available custom enhancements"""
        return {
            # Video Quality Enhancements
            "ultra_sharpen": CustomEnhancement(
                name="ultra_sharpen",
                type="filter",
                parameters={"strength": 1.5, "radius": 3},
                description="Ultra-sharp detail enhancement"
            ),
            "cinematic_color": CustomEnhancement(
                name="cinematic_color",
                type="filter", 
                parameters={"temperature": "warm", "saturation": 1.3, "contrast": 1.2},
                description="Cinematic color grading"
            ),
            "professional_stabilization": CustomEnhancement(
                name="professional_stabilization",
                type="filter",
                parameters={"smoothing": 30, "crop_percent": 10},
                description="Professional-grade stabilization"
            ),
            
            
            # Audio Enhancements
            "voice_clarity_boost": CustomEnhancement(
                name="voice_clarity_boost",
                type="audio_processing",
                parameters={"frequency_range": [300, 3400], "boost": 3},
                description="Voice frequency clarity boost"
            ),
            "noise_gate": CustomEnhancement(
                name="noise_gate",
                type="audio_processing",
                parameters={"threshold": -40, "attack": 0.1, "release": 0.3},
                description="Noise gate for clean audio"
            ),
            "professional_eq": CustomEnhancement(
                name="professional_eq",
                type="audio_processing",
                parameters={
                    "bass_cut": 80,
                    "presence_boost": 2500,
                    "clarity_boost": 3500
                },
                description="Professional EQ for testimonials"
            ),
            
            # Composite Enhancements
            "testimonial_optimization": CustomEnhancement(
                name="testimonial_optimization",
                type="composite",
                parameters={
                    "face_enhancement": True,
                    "voice_clarity": True,
                    "background_optimization": True,
                    "lighting_correction": True
                },
                description="Complete testimonial optimization package"
            ),
            "social_media_optimization": CustomEnhancement(
                name="social_media_optimization", 
                type="composite",
                parameters={
                    "high_contrast": True,
                    "vibrant_colors": True,
                    "mobile_optimized": True,
                    "hook_enhancement": True
                },
                description="Social media platform optimization"
            )
        }

    def apply_custom_enhancements(
        self, 
        input_path: str, 
        output_path: str,
        custom_enhancements: List[str],
        video_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        🛠️  Apply custom enhancements specified by user
        """
        logger.info(f"🛠️  Applying {len(custom_enhancements)} custom enhancements")
        
        try:
            if not custom_enhancements:
                return {"success": True, "applied_enhancements": [], "message": "No custom enhancements specified"}
            
            applied_enhancements = []
            enhancement_results = []
            
            # Validate and prioritize enhancements
            valid_enhancements = self._validate_enhancements(custom_enhancements)
            if not valid_enhancements:
                return {"success": False, "error": "No valid custom enhancements found"}
            
            # Sort by priority and type
            prioritized_enhancements = self._prioritize_enhancements(valid_enhancements)
            
            # Apply enhancements in sequence
            current_input = input_path
            temp_files = []
            
            for enhancement_name in prioritized_enhancements:
                enhancement = self.enhancement_registry[enhancement_name]
                
                logger.info(f"🔧 Applying {enhancement.name}: {enhancement.description}")
                
                # Create temporary output for this enhancement
                temp_output = tempfile.mktemp(suffix='.mp4', prefix=f'custom_{enhancement.name}_')
                temp_files.append(temp_output)
                
                # Apply the enhancement
                result = self._apply_single_enhancement(
                    current_input, temp_output, enhancement, video_info
                )
                
                if result["success"]:
                    applied_enhancements.append(enhancement.name)
                    enhancement_results.append({
                        "name": enhancement.name,
                        "type": enhancement.type,
                        "success": True,
                        "description": enhancement.description
                    })
                    current_input = temp_output
                else:
                    logger.warning(f"⚠️  Enhancement {enhancement.name} failed: {result.get('error', 'Unknown error')}")
                    enhancement_results.append({
                        "name": enhancement.name,
                        "success": False,
                        "error": result.get('error', 'Unknown error')
                    })
            
            # Move final result to output path
            if current_input != input_path and os.path.exists(current_input):
                import shutil
                shutil.move(current_input, output_path)
            else:
                # If no enhancements were applied successfully, copy original
                import shutil
                shutil.copy2(input_path, output_path)
            
            # Cleanup temp files
            for temp_file in temp_files:
                if temp_file != current_input and os.path.exists(temp_file):
                    try:
                        os.unlink(temp_file)
                    except Exception:
                        pass
            
            logger.info(f"✅ Custom enhancements completed: {len(applied_enhancements)}/{len(custom_enhancements)} successful")
            
            return {
                "success": True,
                "applied_enhancements": applied_enhancements,
                "enhancement_results": enhancement_results,
                "total_requested": len(custom_enhancements),
                "total_applied": len(applied_enhancements)
            }
            
        except Exception as e:
            logger.error(f"❌ Custom enhancement processing failed: {e}")
            return {"success": False, "error": str(e)}

    def _validate_enhancements(
        self, 
        enhancement_names: List[str]
    ) -> List[str]:
        """Validate custom enhancements and check requirements"""
        valid_enhancements = []
        
        for enhancement_name in enhancement_names:
            if enhancement_name not in self.enhancement_registry:
                logger.warning(f"⚠️  Unknown custom enhancement: {enhancement_name}")
                continue
            
            valid_enhancements.append(enhancement_name)
        
        return valid_enhancements

    def _prioritize_enhancements(self, enhancement_names: List[str]) -> List[str]:
        """Prioritize enhancements by type and priority"""
        enhancements_with_priority = []
        
        for name in enhancement_names:
            enhancement = self.enhancement_registry[name]
            # Group by type for logical ordering
            type_priority = {
                "filter": 1,           # Video filters second  
                "audio_processing": 2, # Audio processing third
                "composite": 3         # Composite enhancements last
            }
            
            priority = (type_priority.get(enhancement.type, 5), enhancement.priority, name)
            enhancements_with_priority.append((priority, name))
        
        # Sort by priority
        enhancements_with_priority.sort(key=lambda x: x[0])
        
        return [name for _, name in enhancements_with_priority]

    def _apply_single_enhancement(
        self,
        input_path: str,
        output_path: str,
        enhancement: CustomEnhancement,
        video_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply a single custom enhancement"""
        try:
            if enhancement.type == "filter":
                return self._apply_filter_enhancement(input_path, output_path, enhancement, video_info)
            elif enhancement.type == "audio_processing":
                return self._apply_audio_enhancement(input_path, output_path, enhancement, video_info)
            elif enhancement.type == "composite":
                return self._apply_composite_enhancement(input_path, output_path, enhancement, video_info)
            else:
                return {"success": False, "error": f"Unknown enhancement type: {enhancement.type}"}
                
        except Exception as e:
            logger.error(f"Enhancement {enhancement.name} failed: {e}")
            return {"success": False, "error": str(e)}

    def _apply_filter_enhancement(
        self, 
        input_path: str, 
        output_path: str, 
        enhancement: CustomEnhancement,
        video_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply FFmpeg filter-based enhancement"""
        try:
            filters = []
            
            if enhancement.name == "ultra_sharpen":
                strength = enhancement.parameters.get("strength", 1.5)
                radius = enhancement.parameters.get("radius", 3)
                filters.append(f"unsharp=5:5:{strength}:5:5:0.0")
                filters.append(f"eq=contrast=1.1:brightness=0.02")
                
            elif enhancement.name == "cinematic_color":
                temp = enhancement.parameters.get("temperature", "warm")
                saturation = enhancement.parameters.get("saturation", 1.3)
                contrast = enhancement.parameters.get("contrast", 1.2)
                
                if temp == "warm":
                    filters.append("colortemperature=3200")
                else:
                    filters.append("colortemperature=6500")
                
                filters.append(f"eq=saturation={saturation}:contrast={contrast}")
                filters.append("curves=all='0/0 0.1/0.15 0.9/0.85 1/1'")
                
            elif enhancement.name == "professional_stabilization":
                smoothing = enhancement.parameters.get("smoothing", 30)
                crop_percent = enhancement.parameters.get("crop_percent", 10)
                filters.append(f"vidstabdetect=shakiness=10:accuracy=15")
                filters.append(f"vidstabtransform=smoothing={smoothing}:crop=black:zoom={100-crop_percent}")
            
            if not filters:
                return {"success": False, "error": "No filters generated for enhancement"}
            
            # Build FFmpeg command
            cmd = ["ffmpeg", "-y", "-i", input_path]
            
            if filters:
                cmd.extend(["-vf", ",".join(filters)])
            
            # Preserve audio
            cmd.extend(["-c:a", "copy"])
            
            # High quality encoding
            cmd.extend([
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "18",
                "-movflags", "+faststart",
                output_path
            ])
            
            # result = subprocess.run(cmd, capture_output=True, timeout=600)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=600, video_info=video_info)
            
            if result.returncode == 0 and os.path.exists(output_path):
                return {"success": True, "filters_applied": filters}
            else:
                return {"success": False, "error": f"FFmpeg processing failed: {result.stderr}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _apply_audio_enhancement(
        self,
        input_path: str,
        output_path: str,
        enhancement: CustomEnhancement,
        video_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply audio enhancement"""
        try:
            audio_filters = []
            
            if enhancement.name == "voice_clarity_boost":
                freq_range = enhancement.parameters.get("frequency_range", [300, 3400])
                boost = enhancement.parameters.get("boost", 3)
                
                # EQ boost for voice frequencies
                audio_filters.append(f"equalizer=f=1000:t=o:w=800:g={boost}")
                audio_filters.append(f"equalizer=f=2500:t=o:w=1000:g={boost-1}")
                
            elif enhancement.name == "noise_gate":
                threshold = enhancement.parameters.get("threshold", -40)
                attack = enhancement.parameters.get("attack", 0.1)
                release = enhancement.parameters.get("release", 0.3)
                
                audio_filters.append(f"agate=threshold={threshold}dB:attack={attack}:release={release}")
                
            elif enhancement.name == "professional_eq":
                params = enhancement.parameters
                bass_cut = params.get("bass_cut", 80)
                presence_boost = params.get("presence_boost", 2500)
                clarity_boost = params.get("clarity_boost", 3500)
                
                audio_filters.append(f"highpass=f={bass_cut}")
                audio_filters.append(f"equalizer=f={presence_boost}:t=o:w=400:g=2")
                audio_filters.append(f"equalizer=f={clarity_boost}:t=o:w=800:g=1.5")
                audio_filters.append("loudnorm=I=-16:TP=-1.5:LRA=7")
            
            if not audio_filters:
                import shutil
                shutil.copy2(input_path, output_path)
                return {"success": True, "note": "No audio filters to apply"}
            
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-af", ",".join(audio_filters),
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, timeout=300)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=300, video_info=video_info)
            return {"success": result.returncode == 0, "audio_filters": audio_filters}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _apply_composite_enhancement(
        self,
        input_path: str,
        output_path: str,
        enhancement: CustomEnhancement,
        video_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply composite enhancement (combination of multiple enhancements)"""
        try:
            if enhancement.name == "testimonial_optimization":
                # Apply multiple enhancements for testimonials
                sub_enhancements = []
                if enhancement.parameters.get("voice_clarity", True):
                    sub_enhancements.append("voice_clarity_boost")
                if enhancement.parameters.get("lighting_correction", True):
                    sub_enhancements.append("cinematic_color")
                
                return self.apply_custom_enhancements(
                    input_path, output_path, sub_enhancements, video_info
                )
                
            elif enhancement.name == "social_media_optimization":
                # Apply social media specific enhancements
                filters = []
                audio_filters = []
                
                if enhancement.parameters.get("high_contrast", True):
                    filters.append("eq=contrast=1.3:saturation=1.4")
                if enhancement.parameters.get("vibrant_colors", True):
                    filters.append("vibrance=intensity=0.3")
                if enhancement.parameters.get("mobile_optimized", True):
                    filters.append("unsharp=5:5:1.0:5:5:0.0")  # Extra sharpening for mobile
                
                # Build command
                cmd = ["ffmpeg", "-y", "-i", input_path]
                
                if filters:
                    cmd.extend(["-vf", ",".join(filters)])
                if audio_filters:
                    cmd.extend(["-af", ",".join(audio_filters)])
                else:
                    cmd.extend(["-c:a", "copy"])
                
                cmd.extend([
                    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                    "-movflags", "+faststart",
                    output_path
                ])
                
                # result = subprocess.run(cmd, capture_output=True, timeout=300)
                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=300, video_info=ValueError)
                return {"success": result.returncode == 0}
            
            return {"success": False, "error": f"Unknown composite enhancement: {enhancement.name}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    def get_available_enhancements(self) -> Dict[str, Dict[str, Any]]:
        """Get list of available custom enhancements"""
        available = {}
        
        for name, enhancement in self.enhancement_registry.items():
            available[name] = {
                "description": enhancement.description,
                "type": enhancement.type,
                "ai_required": enhancement.ai_required,
                "parameters": enhancement.parameters
            }
        
        return available