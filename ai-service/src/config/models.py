# from typing import List, Dict, Optional
# from pydantic import BaseModel

# # =========================================================
# # PYDANTIC MODELS
# # =========================================================

# class BrandContext(BaseModel):
#     about_info: str = ""
#     keywords: List[str] = []
#     tone: str = ""
#     brand_colors: Dict[str, str] = {}
#     color_slice: List[str] = []
#     brand_fonts: Dict[str, str] = {}
#     logo_url: str = ""
#     values: List[str] = []
#     tagline: str = ""
#     target_audience: str = ""
#     mission_statement: str = ""
#     business_model: str = ""
#     company_size: str = ""
#     extracted_data: Dict[str, str] = {}

# class MediaOpt(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str

# class Word(BaseModel):
#     text: str
#     start: float
#     end: float
#     confidence: float = 0.0
#     speaker: str = ""

# class TranscriptSegment(BaseModel):
#     text: str
#     start_time: float
#     end_time: float
#     speaker: str = ""
#     words: List[Word] = []

# class HighlightMoment(BaseModel):
#     start_time: float
#     end_time: float
#     text: str
#     theme: str = ""
#     words: List[Word] = []
#     social_media_optimize: bool = False
#     enhance_clip: bool = False
#     include_logo: bool = False
#     include_subtitle: bool = False
#     include_watermark: bool = False
#     quality: str = "high"
#     add_background_music: bool = False
#     include_theme: bool = False
#     remove_noise: bool = False
#     importance_score: float = 0.0
#     highlight_type: str = ""
#     suggested_title: str = ""
#     keywords: List[str] = []
#     emotional_intensity: float = 0.0
#     shareability: float = 0.0

# class BrandingOptions(BaseModel):
#     logo_url: str = ""
#     brand_color: str = ""
#     watermark_position: str = ""

# class TestimonialSegment(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     highlights: List[HighlightMoment] = []

# class EmotionSegment(BaseModel):
#     start_time: float
#     end_time: float
#     dominant_emotion: str
#     confidence: float
#     facial_expression: str = ""
#     emotion_scores: Dict[str, float] = {}
#     authenticity_score: float = 0.0

# class Clip(BaseModel):
#     url: str
#     start_time: float
#     end_time: float
#     title: str = ""
#     theme: str = ""
#     engagement_score: float = 0.0
#     duration_seconds: float = 0.0
#     social_media_ready: Dict[str, bool] = {}

# # ============================================================================
# # REQUEST MODELS
# # ============================================================================

# class EmotionRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     target_emotions: List[str] = []
#     analysis_depth: str = "standard"
#     job_id: Optional[str] = None

# class EnhanceRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     quality: str = "high"
#     upload_to_cloud: bool = False
#     custom_enhancements: Optional[List[str]] = None
#     logo_url: str = ""
#     watermark_text: str = ""
#     watermark_position: str = ""
#     brand_color: str = ""
#     add_branding: bool = False
#     job_id: Optional[str] = None

# class BatchEnhanceRequest(BaseModel):
#     options: List[MediaOpt]
#     quality: str = "high"
#     upload_to_cloud: bool = False
#     custom_enhancements: Optional[List[str]] = None
#     logo_url: str = ""
#     watermark_text: str = ""
#     watermark_position: str = ""
#     brand_color: str = ""
#     add_branding: bool = False
#     job_id: Optional[str] = None

# class NarrationRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     text: str
#     language: str = "en"
#     voice_id: str = ""
#     gender: str = ""
#     style: str = ""
#     prompt: str = ""
#     background_music: str = ""
#     music_volume: str = "low"
#     add_background_music: bool = False
#     optimize_speech: bool = True
#     job_id: Optional[str] = None

# class BatchNarrationOpt(BaseModel):
#     testimonial_id: str
#     text: str

# class BatchNarrationRequest(BaseModel):
#     options: List[BatchNarrationOpt]
#     language: str = "en"
#     voice_id: str = ""
#     gender: str = ""
#     style: str = ""
#     prompt: str = ""
#     background_music: str = ""
#     music_volume: str = "low"
#     add_background_music: bool = False
#     optimize_speech: bool = True
#     job_id: Optional[str] = None

