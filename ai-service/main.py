#!/usr/bin/env python3

"""
gRPC Server for AI Testimonial Management Platform
Implementation with proper error handling and response mapping
"""

import signal
import sys
import os
from concurrent import futures
import logging
import uuid
import datetime

import grpc
from grpc_reflection.v1alpha import reflection

# Import generated protobuf classes
import intelligence_pb2
import intelligence_pb2_grpc

# Configuration
from src.config.settings import settings
from src.utils.logging_config import setup_logging
from src.utils.job_cancellation_manager import job_checker

# Initialize logging first
setup_logging(settings.log_level, settings.log_format)
logger = logging.getLogger(__name__)


import signal
class MediaEnhancementServicer(intelligence_pb2_grpc.MediaEnhancementServiceServicer):
    """Media Enhancement Service Implementation"""
    
    def EnhanceMedia(self, request, context):
        job_id = request.job_id or str(uuid.uuid4())
        
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.EnhanceResponse(success=False)
            logger.info(f"Media enhancement request for: {request.media_url}")

            from src.services.enhancement.enhancer import MediaEnhancer
            enhancer = MediaEnhancer()
            
            # Call RunPod function
            # result = runpod_client.call_function_safely('media-enhancement', **request_params)
            result = enhancer.enhance(
                media_url=request.media_url,
                quality=request.quality or 'medium',
                upload_to_cloud = request.upload_to_cloud,
                logo_url=request.logo_url,
                watermark_text=request.watermark_text,
                watermark_position=request.watermark_position,
                add_branding=request.add_branding,
                brand_color=request.brand_color,
                custom_enhancements=request.custom_enhancements or None,
                testimonial_id=request.testimonial_id or None,
                remove_noise=request.remove_noise or True
            )
            
            if result.get("error"):
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(result["error"])
                return intelligence_pb2.EnhanceResponse(error=result["error"])
            
            # Convert result to protobuf response
            response = intelligence_pb2.EnhanceResponse()
            response.enhanced_url = result.get("enhanced_url", "")
            response.quality_score = result.get("quality_score", 0.0)
            response.media_type = result.get("media_type", "unknown")
            
            # Add applied enhancements
            for enhancement in result.get("applied_enhancements", []):
                response.applied_enhancements.append(enhancement)
            
            logger.info(f"✅ Media enhancement completed for: {request.media_url}")
            job_checker.complete_job(job_id)
            return response

        except Exception as e:
            error_msg = f"Media enhancement error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.EnhanceResponse(error=error_msg)

    def AdaptiveEnhanceMedia(self, request, context):
        """Scene-aware adaptive video enhancement"""
        job_id = request.job_id or str(uuid.uuid4())

        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.AdaptiveEnhanceResponse(error="Job cancelled")

            logger.info(f"Adaptive enhancement request for: {request.media_url}")

            from src.services.enhancement.adaptive_enhancer import AdaptiveEnhancer
            from src.utils.storage import StorageManager

            enhancer = AdaptiveEnhancer()
            storage_manager = StorageManager()

            # Download media
            local_path = storage_manager.download_media(request.media_url)

            # Determine output path
            import tempfile
            output_path = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name

            # Perform adaptive enhancement
            if request.generate_preview:
                result = enhancer.get_enhancement_preview(
                    input_path=local_path,
                    output_path=output_path,
                    duration=request.preview_duration or 10,
                    start_time=request.preview_start_time or 0,
                )
            else:
                result = enhancer.enhance_video(
                    input_path=local_path,
                    output_path=output_path,
                    quality_preset=request.quality_preset or "high",
                    max_samples=request.max_scene_samples or 30,
                    sample_interval=request.sample_interval or 2.0,
                )

            # Upload enhanced video
            enhanced_url = storage_manager.upload_file(
                output_path,
                f"enhanced/{request.testimonial_id}/adaptive_{job_id}.mp4"
            )

            # Build response
            response = intelligence_pb2.AdaptiveEnhanceResponse()
            response.enhanced_url = enhanced_url
            response.scenes_analyzed = result.scenes_analyzed
            response.processing_time = result.processing_time

            for enhancement in result.enhancements_applied:
                response.enhancements_applied.append(enhancement)

            # Get scene details from the analyzer
            segments = enhancer.scene_analyzer.analyze_video(
                local_path,
                sample_interval=request.sample_interval or 2.0,
                max_samples=request.max_scene_samples or 30,
            )

            for segment in segments[:10]:  # Limit to first 10 for response size
                scene_info = intelligence_pb2.SceneInfo()
                scene_info.scene_type = segment.characteristics.scene_type
                scene_info.start_time = segment.start_time
                scene_info.end_time = segment.end_time
                scene_info.lighting_quality = segment.characteristics.lighting_quality
                scene_info.avg_brightness = segment.characteristics.avg_brightness
                scene_info.contrast_level = segment.characteristics.contrast_level
                scene_info.motion_level = segment.characteristics.motion_level
                scene_info.face_detected = segment.characteristics.face_detected

                for rec in segment.characteristics.recommended_enhancements:
                    scene_info.recommended_enhancements.append(rec)

                response.scene_details.append(scene_info)

            # Determine dominant scene type
            scene_types = [seg.characteristics.scene_type for seg in segments]
            if scene_types:
                response.dominant_scene_type = max(set(scene_types), key=scene_types.count)

            logger.info(f"✅ Adaptive enhancement completed for: {request.media_url}")
            job_checker.complete_job(job_id)

            # Cleanup temp files
            import os
            if os.path.exists(local_path):
                os.unlink(local_path)
            if os.path.exists(output_path):
                os.unlink(output_path)

            return response

        except Exception as e:
            error_msg = f"Adaptive enhancement error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.AdaptiveEnhanceResponse(error=error_msg)

