
# ai-service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import logging
import os
import uuid
from contextlib import asynccontextmanager
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Your existing imports
from src.config.settings import settings
from src.utils.logging_config import setup_logging
from src.utils.job_cancellation_manager import job_checker
from src.config import models

# Initialize logging
setup_logging(settings.log_level, settings.log_format)
logger = logging.getLogger(__name__)

executor = ThreadPoolExecutor(max_workers=10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("🚀 Starting AI REST Service")
    logger.info(f"🌍 Environment: {os.getenv('ENV_MODE', 'development')}")
    settings.setup_oci_key()
    yield
    logger.info("🛑 Shutting down AI REST Service")


app = FastAPI(
    title="Cenphi AI Service",
    description="REST API for Cenphi AI testimonial processing services",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint for RunPod"""
    return {
        "status": "healthy",
        "service": "ai-intelligence-service",
        "version": "1.0.0"
    }


def _sync_enhance_media(request: models.EnhanceRequest):
    """Sync wrapper for media enhancement"""

    from src.services.enhancement.enhancer import MediaEnhancer
    enhancer = MediaEnhancer()

    return enhancer.enhance(
            media_url=request.media_url,
            quality=request.quality or 'medium',
            upload_to_cloud=request.upload_to_cloud,
            logo_url=request.logo_url,
            watermark_text=request.watermark_text,
            watermark_position=request.watermark_position,
            add_branding=request.add_branding,
            brand_color=request.brand_color,
            custom_enhancements=request.custom_enhancements or None,
            testimonial_id=request.testimonial_id or None,
        )




@app.post("/ai/media/enhance", response_model=models.EnhanceRequest)
async def enhance_media(request: models.EnhanceRequest) -> models.EnhanceResponse:
    """Enhance video/audio quality"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Media enhancement request for: {request.media_url}")

        job_checker.handle_cancellation(job_id)
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_enhance_media, request)
        
        if result.get("error"):
            job_checker.complete_job(job_id)
            raise HTTPException(status_code=500, detail=result["error"])
        
        job_checker.complete_job(job_id)

        return models.EnhanceResponse(
            enhanced_url=result.get("enhanced_url", ""),
            applied_enhancements=result.get("applied_enhancements", []),
            quality_score=result.get("quality_score", 0.0),
            media_type=result.get("media_type", "unknown")
        )
        
    except HTTPException:
        job_checker.complete_job(job_id)
        raise
    except Exception as e:
        logger.error(f"Media enhancement failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

def _sync_generate_narration(request: models.NarrationRequest):
    """Sync wrapper for narration generator"""

    from src.services.narration.narrator import NarrationGenerator
    narrator = NarrationGenerator()

    return narrator.generate(
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


@app.post("/ai/narration/generate", response_model=models.NarrationResponse)
async def generate_narration(request: models.NarrationRequest) -> models.NarrationResponse:
    """Generate voice narration"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Narration request: {len(request.text)} characters")
        job_checker.handle_cancellation(job_id)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_generate_narration, request)
        
        if result.get("error"):
            job_checker.complete_job(job_id)
            raise HTTPException(status_code=500, detail=result["error"])
        
        job_checker.complete_job(job_id)
        
        return models.NarrationResponse(
            audio_url=result.get("audio_url", ""),
            audio_duration_seconds=result.get("audio_duration_seconds", 0.0),
            voice_provider=result.get("voice_provider", "unknown"),
            quality_score=result.get("quality_score", 0.0),
            processed_text=result.get("processed_text", request.text)
        )
    except HTTPException:
        job_checker.complete_job(job_id)
        raise

    except Exception as e:
        logger.error(f"Narration failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    
def _sync_clip_generation(request: models.ClippingRequest):
    """Sync wrapper for clip generation"""

    from src.services.clip.clipper import SmartClipper
    clipper = SmartClipper()

    return clipper.generate_clips(
            testimonial_id=request.testimonial_id,
            media_url=request.media_url,
            highlight_moments=request.highlight_moments,
            branding=request.branding,
            background_music=request.background_music if request.background_music else None,
            music_volume=request.music_volume if request.music_volume else 'low',
        )

@app.post("/ai/clips/generate", response_model=models.ClippingResponse)
async def generate_clips(request: models.ClippingRequest) -> models.ClippingResponse:
    """Generate smart clips from video"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Clipping request for: {request.media_url}")
        job_checker.handle_cancellation(job_id)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_clip_generation, request)
        
        if result.get("error"):
            job_checker.complete_job(job_id)
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Convert clips
        clips = []
        for clip_data in result.get("clips", []):
            clips.append(models.Clip(
                url=clip_data.get("url", ""),
                start_time=clip_data.get("start_time", 0.0),
                end_time=clip_data.get("end_time", 0.0),
                title=clip_data.get("title", ""),
                theme=clip_data.get("theme", ""),
                engagement_score=clip_data.get("engagement_score", 0.0),
                duration_seconds=clip_data.get("duration_seconds", 0.0),
                social_media_ready=clip_data.get("social_media_ready", {})
            ))
        
        job_checker.complete_job(job_id)

        return models.ClippingResponse(
            clips=clips,
            clips_generated=result.get("clips_generated", 0),
            average_quality=result.get("average_quality", 0.0),
            detection_method=result.get("detection_method", "automatic")
        )
    
    except HTTPException:
        job_checker.complete_job(job_id)
        raise
        
    except Exception as e:
        logger.error(f"Clipping failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

def _sync_optimize_media(request: models.OptimizeRequest):
    """Sync wrapper for media optimization"""

    from src.services.platform_optimizer.optimizer import PlatformOptimizer
    optimizer = PlatformOptimizer()

    return optimizer.optimize(
            media_url=request.media_url,
            target_platform=request.target_platform,
            brand_context=request.brand_context,
            background_music=request.background_music or None,
            music_volume=request.music_volume or 'low',
            transcript=request.transcript,
            enable_captions=request.enable_captions,
            enable_media_enhancement=request.enable_media_enhancement,
            watermark_text=request.watermark_text,
            logo_position=request.logo_position,
            watermark_position=request.watermark_position,
            transcript_segments=request.transcript_segments,
            add_background_music=request.add_background_music,
        )


@app.post("/ai/optimize", response_model=models.OptimizeResponse)
async def optimize_media(request: models.OptimizeRequest) -> models.OptimizeResponse:
    """Optimize media for specific platforms"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Platform optimization for: {request.target_platform}")
        job_checker.handle_cancellation(job_id)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_optimize_media, request)

        job_checker.complete_job(job_id)
        
        return result
    
    except HTTPException:
        job_checker.complete_job(job_id)
        raise
        
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

def _sync_story_generation(request: models.StoryModeRequest):
    """Sync wrapper for story generation"""
    
    from src.services.story_mode.story_generator import StoryModeGenerator
    story_generator = StoryModeGenerator()

    return story_generator.generate_story_video(
            testimonial_segments=request.testimonial_segments,
            brand_context=request.brand_context,
            output_format=request.output_format,
            background_music=request.background_music if request.background_music else None,
            music_volume=request.music_volume if request.music_volume else 'low',
            prompt=request.prompt,
            add_background_music=request.add_background_music,
            intro_image_url=request.intro_image_url,
            outro_image_url=request.outro_image_url,
            company_name=request.company_name
        )


@app.post("/ai/story/generate", response_model=models.StoryModeResponse)
async def generate_story_video(request: models.StoryModeRequest) -> models.StoryModeResponse:
    """Generate story video from testimonials"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Story generation with {len(request.testimonial_segments)} segments")
        job_checker.handle_cancellation(job_id)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_story_generation, request)
        
        if result.get('error'):
            job_checker.complete_job(job_id)
            raise HTTPException(status_code=500, detail=result['error'])
        
        job_checker.complete_job(job_id)

        return models.StoryModeResponse(
            story_video_url=result.get('story_video_url', '')
        )
    
    except HTTPException:
        job_checker.complete_job(job_id)
        raise

    except Exception as e:
        logger.error(f"Story generation failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

def _sync_reduce_noise(request: models.NoiseReductionRequest):
    """Sync wrapper for noise reduction"""

    from src.services.noise_reducer.reducer import NoiseReducer
    noise_reducer = NoiseReducer()

    return noise_reducer.process(
            media_url=request.media_url,
            level=request.level
        )


@app.post("/ai/noise/reduce", response_model=models.NoiseReductionResponse)
async def reduce_noise(request: models.NoiseReductionRequest) -> models.NoiseReductionResponse:
    """Reduce noise from audio/video"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Noise reduction for: {request.media_url}")
        job_checker.handle_cancellation(job_id)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_reduce_noise, request)

        job_checker.complete_job(job_id)
        
        return result
    
    except HTTPException:
        job_checker.complete_job(job_id)
        raise
        
    except Exception as e:
        logger.error(f"Noise reduction failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

def _sync_batch_reduce_noise(request: models.BatchNoiseReductionRequest):
    """Sync wrapper for batch noise reduction"""

    from src.services.noise_reducer.reducer import NoiseReducer
    noise_reducer = NoiseReducer()

    return noise_reducer.batch_process(
            options=request.options,
            level=request.level
        )


@app.post("/ai/noise/reduce/batch", response_model=models.BatchNoiseReductionResponse)
async def batch_reduce_noise(request: models.BatchNoiseReductionRequest) -> models.BatchNoiseReductionResponse:
    """Batch reduce noise from multiple files"""
    job_id = request.job_id or str(uuid.uuid4())
    try:
        logger.info(f"Batch noise reduction for {len(request.options)} files")
        job_checker.handle_cancellation(job_id)
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, _sync_batch_reduce_noise, request)
        
        job_checker.complete_job(job_id)
        return result
    
    except HTTPException:
        job_checker.complete_job(job_id)
        raise
        
    except Exception as e:
        logger.error(f"Batch noise reduction failed: {str(e)}")
        job_checker.complete_job(job_id)
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/ai/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job"""
    job_checker.cancel_job(job_id)
    return {"message": f"Job {job_id} cancellation requested"}
    

# def signal_handler(signum, frame):
#     """Handle shutdown signals"""
#     logger.info(f"Received signal {signum}. Shutting down gracefully...")
#     sys.exit(0)

# signal.signal(signal.SIGINT, signal_handler)
# signal.signal(signal.SIGTERM, signal_handler)



if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("HTTP_PORT", "8000"))
    
    logger.info(f"🚀 Starting REST server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level=settings.log_level.lower(),
        reload=os.getenv("ENV_MODE") == "development"
    )