# class ClippingRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     highlight_moments: List[HighlightMoment] = []
#     branding: Optional[BrandingOptions] = None
#     background_music: str = ""
#     music_volume: str = "low"
#     job_id: Optional[str] = None

# class ClippingRequestOpt(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     highlight_moments: List[HighlightMoment] = []

# class BatchClippingRequest(BaseModel):
#     options: List[ClippingRequestOpt]
#     branding: Optional[BrandingOptions] = None
#     background_music: str = ""
#     music_volume: str = "low"
#     job_id: Optional[str] = None

# class OptimizeRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     target_platform: str
#     brand_context: Optional[BrandContext] = None
#     transcript: str = ""
#     optimization_quality: str = "high"
#     max_moments: int = 5
#     enable_transitions: bool = True
#     add_branding: bool = False
#     background_music: str = ""
#     music_volume: str = "low"
#     enable_captions: bool = False
#     enable_media_enhancement: bool = False
#     watermark_text: str = ""
#     logo_position: str = ""
#     watermark_position: str = ""
#     transcript_segments: List[TranscriptSegment] = []
#     add_background_music: bool = False
#     job_id: Optional[str] = None

# class OptimizeOptions(BaseModel):
#     testimonial_id: str
#     media_url: str
#     transcript_segments: List[TestimonialSegment] = []

# class BatchOptimizeRequest(BaseModel):
#     options: List[OptimizeOptions]
#     target_platform: str
#     brand_context: Optional[BrandContext] = None
#     transcript: str = ""
#     optimization_quality: str = "high"
#     max_moments: int = 5
#     enable_transitions: bool = True
#     add_branding: bool = False
#     background_music: str = ""
#     music_volume: str = "low"
#     enable_captions: bool = False
#     enable_media_enhancement: bool = False
#     watermark_text: str = ""
#     logo_position: str = ""
#     watermark_position: str = ""
#     add_background_music: bool = False
#     job_id: Optional[str] = None

# class ThumbnailRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     max_thumbnails: int = 3
#     job_id: Optional[str] = None

# class StoryModeRequest(BaseModel):
#     testimonial_segments: List[TestimonialSegment]
#     brand_context: Optional[BrandContext] = None
#     output_format: str = "mp4"
#     background_music: str = ""
#     music_volume: str = "low"
#     prompt: str = ""
#     intro_image_url: str = ""
#     outro_image_url: str = ""
#     company_name: str = ""
#     add_background_music: bool = False
#     job_id: Optional[str] = None

# class BatchStoryModeOptions(BaseModel):
#     opt: List[TestimonialSegment]

# class BatchStoryModeRequest(BaseModel):
#     testimonial_segments: List[BatchStoryModeOptions]
#     brand_context: Optional[BrandContext] = None
#     output_format: str = "mp4"
#     background_music: str = ""
#     music_volume: str = "low"
#     prompt: str = ""
#     intro_image_url: str = ""
#     outro_image_url: str = ""
#     company_name: str = ""
#     add_background_music: bool = False
#     job_id: Optional[str] = None

# class NoiseReductionRequest(BaseModel):
#     testimonial_id: Optional[str] = None
#     media_url: str
#     level: str
#     job_id: Optional[str] = None

# class BatchNoiseReductionRequest(BaseModel):
#     options: List[MediaOpt]
#     level: str
#     job_id: Optional[str] = None

# # ============================================================================
# # RESPONSE MODELS
# # ============================================================================

# class EmotionResponse(BaseModel):
#     segments: List[EmotionSegment] = []
#     overall_confidence: float = 0.0
#     customer_satisfaction_score: float = 0.0
#     emotion_distribution: Dict[str, float] = {}
#     error: str = ""

# class EnhanceResponse(BaseModel):
#     enhanced_url: str = ""
#     applied_enhancements: List[str] = []
#     quality_score: float = 0.0
#     media_type: str = ""
#     error: str = ""

# class BatchEnhanceResponseOpt(BaseModel):
#     testimonial_id: str
#     enhanced_url: str
#     applied_enhancements: List[str]
#     error: str = ""

# class BatchEnhanceResponse(BaseModel):
#     response: List[BatchEnhanceResponseOpt]

