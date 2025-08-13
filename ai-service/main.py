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
            response.audio_duration_seconds = result.get("audio_duration_seconds", 0.0)
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
            logger.info(f"Smart clipping request for: {request.media_url}")

            from src.services.clip.clipper import SmartClipper
            clipper = SmartClipper()

        
            result = clipper.generate_clips(
                testimonial_id=request.testimonial_id,
                media_url=request.media_url,
                highlight_moments=request.highlight_moments,
                branding=request.branding,
                background_music=request.background_music if request.background_music else None,
                music_volume=request.music_volume if request.music_volume else 'low',
            )
            
            if result.get("error"):
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(result["error"])
                return intelligence_pb2.ClippingResponse(error=result["error"])
            
            # Convert result to protobuf response
            response = intelligence_pb2.ClippingResponse()
            response.clips_generated = result.get("clips_generated", 0)
            response.average_quality = result.get("average_quality", 0.0)
            response.detection_method = result.get("detection_method", "automatic")
            
            # Map clips
            for clip_data in result.get("clips", []):
                clip = intelligence_pb2.Clip()
                clip.url = clip_data.get("url", "")
                clip.start_time = clip_data.get("start_time", 0.0)
                clip.end_time = clip_data.get("end_time", 0.0)
                clip.title = clip_data.get("title", "")
                clip.theme = clip_data.get("theme", "")
                clip.engagement_score = clip_data.get("engagement_score", 0.0)
                clip.duration_seconds = clip_data.get("duration_seconds", 0.0)
                
                # Map social media ready status
                social_ready = clip_data.get("social_media_ready", {})
                for platform, ready in social_ready.items():
                    clip.social_media_ready[platform] = bool(ready)
                
                response.clips.append(clip)
                
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
    
    def OptimizeMedia(self, request, context):
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.OptimizeResponse(success=False)
           
            from src.services.platform_optimizer.optimizer import PlatformOptimizer
            optimizer = PlatformOptimizer()
            
            # # Call RunPod function
            # result = runpod_client.call_function_safely('platform-optimizer', **request_params)
            result = optimizer.optimize(
                media_url=request.media_url,
                target_platform=request.target_platform,
                brand_context=request.brand_context,
                background_music=request.background_music or None,
                music_volume=request.music_volume or 'low',
                transcript=request.transcript,
                enable_captions=request.enable_captions,
                enable_media_enhancement=request.enable_media_enhancement,
                watermark_text=request.watermark_text,
                logo_position = request.logo_position,
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
        


class StoryModeServicer(intelligence_pb2_grpc.StoryModeServiceServicer):
    """gRPC Servicer for Story Mode Video Generation"""
    
    def GenerateStoryVideo(self, request, context):
        """Generate multi-modal story video from testimonial segments"""
        job_id = request.job_id or str(uuid.uuid4())
        try:
            if job_checker.handle_cancellation(job_id, context):
                return intelligence_pb2.StoryModeResponse(success=False)
            logger.info(f"📖 Story mode request: {len(request.testimonial_segments)} segments, music: {request.background_music}")

            from src.services.story_mode.story_generator import StoryModeGenerator
            story_generator = StoryModeGenerator()
           

            result = story_generator.generate_story_video(
                testimonial_segments=request.testimonial_segments,
                brand_context=request.brand_context,
                output_format=request.output_format,
                background_music=request.background_music if request.background_music else None,
                music_volume=request.music_volume if request.music_volume else 'low',
                prompt=request.prompt,
                add_background_music = request.add_background_music,
                intro_image_url = request.intro_image_url,
                outro_image_url = request.outro_image_url,
                company_name=request.company_name
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
    """Start the gRPC server"""
    # Log startup info
    logger.info("🚀 Starting AI gRPC Server for Cenphi Testimonial Management Platform")
    
    # Check environment
    env_mode = os.getenv('ENV_MODE', 'development')
    logger.info(f"🌍 Environment mode: {env_mode}")

    settings.setup_oci_key()
    
    # Create and configure server
    server = create_server()
    
    # Configure server address
    # listen_addr = f"[::]:{getattr(settings, 'port', 8080)}"
    listen_addr = f"[::]:{os.getenv('PORT', '8080')}"
    server.add_insecure_port(listen_addr)
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    VERSION = f"deployed-{datetime.datetime.now().isoformat()}"
    logger.info(f"🚀 Service version: {VERSION}")
    
    # Start server
    server.start()
    logger.info(f"🚀 AI gRPC Server started on {listen_addr}")
    logger.info("Available services: MediaEnhancement, Narration, SmartClipping, PlatformOptimizer, GenerateStoryVideo")
    # logger.info(f"RunPod endpoint: {runpod_client.runpod_endpoint}")
    
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("🛑 Server interrupted by user")
        server.stop(grace=10)

if __name__ == "__main__":
    serve()