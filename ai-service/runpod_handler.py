# runpod_handler.py
import sys
import os
import logging
import traceback
import time

# Setup logging for RunPod
logging.basicConfig(level=logging.INFO, stream=sys.stdout, force=True)
logger = logging.getLogger(__name__)

def log(message):
    """Helper to ensure logs show up in RunPod"""
    print(f"[{time.time()}] {message}")
    sys.stdout.flush()


def initialize_runpod_services():
    """Initialize services that FastAPI lifespan normally handles"""
    try:
        from src.config.settings import settings
        settings.setup_oci_key()
        log("✅ OCI keys initialized for RunPod")
    except Exception as e:
        log(f"⚠️  OCI setup failed: {e}")

initialize_runpod_services()


def handler(event):
    """RunPod serverless handler"""
    try:
        log("=== HANDLER STARTED ===")
        log(f"Event received: {event}")
        
        input_data = event.get("input", {})
        task = input_data.get("task", "")
        
        log(f"Processing task: {task}")
        
        # Route to appropriate handler
        if task == "enhance_media":
            return handle_enhance_media(input_data)
        elif task == "generate_narration":
            return handle_narration(input_data)
        elif task == "generate_clips":
            return handle_clipping(input_data)
        elif task == "optimize_media_platform":
            return handle_optimization(input_data)
        elif task == "generate_story_video":
            return handle_story(input_data)
        elif task == "reduce_noise":
            return handle_noise_reduction(input_data)
        elif task == "batch_reduce_noise":
            return handle_batch_noise_reduction(input_data)
        else:
            log(f"Unknown task: {task}")
            return {"error": f"Unknown task: {task}"}
            
    except Exception as e:
        error_msg = f"Handler error: {str(e)}"
        log(error_msg)
        log(f"Traceback: {traceback.format_exc()}")
        return {"error": error_msg}