# class NarrationResponse(BaseModel):
#     audio_url: str = ""
#     audio_duration_seconds: float = 0.0
#     voice_provider: str = ""
#     quality_score: float = 0.0
#     processed_text: str = ""
#     error: str = ""

# class BatchNarrationResponse(BaseModel):
#     response: List[NarrationResponse]

# class ClippingResponse(BaseModel):
#     clips: List[Clip] = []
#     clips_generated: int = 0
#     average_quality: float = 0.0
#     detection_method: str = ""
#     error: str = ""

# class BatchClippingResponse(BaseModel):
#     response: List[ClippingResponse]

# class OptimizeResponse(BaseModel):
#     optimized_url: str = ""
#     applied_optimizations: List[str] = []
#     platform: str = ""
#     media_type: str = ""
#     success: bool = False
#     error: str = ""
#     testimonial_id: Optional[str] = ""

# class BatchOptimizeResponse(BaseModel):
#     responses: List[OptimizeResponse]

# class ThumbnailResponse(BaseModel):
#     thumbnail_urls: List[str] = []

# class StoryModeResponse(BaseModel):
#     story_video_url: str = ""

# class BatchStoryModeResponse(BaseModel):
#     story_video_urls: List[str] = []

# class NoiseReductionResponse(BaseModel):
#     testimonial_id: Optional[str] = None
#     denoised_media_url: str
#     error: str = ""

# class BatchNoiseReductionResponse(BaseModel):
#     response: List[NoiseReductionResponse]


from typing import List, Dict, Optional
from pydantic import BaseModel, field_validator

# =========================================================
# PYDANTIC MODELS - FIXED FOR PROTOBUF NULL HANDLING
# =========================================================

class BrandContext(BaseModel):
    about_info: str = ""
    keywords: List[str] = []
    tone: str = ""
    brand_colors: Dict[str, str] = {}
    color_slice: List[str] = []
    brand_fonts: Dict[str, str] = {}
    logo_url: str = ""
    values: List[str] = []
    tagline: str = ""
    target_audience: str = ""
    mission_statement: str = ""
    business_model: str = ""
    company_size: str = ""
    extracted_data: Dict[str, str] = {}