class NarrationServicer(intelligence_pb2_grpc.NarrationServiceServicer):
    """Narration Service Implementation"""
    
    def GenerateNarration(self, request, context):
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.NarrationResponse(success=False)
            logger.info(f"Narration request for text: {request.text[:100]}...")
            
            
            from src.services.narration.narrator import NarrationGenerator
            narrator = NarrationGenerator()


            # Call RunPod function
            # result = runpod_client.call_function_safely('narration-service', **request_params)

            result = narrator.generate(
                text=request.text.strip(),
                language=request.language or 'en',
                style=request.style or 'professional',
                gender=request.gender or 'female',
                background_music=request.background_music or None,
                music_volume=request.music_volume or 'low',
                add_background_music=request.add_background_music or False,
                voice_id=request.voice_id or None,
                optimize_speech=request.optimize_speech or False
            )
            
            if result.get("error"):
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(result["error"])
                return intelligence_pb2.NarrationResponse(error=result["error"])
            
            # Convert result to protobuf response
            response = intelligence_pb2.NarrationResponse()
            response.audio_url = result.get("audio_url", "")
            response.duration = result.get("duration", 0.0)
            response.voice_provider = result.get("voice_provider", "unknown")
            response.quality_score = result.get("quality_score", 0.0)
            response.processed_text = result.get("processed_text", request.text)
            
            job_checker.complete_job(job_id)
            logger.info("✅ Narration completed")
            return response
            
        except Exception as e:
            error_msg = f"Narration error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            job_checker.complete_job(job_id)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            return intelligence_pb2.NarrationResponse(error=error_msg)

class SmartClippingServicer(intelligence_pb2_grpc.SmartClippingServiceServicer):
    """Smart Clipping Service Implementation"""
    
    def GenerateClips(self, request, context):
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.NarrationResponse(success=False)
            logger.info(f"🎬 Smart clipping for: {request.media_url}")

            # Check if viral mode is enabled (we'll add this to protobuf)
            enable_viral_mode = getattr(request, 'enable_viral_mode', False)
            enhanced_moments = request.highlight_moments

            if enable_viral_mode:
                logger.info("🚀 Viral mode enabled - analyzing viral potential...")

                # Step 1: Run viral analysis to identify the best moments
                from src.services.viral_analyzer.viral_detector import ViralContentDetector
                viral_detector = ViralContentDetector()

                # Get transcript from highlight moments if available
                transcript = ""
                if request.highlight_moments:
                    transcript = " ".join([moment.text for moment in request.highlight_moments])

                viral_analysis = viral_detector.analyze_viral_potential(
                    media_url=request.media_url,
                    transcript=transcript,
                    brand_context=None,  # Could be passed from request if needed
                    target_platforms=["tiktok", "instagram_reels", "youtube_shorts"]
                )

                # Step 2: Enhance highlight moments with viral insights
                enhanced_moments = []

                # Use existing highlight moments but prioritize by viral score
                if request.highlight_moments:
                    for moment in request.highlight_moments:
                        # Find matching viral moments to enhance this highlight
                        viral_boost = 0.0
                        for viral_moment in viral_analysis.viral_moments:
                            if (moment.start_time <= viral_moment.end_time and
                                moment.end_time >= viral_moment.start_time):
                                viral_boost = max(viral_boost, viral_moment.viral_score)

                        # Boost importance score based on viral potential
                        enhanced_importance = min(1.0, moment.importance_score + (viral_boost * 0.3))
                        moment.importance_score = enhanced_importance
                        enhanced_moments.append(moment)

                    logger.info(f"🎯 Enhanced {len(enhanced_moments)} moments with viral insights")

                # Step 3: Add high-scoring viral moments as additional clips
                for viral_moment in viral_analysis.viral_moments[:3]:  # Top 3 viral moments
                    if viral_moment.viral_score > 0.7:  # High viral potential
                        # Check if this viral moment overlaps with existing highlights
                        overlaps = any(
                            moment.start_time <= viral_moment.end_time and
                            moment.end_time >= viral_moment.start_time
                            for moment in enhanced_moments
                        ) if enhanced_moments else False

                        if not overlaps:
                            # Create new highlight moment from viral analysis
                            viral_highlight = intelligence_pb2.HighlightMoment()
                            viral_highlight.start_time = viral_moment.start_time
                            viral_highlight.end_time = viral_moment.end_time
                            viral_highlight.text = viral_moment.suggested_caption[:100]
                            viral_highlight.importance_score = viral_moment.viral_score
                            viral_highlight.highlight_type = "viral_moment"
                            viral_highlight.suggested_title = f"Viral Moment ({viral_moment.viral_score:.1f})"
                            enhanced_moments.append(viral_highlight)

                            logger.info(f"🚀 Added viral moment ({viral_moment.viral_score:.2f} score) at {viral_moment.start_time}s")

            from src.services.clip.clipper import SmartClipper
            clipper = SmartClipper()

            response = clipper.generate_clips(
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                highlight_moments=enhanced_moments,
                branding=request.branding,
                background_music=request.background_music if request.background_music else None,
                music_volume=request.music_volume if request.music_volume else 'low',
                session_id=request.session_id if request.session_id else None,
            )
            
                
            job_checker.complete_job(job_id)
            logger.info(f"✅ Smart clipping completed for: {request.media_url}")
            return response
            
        except Exception as e:
            error_msg = f"Smart clipping error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.ClippingResponse(error=error_msg)