def handle_enhance_media(input_data):
    """Handle media enhancement"""
    try:
        log("Starting media enhancement...")
        
        # Import here to avoid circular imports
        from main import _sync_enhance_media
        from src.config import models
        
        # Create request object
        request = models.EnhanceRequest(
            media_url=input_data.get("media_url"),
            quality=input_data.get("quality", "medium"),
            upload_to_cloud=input_data.get("upload_to_cloud", True),
            custom_enhancements=input_data.get("custom_enhancements", []),
            logo_url=input_data.get("logo_url"),
            watermark_text=input_data.get("watermark_text"),
            watermark_position=input_data.get("watermark_position"),
            add_branding=input_data.get("add_branding", False),
            brand_color=input_data.get("brand_color"),
            testimonial_id=input_data.get("testimonial_id"),
            job_id=input_data.get("job_id")
        )
        
        log(f"Enhancement request created for: {request.media_url}")
        
        # Call the sync function
        result = _sync_enhance_media(request)
        
        log(f"Enhancement completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Enhancement error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_narration(input_data):
    """Handle narration generation"""
    try:
        log("Starting narration generation...")
        
        from main import _sync_generate_narration
        from src.config import models
        
        request = models.NarrationRequest(
            text=input_data.get("text", ""),
            language=input_data.get("language", "en"),
            style=input_data.get("style", "professional"),
            gender=input_data.get("gender", "female"),
            background_music=input_data.get("background_music"),
            music_volume=input_data.get("music_volume", "low"),
            add_background_music=input_data.get("add_background_music", False),
            voice_id=input_data.get("voice_id"),
            optimize_speech=input_data.get("optimize_speech", False),
            testimonial_id=input_data.get("testimonial_id"),
            job_id=input_data.get("job_id")
        )
        
        log(f"Narration request for {len(request.text)} characters")
        
        result = _sync_generate_narration(request)
        
        log(f"Narration completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Narration error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_clipping(input_data):
    """Handle clip generation"""
    try:
        log("Starting clip generation...")
        
        from main import _sync_clip_generation
        from src.config import models
        
        request = models.ClippingRequest(
            testimonial_id=input_data.get("testimonial_id"),
            media_url=input_data.get("media_url"),
            highlight_moments=input_data.get("highlight_moments", []),
            branding=input_data.get("branding"),
            background_music=input_data.get("background_music"),
            music_volume=input_data.get("music_volume", "low"),
            job_id=input_data.get("job_id")
        )
        
        log(f"Clipping request for: {request.media_url}")
        
        result = _sync_clip_generation(request)
        
        log(f"Clipping completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Clipping error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_optimization(input_data):
    """Handle platform optimization"""
    try:
        log("Starting platform optimization...")
        
        from main import _sync_optimize_media
        from src.config import models
        
        request = models.OptimizeRequest(
            testimonial_id=input_data.get("testimonial_id"),
            media_url=input_data.get("media_url"),
            target_platform=input_data.get("target_platform"),
            brand_context=input_data.get("brand_context"),
            transcript=input_data.get("transcript"),
            optimization_quality=input_data.get("optimization_quality"),
            enable_transitions=input_data.get("enable_transitions", True),
            add_branding=input_data.get("add_branding", True),
            background_music=input_data.get("background_music"),
            music_volume=input_data.get("music_volume", "low"),
            enable_captions=input_data.get("enable_captions", True),
            enable_media_enhancement=input_data.get("enable_media_enhancement", True),
            watermark_text=input_data.get("watermark_text"),
            logo_position=input_data.get("logo_position"),
            watermark_position=input_data.get("watermark_position"),
            transcript_segments=input_data.get("transcript_segments", []),
            add_background_music=input_data.get("add_background_music", False),
            job_id=input_data.get("job_id")
        )
        
        log(f"Optimization request for platform: {request.target_platform}")
        
        result = _sync_optimize_media(request)
        
        log(f"Optimization completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Optimization error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_story(input_data):
    """Handle story video generation"""
    try:
        log("Starting story generation...")
        
        from main import _sync_story_generation
        from src.config import models
        
        request = models.StoryModeRequest(
            testimonial_segments=input_data.get("testimonial_segments", []),
            brand_context=input_data.get("brand_context"),
            output_format=input_data.get("output_format", "mp4"),
            background_music=input_data.get("background_music"),
            music_volume=input_data.get("music_volume", "low"),
            prompt=input_data.get("prompt"),
            intro_image_url=input_data.get("intro_image_url"),
            outro_image_url=input_data.get("outro_image_url"),
            company_name=input_data.get("company_name"),
            add_background_music=input_data.get("add_background_music", False),
            job_id=input_data.get("job_id")
        )
        
        log(f"Story generation with {len(request.testimonial_segments)} segments")
        
        result = _sync_story_generation(request)
        
        log(f"Story generation completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Story generation error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_noise_reduction(input_data):
    """Handle noise reduction"""
    try:
        log("Starting noise reduction...")
        
        from main import _sync_reduce_noise
        from src.config import models
        
        request = models.NoiseReductionRequest(
            testimonial_id=input_data.get("testimonial_id"),
            media_url=input_data.get("media_url"),
            level=input_data.get("level", "medium"),
            job_id=input_data.get("job_id")
        )
        
        log(f"Noise reduction for: {request.media_url}")
        
        result = _sync_reduce_noise(request)
        
        log(f"Noise reduction completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Noise reduction error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

def handle_batch_noise_reduction(input_data):
    """Handle batch noise reduction"""
    try:
        log("Starting batch noise reduction...")
        
        from main import _sync_batch_reduce_noise
        from src.config import models
        
        request = models.BatchNoiseReductionRequest(
            options=input_data.get("options", []),
            level=input_data.get("level", "medium"),
            job_id=input_data.get("job_id")
        )
        
        log(f"Batch noise reduction for {len(request.options)} files")
        
        result = _sync_batch_reduce_noise(request)
        
        log(f"Batch noise reduction completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Batch noise reduction error: {str(e)}"
        log(error_msg)
        return {"error": error_msg}

# Test handler locally
if __name__ == "__main__":
    # # Simple test
    # test_event = {
    #     "input": {
    #         "task": "enhance_media",
    #         "media_url": "https://example.com/test.mp4",
    #         "quality": "high"
    #     }
    # }
    
    # print("Testing handler locally...")
    # result = handler(test_event)
    # print(f"Result: {result}")

    import runpod
    # Start the serverless handler  
    runpod.serverless.start({"handler": handler})