class MediaOpt(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str

class Word(BaseModel):
    text: str
    start: float
    end: float
    confidence: float = 0.0
    speaker: str = ""

class TranscriptSegment(BaseModel):
    text: str
    start_time: float
    end_time: float
    speaker: str = ""
    words: List[Word] = []

class HighlightMoment(BaseModel):
    start_time: float
    end_time: float
    text: str
    theme: str = ""
    words: List[Word] = []
    social_media_optimize: bool = False
    enhance_clip: bool = False
    include_logo: bool = False
    include_subtitle: bool = False
    include_watermark: bool = False
    quality: str = "high"
    add_background_music: bool = False
    include_theme: bool = False
    remove_noise: bool = False
    importance_score: float = 0.0
    highlight_type: str = ""
    suggested_title: str = ""
    keywords: List[str] = []
    emotional_intensity: float = 0.0
    shareability: float = 0.0

class BrandingOptions(BaseModel):
    logo_url: Optional[str] = None
    brand_color: Optional[str] = None
    watermark_position: Optional[str] = None
    
    @field_validator('logo_url', 'brand_color', 'watermark_position', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class TestimonialSegment(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    highlights: List[HighlightMoment] = []

class EmotionSegment(BaseModel):
    start_time: float
    end_time: float
    dominant_emotion: str
    confidence: float
    facial_expression: str = ""
    emotion_scores: Dict[str, float] = {}
    authenticity_score: float = 0.0

class Clip(BaseModel):
    url: str
    start_time: float
    end_time: float
    title: str = ""
    theme: str = ""
    engagement_score: float = 0.0
    duration_seconds: float = 0.0
    social_media_ready: Dict[str, bool] = {}

# ============================================================================
# REQUEST MODELS - FIXED FOR PROTOBUF NULL HANDLING
# ============================================================================

class EmotionRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    target_emotions: List[str] = []
    analysis_depth: str = "standard"
    job_id: Optional[str] = None

class EnhanceRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    quality: str = "high"
    upload_to_cloud: bool = False
    custom_enhancements: Optional[List[str]] = None
    # Fixed: Handle protobuf nulls for these fields
    logo_url: Optional[str] = None
    watermark_text: Optional[str] = None
    watermark_position: Optional[str] = None
    brand_color: Optional[str] = None
    add_branding: bool = False
    job_id: Optional[str] = None
    
    @field_validator('logo_url', 'watermark_text', 'watermark_position', 'brand_color', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class BatchEnhanceRequest(BaseModel):
    options: List[MediaOpt]
    quality: str = "high"
    upload_to_cloud: bool = False
    custom_enhancements: Optional[List[str]] = None
    # Fixed: Handle protobuf nulls for these fields
    logo_url: Optional[str] = None
    watermark_text: Optional[str] = None
    watermark_position: Optional[str] = None
    brand_color: Optional[str] = None
    add_branding: bool = False
    job_id: Optional[str] = None
    
    @field_validator('logo_url', 'watermark_text', 'watermark_position', 'brand_color', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class NarrationRequest(BaseModel):
    testimonial_id: Optional[str] = None
    text: str
    language: str = "en"
    # Fixed: Handle protobuf nulls for these fields
    voice_id: Optional[str] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    prompt: Optional[str] = None
    background_music: Optional[str] = None
    music_volume: str = "low"
    add_background_music: bool = False
    optimize_speech: bool = True
    job_id: Optional[str] = None
    
    @field_validator('voice_id', 'gender', 'style', 'prompt', 'background_music', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class BatchNarrationOpt(BaseModel):
    testimonial_id: str
    text: str

class BatchNarrationRequest(BaseModel):
    options: List[BatchNarrationOpt]
    language: str = "en"
    # Fixed: Handle protobuf nulls for these fields
    voice_id: Optional[str] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    prompt: Optional[str] = None
    background_music: Optional[str] = None
    music_volume: str = "low"
    add_background_music: bool = False
    optimize_speech: bool = True
    job_id: Optional[str] = None
    
    @field_validator('voice_id', 'gender', 'style', 'prompt', 'background_music', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class ClippingRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    highlight_moments: List[HighlightMoment] = []
    branding: Optional[BrandingOptions] = None
    # Fixed: Handle protobuf nulls for this field
    background_music: Optional[str] = None
    music_volume: str = "low"
    job_id: Optional[str] = None
    
    @field_validator('background_music', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class ClippingRequestOpt(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    highlight_moments: List[HighlightMoment] = []

class BatchClippingRequest(BaseModel):
    options: List[ClippingRequestOpt]
    branding: Optional[BrandingOptions] = None
    # Fixed: Handle protobuf nulls for this field
    background_music: Optional[str] = None
    music_volume: str = "low"
    job_id: Optional[str] = None
    
    @field_validator('background_music', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class OptimizeRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    target_platform: str
    brand_context: Optional[BrandContext] = None
    transcript: str = ""
    optimization_quality: str = "high"
    max_moments: int = 5
    enable_transitions: bool = True
    add_branding: bool = False
    # Fixed: Handle protobuf nulls for these fields
    background_music: Optional[str] = None
    music_volume: str = "low"
    enable_captions: bool = False
    enable_media_enhancement: bool = False
    watermark_text: Optional[str] = None
    logo_position: Optional[str] = None
    watermark_position: Optional[str] = None
    transcript_segments: List[TranscriptSegment] = []
    add_background_music: bool = False
    job_id: Optional[str] = None
    
    @field_validator('background_music', 'watermark_text', 'logo_position', 'watermark_position', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class OptimizeOptions(BaseModel):
    testimonial_id: str
    media_url: str
    transcript_segments: List[TestimonialSegment] = []

class BatchOptimizeRequest(BaseModel):
    options: List[OptimizeOptions]
    target_platform: str
    brand_context: Optional[BrandContext] = None
    transcript: str = ""
    optimization_quality: str = "high"
    max_moments: int = 5
    enable_transitions: bool = True
    add_branding: bool = False
    # Fixed: Handle protobuf nulls for these fields
    background_music: Optional[str] = None
    music_volume: str = "low"
    enable_captions: bool = False
    enable_media_enhancement: bool = False
    watermark_text: Optional[str] = None
    logo_position: Optional[str] = None
    watermark_position: Optional[str] = None
    add_background_music: bool = False
    job_id: Optional[str] = None
    
    @field_validator('background_music', 'watermark_text', 'logo_position', 'watermark_position', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class ThumbnailRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    max_thumbnails: int = 3
    job_id: Optional[str] = None

class StoryModeRequest(BaseModel):
    testimonial_segments: List[TestimonialSegment]
    brand_context: Optional[BrandContext] = None
    output_format: str = "mp4"
    # Fixed: Handle protobuf nulls for these fields
    background_music: Optional[str] = None
    music_volume: str = "low"
    prompt: Optional[str] = None
    intro_image_url: Optional[str] = None
    outro_image_url: Optional[str] = None
    company_name: Optional[str] = None
    add_background_music: bool = False
    job_id: Optional[str] = None
    
    @field_validator('background_music', 'prompt', 'intro_image_url', 'outro_image_url', 'company_name', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class BatchStoryModeOptions(BaseModel):
    opt: List[TestimonialSegment]

class BatchStoryModeRequest(BaseModel):
    testimonial_segments: List[BatchStoryModeOptions]
    brand_context: Optional[BrandContext] = None
    output_format: str = "mp4"
    # Fixed: Handle protobuf nulls for these fields
    background_music: Optional[str] = None
    music_volume: str = "low"
    prompt: Optional[str] = None
    intro_image_url: Optional[str] = None
    outro_image_url: Optional[str] = None
    company_name: Optional[str] = None
    add_background_music: bool = False
    job_id: Optional[str] = None
    
    @field_validator('background_music', 'prompt', 'intro_image_url', 'outro_image_url', 'company_name', mode='before')
    @classmethod
    def handle_protobuf_nulls(cls, v):
        return v if v is not None else ""

class NoiseReductionRequest(BaseModel):
    testimonial_id: Optional[str] = None
    media_url: str
    level: str = "medium"
    job_id: Optional[str] = None

class BatchNoiseReductionRequest(BaseModel):
    options: List[MediaOpt]
    level: str = "medium"
    job_id: Optional[str] = None

# ============================================================================
# RESPONSE MODELS - CORRECT NAMES
# ============================================================================

class EmotionResponse(BaseModel):
    segments: List[EmotionSegment] = []
    overall_confidence: float = 0.0
    customer_satisfaction_score: float = 0.0
    emotion_distribution: Dict[str, float] = {}
    error: str = ""

class EnhanceResponse(BaseModel):
    enhanced_url: str = ""
    applied_enhancements: List[str] = []
    quality_score: float = 0.0
    media_type: str = ""
    error: str = ""

class BatchEnhanceResponseOpt(BaseModel):
    testimonial_id: str
    enhanced_url: str
    applied_enhancements: List[str]
    error: str = ""

class BatchEnhanceResponse(BaseModel):
    response: List[BatchEnhanceResponseOpt]

class NarrationResponse(BaseModel):
    audio_url: str = ""
    audio_duration_seconds: float = 0.0
    voice_provider: str = ""
    quality_score: float = 0.0
    processed_text: str = ""
    error: str = ""

class BatchNarrationResponse(BaseModel):
    response: List[NarrationResponse]

class ClippingResponse(BaseModel):
    clips: List[Clip] = []
    clips_generated: int = 0
    average_quality: float = 0.0
    detection_method: str = ""
    error: str = ""

class BatchClippingResponse(BaseModel):
    response: List[ClippingResponse]

class OptimizeResponse(BaseModel):
    optimized_url: str = ""
    applied_optimizations: List[str] = []
    platform: str = ""
    media_type: str = ""
    success: bool = False
    error: str = ""
    testimonial_id: Optional[str] = ""

class BatchOptimizeResponse(BaseModel):
    responses: List[OptimizeResponse]

class ThumbnailResponse(BaseModel):
    thumbnail_urls: List[str] = []

class StoryModeResponse(BaseModel):  # Correct name!
    story_video_url: str = ""

class BatchStoryModeResponse(BaseModel):  # Correct name!
    story_video_urls: List[str] = []

class NoiseReductionResponse(BaseModel):
    testimonial_id: Optional[str] = None
    denoised_media_url: str = ""
    error: str = ""

class BatchNoiseReductionResponse(BaseModel):
    response: List[NoiseReductionResponse]