class PlatformOptimizerServicer(intelligence_pb2_grpc.PlatformOptimizerServiceServicer):
    """Platform Optimizer Service Implementation"""

    def __init__(self):
        self._step_processor = None

    @property
    def step_processor(self):
        """Lazy load step processor"""
        if self._step_processor is None:
            from src.services.platform_optimizer.step_processor import PlatformOptimizerStepProcessor
            self._step_processor = PlatformOptimizerStepProcessor()
        return self._step_processor

    def OptimizeMedia(self, request, context):
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.OptimizeResponse(success=False)

            logger.info(f"📱 Platform optimization for {request.target_platform}: {request.media_url}")

            # Check if viral mode is enabled (we'll add this to protobuf)
            enable_viral_mode = getattr(request, 'enable_viral_optimization', False)
            enhanced_settings = {}

            if enable_viral_mode:
                logger.info("🚀 Viral optimization mode enabled...")

                # Step 1: Get viral analysis to inform platform optimization
                from src.services.viral_analyzer.viral_detector import ViralContentDetector
                viral_detector = ViralContentDetector()

                viral_analysis = viral_detector.analyze_viral_potential(
                    media_url=request.media_url,
                    transcript=request.transcript,
                    brand_context=request.brand_context,
                    target_platforms=[request.target_platform]
                )

                # Step 2: Use viral insights to enhance optimization parameters
                platform_viral_score = viral_analysis.platform_recommendations.get(request.target_platform, 0.5)

                # Enhance settings based on viral potential
                if platform_viral_score > 0.7:
                    # High viral potential - optimize for engagement
                    enhanced_settings.update({
                        "enable_captions": True,  # Always add captions for viral content
                        "enable_media_enhancement": True,  # Enhance quality for viral reach
                        "optimization_priority": "viral_engagement"
                    })
                    logger.info(f"🚀 High viral potential ({platform_viral_score:.2f}) - optimizing for engagement")

                elif platform_viral_score > 0.4:
                    # Medium viral potential - balanced approach
                    enhanced_settings.update({
                        "optimization_priority": "balanced"
                    })
                    logger.info(f"⚖️ Medium viral potential ({platform_viral_score:.2f}) - balanced optimization")
                else:
                    # Lower viral potential - focus on quality
                    enhanced_settings.update({
                        "optimization_priority": "quality_focused"
                    })
                    logger.info(f"🎯 Lower viral potential ({platform_viral_score:.2f}) - quality-focused optimization")

                # Add trending elements if available
                if viral_analysis.trending_keywords:
                    enhanced_settings["trending_keywords"] = viral_analysis.trending_keywords[:5]
                    logger.info(f"📈 Added trending keywords: {', '.join(viral_analysis.trending_keywords[:3])}")

            from src.services.platform_optimizer.optimizer import PlatformOptimizer
            optimizer = PlatformOptimizer()

            result = optimizer.optimize(
                media_url=request.media_url,
                target_platform=request.target_platform,
                brand_context=request.brand_context,
                background_music=request.background_music or None,
                music_volume=request.music_volume or 'low',
                transcript=request.transcript,
                enable_captions=enhanced_settings.get("enable_captions", request.enable_captions),
                enable_media_enhancement=enhanced_settings.get("enable_media_enhancement", request.enable_media_enhancement),
                watermark_text=request.watermark_text,
                logo_position=request.logo_position,
                watermark_position=request.watermark_position,
                transcript_segments=request.transcript_segments,
                add_background_music=request.add_background_music,
            )

            job_checker.complete_job(job_id)
            return result
            
        except Exception as e:
            error_msg = f"Platform optimization error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.OptimizeResponse(error=error_msg)

    def RecommendPlatforms(self, request, context):
        """
        IMPROVEMENT #2: Smart Platform Recommendation Engine
        Analyze testimonial and recommend best platforms for maximum engagement
        """
        try:
            logger.info(f"🎯 Platform recommendation for testimonial {request.testimonial_id}")

            from src.services.platform_optimizer.platform_recommender import PlatformRecommender
            from src.utils.storage import StorageManager
            from google.protobuf.struct_pb2 import Struct

            recommender = PlatformRecommender()
            storage_manager = StorageManager()

            # Get video info if media_url provided
            duration = request.duration
            if not duration and request.media_url:
                try:
                    local_path = storage_manager.download_media(request.media_url)
                    video_info = storage_manager.get_video_info(local_path)
                    duration = video_info.get("duration", 30.0)
                except Exception as e:
                    logger.warning(f"Could not get video info: {e}, using default duration")
                    duration = 30.0

            # Parse sentiment data from Struct
            sentiment_data = None
            if request.HasField("sentiment_data"):
                sentiment_data = dict(request.sentiment_data)

            # Get platform recommendations
            result = recommender.recommend_platforms(
                duration=duration,
                transcript=request.transcript,
                sentiment_data=sentiment_data,
                industry=request.industry or None,
                current_aspect_ratio=request.current_aspect_ratio or None,
                file_size_mb=request.file_size_mb if request.file_size_mb > 0 else None
            )

            # Build response
            response = intelligence_pb2.PlatformRecommendResponse()

            # Primary recommendation
            if result.primary_recommendation:
                rec = result.primary_recommendation
                primary = response.primary_recommendation
                primary.platform = rec.platform
                primary.score = rec.score
                primary.confidence = rec.confidence
                primary.recommended_aspect_ratio = rec.recommended_aspect_ratio
                primary.reasons.extend(rec.reasons)
                primary.optimization_tips.extend(rec.optimization_tips)
                primary.estimated_engagement = rec.estimated_engagement

            # Alternative platforms
            for alt_rec in result.alternative_platforms:
                alt = response.alternative_platforms.add()
                alt.platform = alt_rec.platform
                alt.score = alt_rec.score
                alt.confidence = alt_rec.confidence
                alt.recommended_aspect_ratio = alt_rec.recommended_aspect_ratio
                alt.reasons.extend(alt_rec.reasons)
                alt.optimization_tips.extend(alt_rec.optimization_tips)
                alt.estimated_engagement = alt_rec.estimated_engagement

            # Avoid platforms
            for avoid in result.avoid_platforms:
                avoid_msg = response.avoid_platforms.add()
                avoid_msg.platform = avoid["platform"]
                avoid_msg.reason = avoid["reason"]

            # Content analysis
            content_struct = Struct()
            if result.content_analysis:
                for key, value in result.content_analysis.items():
                    if isinstance(value, (str, int, float, bool)):
                        content_struct[key] = value
                    elif isinstance(value, list):
                        content_struct[key] = str(value)
                    else:
                        content_struct[key] = str(value)
            response.content_analysis.CopyFrom(content_struct)

            logger.info(f"✅ Platform recommendation complete: {result.primary_recommendation.platform if result.primary_recommendation else 'none'}")
            return response

        except Exception as e:
            error_msg = f"Platform recommendation error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            return intelligence_pb2.PlatformRecommendResponse(error=error_msg)

    # Step-by-step Platform Optimization Methods

    def CropResize(self, request, context):
        """Crop and resize video to target aspect ratio"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.CropResizeResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Crop/Resize: {request.aspect_ratio} for {request.target_platform}")

            result = self.step_processor.crop_resize(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                aspect_ratio=request.aspect_ratio,
                target_platform=request.target_platform,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.CropResizeResponse(
                cropped_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                aspect_ratio=result.get("aspect_ratio", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Crop/Resize completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Crop/Resize error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.CropResizeResponse(error=error_msg)

    def BurnCaptions(self, request, context):
        """Burn captions into video"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.BurnCaptionsResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Burn Captions for {request.target_platform}")

            # Convert style config to dict (if provided)
            style_config = {}
            if request.style_config:
                style_config = {
                    "font_size": getattr(request.style_config, 'font_size', 24),
                    "font_color": getattr(request.style_config, 'font_color', "white"),
                    "background_color": getattr(request.style_config, 'background_color', "black"),
                    "position": getattr(request.style_config, 'position', "bottom")
                }

            # Pass protobuf transcript_segments directly - caption_generator expects protobuf objects
            result = self.step_processor.burn_captions(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                transcript_segments=list(request.transcript_segments),  # Pass protobuf objects directly
                style_config=style_config,
                target_platform=request.target_platform,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.BurnCaptionsResponse(
                captioned_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Burn Captions completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Burn Captions error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.BurnCaptionsResponse(error=error_msg)

    def ApplyBranding(self, request, context):
        """Apply logo and watermark branding"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.ApplyBrandingResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Apply Branding - logo: {request.logo_url}, watermark: {request.watermark_text}")

            # Extract branding parameters from request
            logo_position = request.logo_position if request.logo_position else "bottom-right"
            watermark_text = request.watermark_text if request.watermark_text else ""
            watermark_position = request.watermark_position if request.watermark_position else "bottom-right"
            brand_color = request.brand_color if request.brand_color else None

            result = self.step_processor.apply_branding(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                logo_url=request.logo_url if request.logo_url else None,
                logo_position=logo_position,
                watermark_text=watermark_text,
                watermark_position=watermark_position,
                brand_color=brand_color,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.ApplyBrandingResponse(
                branded_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Apply Branding completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Apply Branding error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.ApplyBrandingResponse(error=error_msg)

    def MixMusic(self, request, context):
        """Mix background music with video audio"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.MixMusicResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Mix Music: {request.music_track}")

            result = self.step_processor.mix_music(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                music_track=request.music_track if request.music_track else None,
                music_volume=request.music_volume,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.MixMusicResponse(
                music_mixed_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Mix Music completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Mix Music error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.MixMusicResponse(error=error_msg)

    def NormalizeAudio(self, request, context):
        """Normalize audio levels using LUFS targeting"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.NormalizeAudioResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Normalize Audio for {request.target_platform}")

            result = self.step_processor.normalize_audio(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                target_platform=request.target_platform,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.NormalizeAudioResponse(
                normalized_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Normalize Audio completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Normalize Audio error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.NormalizeAudioResponse(error=error_msg)

    def EnhanceVideo(self, request, context):
        """Enhance video quality with platform-specific optimization"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.EnhanceVideoResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Enhance Video: {request.enhancement_level} for {request.target_platform}")

            result = self.step_processor.enhance_video(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                target_platform=request.target_platform,
                enhancement_level=request.enhancement_level,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.EnhanceVideoResponse(
                enhanced_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Enhance Video completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Enhance Video error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.EnhanceVideoResponse(error=error_msg)


class SessionManagementServicer(intelligence_pb2_grpc.SessionManagementServiceServicer):
    """Session Management Service Implementation"""

    def __init__(self):
        self._step_processor = None

    @property
    def step_processor(self):
        """Lazy load step processor"""
        if self._step_processor is None:
            from src.services.platform_optimizer.step_processor import PlatformOptimizerStepProcessor
            self._step_processor = PlatformOptimizerStepProcessor()
        return self._step_processor

    def SaveProgress(self, request, context):
        """Save current session progress to cloud storage"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.SaveProgressResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Save Progress")

            result = self.step_processor.save_progress(
                job_id=job_id,
                testimonial_id=request.testimonial_id
            )

            response = intelligence_pb2.SaveProgressResponse(
                saved_url=result.get("saved_url", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            # Add steps completed
            for step in result.get("steps_completed", []):
                response.steps_completed.append(step)

            job_checker.complete_job(job_id)
            logger.info(f"✅ Save Progress completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Save Progress error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.SaveProgressResponse(error=error_msg)

    def CleanupSession(self, request, context):
        """Cleanup session files"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.CleanupSessionResponse(success=False, error="Job cancelled")

            logger.info(f"[{job_id}] Cleanup Session")

            self.step_processor.cleanup_session(job_id)

            job_checker.complete_job(job_id)
            logger.info(f"✅ Cleanup Session completed: {job_id}")
            return intelligence_pb2.CleanupSessionResponse(success=True)

        except Exception as e:
            error_msg = f"Cleanup Session error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.CleanupSessionResponse(success=False, error=error_msg)


class StoryModeServicer(intelligence_pb2_grpc.StoryModeServiceServicer):
    """gRPC Servicer for Story Mode Video Generation"""

    def __init__(self):
        self._step_processor = None

    @property
    def step_processor(self):
        """Lazy load step processor"""
        if self._step_processor is None:
            from src.services.story_mode.story_video_step_processor import StoryVideoStepProcessor
            self._step_processor = StoryVideoStepProcessor()
        return self._step_processor

    def GenerateStoryVideo(self, request, context):
        """Generate multi-modal story video from testimonial segments"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.StoryModeResponse(success=False)
            
            segments = request.testimonial_segments
            if request.type == "clips" and request.processed_segments:
                segments = request.processed_segments

            logger.info(f"📖 Story mode request: {len(segments)} segments, music: {request.background_music}, request_type {request.type}")

            from src.services.story_mode.story_generator import StoryModeGenerator
            story_generator = StoryModeGenerator()
            

            result = story_generator.generate_story_video(
                segments=segments,
                brand_context=request.brand_context,
                output_format=request.output_format,
                background_music=request.background_music if request.background_music else None,
                music_volume=request.music_volume if request.music_volume else 'low',
                prompt=request.prompt,
                add_background_music = request.add_background_music,
                intro_image_url = request.intro_image_url,
                outro_image_url = request.outro_image_url,
                company_name=request.company_name,
                request_type=request.type,
                auto_order=request.auto_order
            )
            
            if result.get('error'):
                return intelligence_pb2.StoryModeResponse(
                    story_video_url="",
                )
            
            response = intelligence_pb2.StoryModeResponse(
                story_video_url=result.get('story_video_url', '')
            )
            job_checker.complete_job(job_id)
            logger.info(f"✅ Story mode completed: {response.story_video_url}")
            return response
            
        except Exception as e:
            logger.error(f"❌ Story mode failed: {str(e)}")
            job_checker.complete_job(job_id)
            return intelligence_pb2.StoryModeResponse(
                story_video_url=""
            )

    # Step-by-step Story Video Methods

    def NormalizeVideoResolution(self, request, context):
        """Normalize clips to same resolution and codec"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.NormalizeVideoResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Normalize Video Resolution: {request.target_resolution} for {len(request.clip_urls)} clips")

            result = self.step_processor.normalize_video_resolution(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                clip_urls=list(request.clip_urls),
                target_resolution=request.target_resolution,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.NormalizeVideoResponse(
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            # Add normalized URLs if uploaded
            for url in result.get("normalized_urls", []):
                response.normalized_urls.append(url)

            # Add local paths
            for path in result.get("local_paths", []):
                response.local_paths.append(path)

            job_checker.complete_job(job_id)
            logger.info(f"✅ Normalize Video Resolution completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Normalize Video Resolution error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.NormalizeVideoResponse(error=error_msg)

    def AssembleStoryVideo(self, request, context):
        """Assemble clips into story video with transitions"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.AssembleStoryResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Assemble Story Video: {len(request.clip_paths)} clips with {request.transition_type} transition")

            result = self.step_processor.assemble_story_video(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                clip_paths=list(request.clip_paths),
                transition_type=request.transition_type,
                transition_duration=request.transition_duration,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.AssembleStoryResponse(
                assembled_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0)
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Assemble Story Video completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Assemble Story Video error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.AssembleStoryResponse(error=error_msg)

    def AddIntroOutro(self, request, context):
        """Add intro and/or outro to video"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.IntroOutroResponse(error="Job cancelled")

            # Use binary add_intro/add_outro booleans
            add_intro = request.add_intro if hasattr(request, 'add_intro') else False
            add_outro = request.add_outro if hasattr(request, 'add_outro') else False

            # Extract custom text from request (if provided by frontend)
            intro_text = request.intro_text if hasattr(request, 'intro_text') and request.intro_text else None
            outro_text = request.outro_text if hasattr(request, 'outro_text') and request.outro_text else None

            logger.info(f"[{job_id}] Add Intro/Outro: add_intro={add_intro}, add_outro={add_outro}, intro_text={intro_text}, outro_text={outro_text}")

            # Build intro/outro configs from booleans
            # Professional intro/outro without background music (main video music covers it)
            intro_config = {
                "enabled": add_intro,
                "style": "branded",
                "duration": 6.0,  # Longer duration for complete delivery
                "text_overlay": intro_text  # Custom text from frontend (displayed and spoken)
            } if add_intro else None

            outro_config = {
                "enabled": add_outro,
                "style": "branded",
                "duration": 4.5,  # Slightly shorter for outro
                "text_overlay": outro_text  # Custom text from frontend (displayed and spoken)
            } if add_outro else None

            # Extract brand_context from request (now passed from api-server)
            brand_context = None
            if hasattr(request, 'brand_context') and request.brand_context:
                brand_context = {
                    "name": request.workspace_name if hasattr(request, 'workspace_name') and request.workspace_name else None,
                    "logo_url": request.brand_context.logo_url if request.brand_context.logo_url else None,
                    "tagline": request.brand_context.tagline if request.brand_context.tagline else None,
                    "primary_color": request.brand_context.brand_colors[0] if request.brand_context.brand_colors else None,
                    "secondary_color": request.brand_context.brand_colors[1] if len(request.brand_context.brand_colors) > 1 else None,
                    "about_info": request.brand_context.about_info if request.brand_context.about_info else None
                }
                logger.info(f"[{job_id}] Brand context extracted: logo_url={brand_context.get('logo_url')}, name={brand_context.get('name')}")

            result = self.step_processor.add_intro_outro(
                job_id=job_id,
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                intro_config=intro_config,
                outro_config=outro_config,
                brand_context=brand_context,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.IntroOutroResponse(
                output_url=result.get("cloud_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0),
                width=result.get("width", 1920),
                height=result.get("height", 1080),
                aspect_ratio=result.get("aspect_ratio", "16:9")
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Add Intro/Outro completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Add Intro/Outro error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.IntroOutroResponse(error=error_msg)

    # 3-Step Story Video Workflow Handlers

    def CollectClips(self, request, context):
        """Collect clips for story video (extract new or use existing)"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.CollectClipsResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Collect Clips: {len(request.testimonial_segments)} testimonial segments, {len(request.existing_clips)} existing clips")

            # Convert existing clips from protobuf to dict
            existing_clips_dict = []
            for clip in request.existing_clips:
                existing_clips_dict.append({
                    "clip_id": clip.clip_id,
                    "testimonial_id": clip.testimonial_id,
                    "storage_path": clip.storage_path,
                    "preview_url": clip.preview_url,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "duration": clip.duration,
                    "highlight_type": clip.highlight_type,
                    "text_content": clip.text_content
                })

            result = self.step_processor.collect_clips(
                job_id=job_id,
                session_id=request.session_id,
                workspace_id=request.workspace_id,
                testimonial_segments=list(request.testimonial_segments),
                existing_clips=existing_clips_dict,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.CollectClipsResponse(
                total_clips=result.get("total_clips", 0),
                total_duration=result.get("total_duration", 0.0)
            )

            # Add clip info
            for clip in result.get("clips", []):
                clip_info = intelligence_pb2.ClipInfo(
                    clip_id=clip.get("clip_id", ""),
                    testimonial_id=clip.get("testimonial_id", ""),
                    storage_path=clip.get("storage_path", ""),
                    preview_url=clip.get("preview_url", ""),
                    start_time=clip.get("start_time", 0.0),
                    end_time=clip.get("end_time", 0.0),
                    duration=clip.get("duration", 0.0),
                    highlight_type=clip.get("highlight_type", ""),
                    text_content=clip.get("text_content", "")
                )
                response.clips.append(clip_info)

            job_checker.complete_job(job_id)
            logger.info(f"✅ Collect Clips completed: {job_id}, {response.total_clips} clips")
            return response

        except Exception as e:
            error_msg = f"Collect Clips error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.CollectClipsResponse(error=error_msg)

    def AIOrdering(self, request, context):
        """Use AI to intelligently order clips"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.AIOrderingResponse(error="Job cancelled")

            logger.info(f"[{job_id}] AI Ordering: {len(request.clips)} clips using '{request.ordering_strategy}' strategy")

            # Convert protobuf clips to dict
            clips = []
            for clip in request.clips:
                clips.append({
                    "clip_id": clip.clip_id,
                    "testimonial_id": clip.testimonial_id,
                    "storage_path": clip.storage_path,
                    "preview_url": clip.preview_url,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "duration": clip.duration,
                    "highlight_type": clip.highlight_type,
                    "text_content": clip.text_content
                })

            result = self.step_processor.ai_ordering(
                job_id=job_id,
                session_id=request.session_id,
                clips=clips,
                ordering_strategy=request.ordering_strategy,
                brand_context=request.brand_context
            )

            response = intelligence_pb2.AIOrderingResponse(
                ordering_rationale=result.get("ordering_rationale", ""),
                confidence_score=result.get("confidence_score", 0.0)
            )

            # Add ordered clips
            for clip in result.get("ordered_clips", []):
                clip_info = intelligence_pb2.ClipInfo(
                    clip_id=clip.get("clip_id", ""),
                    testimonial_id=clip.get("testimonial_id", ""),
                    storage_path=clip.get("storage_path", ""),
                    preview_url=clip.get("preview_url", ""),
                    start_time=clip.get("start_time", 0.0),
                    end_time=clip.get("end_time", 0.0),
                    duration=clip.get("duration", 0.0),
                    highlight_type=clip.get("highlight_type", ""),
                    text_content=clip.get("text_content", "")
                )
                response.ordered_clips.append(clip_info)

            job_checker.complete_job(job_id)
            logger.info(f"✅ AI Ordering completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"AI Ordering error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.AIOrderingResponse(error=error_msg)

    def AssembleDraft(self, request, context):
        """Assemble clips into draft story video"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.AssembleDraftResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Assemble Draft: {len(request.clips)} clips")

            # Convert protobuf clips to dict
            clips = []
            for clip in request.clips:
                clips.append({
                    "clip_id": clip.clip_id,
                    "testimonial_id": clip.testimonial_id,
                    "storage_path": clip.storage_path,
                    "preview_url": clip.preview_url,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "duration": clip.duration,
                    "highlight_type": clip.highlight_type,
                    "text_content": clip.text_content
                })

            result = self.step_processor.assemble_draft(
                job_id=job_id,
                session_id=request.session_id,
                testimonial_id=request.testimonial_id,
                clips=clips,
                transition_type=request.transition_type,
                transition_duration=request.transition_duration,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.AssembleDraftResponse(
                assembled_url=result.get("assembled_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0),
                clips_assembled=result.get("clips_assembled", 0),
                width=result.get("width", 1920),
                height=result.get("height", 1080),
                aspect_ratio=result.get("aspect_ratio", "16:9")
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Assemble Draft completed: {job_id}")
            return response

        except Exception as e:
            error_msg = f"Assemble Draft error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.AssembleDraftResponse(error=error_msg)


    def CollectAndAssembleClips(self, request, context):
        """Collect clips for story video (extract new or use existing)"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.AssembleDraftResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Collect and assemble clips Clips: {len(request.testimonial_segments)} testimonial segments, {len(request.existing_clips)} existing clips")

            # Convert existing clips from protobuf to dict
            existing_clips = []
            for clip in request.existing_clips:
                existing_clips.append({
                    "clip_id": clip.clip_id,
                    "testimonial_id": clip.testimonial_id,
                    "storage_path": clip.storage_path,
                    "preview_url": clip.preview_url,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "duration": clip.duration,
                    "highlight_type": clip.highlight_type,
                    "text_content": clip.text_content
                })

            result = self.step_processor.collect_and_assemble_clips(
                job_id=job_id,
                session_id=request.session_id,
                workspace_id=request.workspace_id,
                testimonial_segments=list(request.testimonial_segments),
                existing_clips=existing_clips,
                transition_type=request.transition_type,
                transition_duration=request.transition_duration,
                upload_intermediate=request.upload_intermediate
            )

            response = intelligence_pb2.AssembleDraftResponse(
                assembled_url=result.get("assembled_url", ""),
                local_path=result.get("local_path", ""),
                duration=result.get("duration", 0.0),
                size=result.get("size", 0.0),
                clips_assembled=result.get("clips_assembled", 0),
                width=result.get("width", 1920),
                height=result.get("height", 1080),
                aspect_ratio=result.get("aspect_ratio", "16:9")
            )

            job_checker.complete_job(job_id)
            logger.info(f"✅ Collect and assemble Clips completed: {job_id}, clips")
            return response

        except Exception as e:
            error_msg = f"Collect Clips error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.AssembleDraftResponse(error=error_msg)

    def DetectHooks(self, request, context):
        """Detect engaging hook points in video content"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.HookDetectionResponse(error="Job cancelled")

            logger.info(f"[{job_id}] Hook detection for testimonial: {request.testimonial_id}")
            logger.info(f"[{job_id}] Transcript length: {len(request.transcript)}")
            logger.info(f"[{job_id}] Transcript segments count: {len(request.transcript_segments)}")

            from src.services.story_mode.hook_detector import HookDetector

            detector = HookDetector()

            # Convert transcript segments from protobuf
            transcript_segments = []
            for seg in request.transcript_segments:
                transcript_segments.append({
                    "text": seg.text,
                    "start_time": seg.start_time,
                    "end_time": seg.end_time,
                    "speaker": seg.speaker if seg.speaker else ""
                })

            logger.info(f"[{job_id}] Converted segments: {len(transcript_segments)}")

            # Convert sentiment data from struct if present
            sentiment_data = None
            if request.sentiment_data:
                sentiment_data = dict(request.sentiment_data)

            # Detect hooks
            hooks = detector.detect_hooks(
                transcript=request.transcript,
                transcript_segments=transcript_segments if transcript_segments else None,
                sentiment_data=sentiment_data,
                duration=request.duration
            )

            # Optimize for platform if specified
            if request.target_platform:
                hooks = detector.optimize_for_platform(hooks, request.target_platform)

            # Get best hook if target position specified
            best_hook = None
            if request.target_position:
                best_hook = detector.recommend_best_hook(
                    hooks,
                    target_position=request.target_position,
                    max_duration=request.max_duration if request.max_duration > 0 else 5.0
                )
            elif hooks:
                best_hook = hooks[0]

            # Build response
            response = intelligence_pb2.HookDetectionResponse()
            response.hooks_detected = len(hooks)

            # Add all hooks
            for hook in hooks:
                hook_pb = intelligence_pb2.HookCandidate()
                hook_pb.start_time = hook.start_time
                hook_pb.end_time = hook.end_time
                hook_pb.text = hook.text
                hook_pb.hook_type = hook.hook_type
                hook_pb.engagement_score = hook.engagement_score
                hook_pb.placement_recommendation = hook.placement_recommendation
                hook_pb.reasoning = hook.reasoning

                for keyword in hook.keywords:
                    hook_pb.keywords.append(keyword)

                # Add cut timing
                cut_timing = detector.create_hook_cut(hook)
                hook_pb.cut_timing.start_time = cut_timing["start_time"]
                hook_pb.cut_timing.end_time = cut_timing["end_time"]
                hook_pb.cut_timing.original_start = cut_timing["original_start"]
                hook_pb.cut_timing.original_end = cut_timing["original_end"]

                response.hooks.append(hook_pb)

            # Add best hook
            if best_hook:
                best_pb = intelligence_pb2.HookCandidate()
                best_pb.start_time = best_hook.start_time
                best_pb.end_time = best_hook.end_time
                best_pb.text = best_hook.text
                best_pb.hook_type = best_hook.hook_type
                best_pb.engagement_score = best_hook.engagement_score
                best_pb.placement_recommendation = best_hook.placement_recommendation
                best_pb.reasoning = best_hook.reasoning

                for keyword in best_hook.keywords:
                    best_pb.keywords.append(keyword)

                cut_timing = detector.create_hook_cut(best_hook)
                best_pb.cut_timing.start_time = cut_timing["start_time"]
                best_pb.cut_timing.end_time = cut_timing["end_time"]
                best_pb.cut_timing.original_start = cut_timing["original_start"]
                best_pb.cut_timing.original_end = cut_timing["original_end"]

                response.best_hook.CopyFrom(best_pb)

            job_checker.complete_job(job_id)
            logger.info(f"✅ Hook detection completed: {len(hooks)} hooks found")
            return response

        except Exception as e:
            error_msg = f"Hook detection error: {str(e)}"
            logger.error(f"❌ {error_msg}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(error_msg)
            job_checker.complete_job(job_id)
            return intelligence_pb2.HookDetectionResponse(error=error_msg)


class NoiseReducerServicer(intelligence_pb2_grpc.NoiseReducerServiceServicer):
    """gRPC Servicer for Noise reduction/removal"""

    def ReduceNoise(self, request, context):
        """Reduce noise from testimonial"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.NoiseReductionResponse(error="Job cancelled")

            from src.services.noise_reducer.reducer import NoiseReducer
            noise_reducer = NoiseReducer()


            result = noise_reducer.process(
                testimonial_id = request.testimonial_id,
                media_url=request.media_url,
                level=request.level
            )


            job_checker.complete_job(job_id)
            logger.info(f"✅ Noise reduction completed: {result.denoised_media_url}")
            return result

        except Exception as e:
            logger.error(f"❌ Noise reduction failed: {str(e)}")
            job_checker.complete_job(job_id)
            return intelligence_pb2.NoiseReductionResponse(
                error=str(e)
            )
        
    def BatchReduceNoise(self, request, context):
        """Reduce noise from testimonial"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.BatchNoiseReductionResponse(error="Job cancelled")
            logger.info(f"📖 Noise reduction request options: {len(request.options)}")

            from src.services.noise_reducer.reducer import NoiseReducer
            noise_reducer = NoiseReducer()
            

            result = noise_reducer.batch_process(
                options=request.options,
                level=request.level
            )
            
           
            job_checker.complete_job(job_id)
            logger.info(f"✅ Noise reduction completed: {len(result)}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Noise reduction failed: {str(e)}")
            job_checker.complete_job(job_id)
            return intelligence_pb2.BatchNoiseReductionResponse(
                error=str(e)
            )

# Viral analysis is now integrated directly into clipping and platform optimization services

def create_server():
    """Create and configure the gRPC server"""
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=getattr(settings, 'max_workers', 10)),
        options=[
            ('grpc.keepalive_time_ms', 60000),
            ('grpc.keepalive_timeout_ms', 20000),
            ('grpc.keepalive_permit_without_calls', True),
            ('grpc.http2.max_pings_without_data', 0),
            ('grpc.http2.min_time_between_pings_ms', 10000),
            ('grpc.http2.min_ping_interval_without_data_ms', 300000)
        ]
    )
    
    # Add servicers
    # intelligence_pb2_grpc.add_EmotionAnalysisServiceServicer_to_server(
    #     EmotionAnalysisServicer(), server
    # )
    intelligence_pb2_grpc.add_MediaEnhancementServiceServicer_to_server(
        MediaEnhancementServicer(), server
    )
    intelligence_pb2_grpc.add_NarrationServiceServicer_to_server(
        NarrationServicer(), server
    )
    intelligence_pb2_grpc.add_SmartClippingServiceServicer_to_server(
        SmartClippingServicer(), server
    )
    intelligence_pb2_grpc.add_PlatformOptimizerServiceServicer_to_server(
        PlatformOptimizerServicer(), server
    )
    # intelligence_pb2_grpc.add_ThumbnailServiceServicer_to_server(
    #     ThumbnailServicer(), server
    # )
    intelligence_pb2_grpc.add_StoryModeServiceServicer_to_server(
        StoryModeServicer(), server
    )
    intelligence_pb2_grpc.add_NoiseReducerServiceServicer_to_server(
        NoiseReducerServicer(), server
    )
    intelligence_pb2_grpc.add_SessionManagementServiceServicer_to_server(
        SessionManagementServicer(), server
    )
    # Viral analysis is now integrated into clipping and platform optimization

    # Enable reflection for development
    if getattr(settings, 'enable_reflection', True):
        SERVICE_NAMES = (
            # intelligence_pb2.DESCRIPTOR.services_by_name['EmotionAnalysisService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['MediaEnhancementService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['NarrationService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['SmartClippingService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['PlatformOptimizerService'].full_name,
            # intelligence_pb2.DESCRIPTOR.services_by_name['ThumbnailService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['StoryModeService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['NoiseReducerService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['SessionManagementService'].full_name,
            intelligence_pb2.DESCRIPTOR.services_by_name['ViralAnalysisService'].full_name,
            reflection.SERVICE_NAME,
        )
        reflection.enable_server_reflection(SERVICE_NAMES, server)
        logger.info("gRPC reflection enabled")
    
    return server

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    sys.exit(0)

def serve():
    """Start the gRPC server and optionally REST API server"""
    # Log startup info
    logger.info("🚀 Starting AI gRPC Server for Cenphi Testimonial Management Platform")

    # Check environment
    env_mode = os.getenv('ENV_MODE', 'development')
    is_cloud_run = os.getenv('CLOUD_RUN', 'false').lower() == 'true'
    logger.info(f"🌍 Environment mode: {env_mode}, Cloud Run: {is_cloud_run}")

    settings.setup_oci_key()

    # Create and configure gRPC server
    server = create_server()

    # Configure server address based on environment
    if is_cloud_run:
        # Cloud Run: gRPC on PORT (8080), no REST server needed
        grpc_port = os.getenv('PORT', '8080')
        logger.info(f"☁️  Cloud Run mode: gRPC only on port {grpc_port}")
    else:
        # Local dev: gRPC on 50052, REST on 8080
        grpc_port = os.getenv('GRPC_PORT', '50052')
        logger.info(f"💻 Local dev mode: gRPC on {grpc_port}, REST on 8080")

    listen_addr = f"[::]:{grpc_port}"
    server.add_insecure_port(listen_addr)

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    VERSION = f"deployed-{datetime.datetime.now().isoformat()}"
    logger.info(f"🚀 Service version: {VERSION}")

    # Start REST API server ONLY in local development
    if not is_cloud_run:
        import threading
        import uvicorn
        from rest_main import app as rest_app

        rest_port = int(os.getenv('REST_PORT', '8080'))

        def run_rest_server():
            """Run FastAPI REST server for job cancellation"""
            logger.info(f"🌐 Starting REST API server on port {rest_port}")
            uvicorn.run(rest_app, host="0.0.0.0", port=rest_port, log_level="info")

        rest_thread = threading.Thread(target=run_rest_server, daemon=True)
        rest_thread.start()
        logger.info(f"✅ REST API server started on port {rest_port}")
    else:
        logger.info(f"☁️  Skipping REST API server in Cloud Run (use gRPC cancellation)")

    # Start gRPC server
    server.start()
    logger.info(f"🚀 AI gRPC Server started on {listen_addr}")
    logger.info("Available services: MediaEnhancement, Narration, SmartClipping, PlatformOptimizer, GenerateStoryVideo, NoiseReducer, SessionManagement, ViralAnalysis")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("🛑 Server interrupted by user")
        server.stop(grace=10)

if __name__ == "__main__":
    serve()