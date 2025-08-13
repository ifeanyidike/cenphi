# src/services/narration.py
import os
import uuid
import tempfile
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import librosa
# import soundfile as sf
from elevenlabs import ElevenLabs, VoiceSettings
from .voice_manager import VoiceManager
from .audio_processor import AudioProcessor
from .text_optimizer import TextOptimizer
from src.utils.music_mixer import MusicMixer

logger = logging.getLogger(__name__)

class NarrationGenerator:
    """AI-powered narration service with intelligent text optimization and premium voice synthesis"""
    
    def __init__(self):
        """Initialize narration service with OpenAI/ElevenLabs and AI optimization"""
        self.api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable is required")
        
        self.client = ElevenLabs(api_key=self.api_key)
        self.voice_manager = VoiceManager(self.api_key)
        self._audio_processor = None
        self._text_optimizer = None
        self._music_mixer = None
        self._storage_manager = None
        self._file_manager = None
        
        logger.info("NarrationService initialized with AI-powered optimization")

    @property
    def file_manager(self):
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager
    
    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def audio_processor(self):
        if self._audio_processor is None:
            self._audio_processor = AudioProcessor()
        return self._audio_processor
    
    @property
    def text_optimizer(self):
        if self._text_optimizer is None:
            self._text_optimizer = TextOptimizer()
        return self._text_optimizer
    
    @property
    def music_mixer(self):
        if self._music_mixer is None:
            self._music_mixer = MusicMixer()
        return self._music_mixer
    
    def batch_generate(self, 
                       options: List[Dict[str, str]], 
                      language: str = "en", 
                    gender: str = "female", 
                    style: str = "professional", 
                    background_music: Optional[str] = None, 
                    music_volume: str = "low", 
                    preferred_provider: str = "openai", 
                    upload_to_cloud = True, 
                    optimize_speech = False,
                    add_background_music: bool = False,
                    ) -> Dict[str, Any]:
        """
        Generate premium narration for multiple options with AI optimization using thread pool
        
        Args:
            options: List of dictionaries with keys:
                - testimonial_id: Unique identifier for the testimonial
                - text : Text to synthesize
                - voice_id: Specific voice ID (optional)
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        if not options:
            return {"error": "No options provided for batch generation"}
        
        results = []
        temp_files = []
        optimal_workers = min(8, max(2, os.cpu_count() - 1))

        try:
            with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
                future_to_option = {executor.submit(
                    self.generate, 
                    option['text'], 
                    voice_id=option.get('voice_id', None), 
                    language=language,
                    style=style,
                    background_music=background_music,
                    music_volume=music_volume,
                    preferred_provider=preferred_provider,
                    upload_to_cloud=upload_to_cloud,
                    optimize_speech=optimize_speech,
                    add_background_music=add_background_music
                ): option for option in options}
                
                for future in as_completed(future_to_option):
                    option = future_to_option[future]
                    try:
                        result = future.result()
                        results.append({
                            "testimonial_id": option.get('testimonial_id', 'unknown'),
                            "audio_url": result.get("audio_url", ""),
                            "audio_duration_seconds": result.get("audio_duration_seconds", 0.0),
                            "voice_provider": result.get("voice_provider", "elevenlabs"),
                            "quality_score": result.get("quality_score", 0.0),
                            "processed_text": result.get("processed_text", ""),
                            "error": result.get("error", "")
                        })
                        temp_files.extend(result.get("temp_files", []))
                    except Exception as e:
                        logger.error(f"Batch generation failed for {option.get('testimonial _id', 'unknown')}: {e}")
                        results.append({
                            "testimonial_id": option.get('testimonial_id', 'unknown'),
                            "audio_url": "",
                            "audio_duration_seconds": 0.0,
                            "voice_provider": "elevenlabs",
                            "quality_score": 0.0,
                            "processed_text": "",
                            "error": str(e)
                        })
        except Exception as e:
            logger.error(f"Batch generation failed: {e}")
            return {"error": str(e)}
        
        finally:
            self.cleanup_temp_files(temp_files)
            self.file_manager.cleanup_all_temp_files()

        return {
            "results": results,
            "temp_files": temp_files
        }
    
    def generate(self, text: str, 
                 voice_id: str = "echo", 
                 language: str = "en", 
                 gender: str = "female", 
                 style: str = "professional", 
                 background_music: Optional[str] = None, 
                 music_volume: str = "low", 
                 preferred_provider: str = "openai", 
                 upload_to_cloud = True, 
                 optimize_speech = False,
                 add_background_music: bool = False,
            ) -> Dict[str, Any]:
        """
        Generate premium narration with multi-provider AI-optimized text processing
        
        Args:
            text: Text to synthesize
            voice_id: Specific voice ID (optional)
            language: Language code
            gender: Voice gender preference
            style: Voice style preference
            preferred_provider: Preferred TTS provider
            
        Returns:
            Dict containing NarrationResponse fields
        """
        temp_files = []
        start_time = datetime.now()
        
        try:
            # Existing validation and processing code remains the same
            text = text.strip()
            if not text:
                return self._create_error_response("Text cannot be empty")
            
            if len(text) > 15000:
                return self._create_error_response("Text too long (max 15,000 characters)")
            
            cache_path = self.generate_narration_cache_key(text, voice_id, gender, style, 
                    preferred_provider, optimize_speech, add_background_music, background_music, music_volume)

            if upload_to_cloud:
                cache_url = self.storage_manager.get_public_url_for_object(cache_path)
                if self.storage_manager.check_url_exists(cache_url):
                    logger.info(f"✅ Using cached intro URL: {cache_path}")
                    return {
                        "audio_url": cache_url,
                        "audio_duration_seconds": self.storage_manager.get_video_duration(cache_url),
                        "voice_provider": "",
                        "quality_score": "",
                        "processed_text": "",
                        "error": ""
                    }

            
            logger.info(f"Generating AI-optimized narration: {len(text)} chars, style={style}, music={background_music}")
            
            if optimize_speech:
                optimization_result = self.text_optimizer.optimize_for_speech(text, style, language)
                optimized_text = optimization_result["optimized_text"]
            else:
                optimized_text = text
                
            logging.info(f"preferred provider: {preferred_provider}\t\t\t\t voiceId: {voice_id}")
            actual_provider, final_voice_id, voice_settings = self.voice_manager.get_optimal_voice_configuration(
                text=optimized_text, 
                voice_id=voice_id, 
                gender=gender, 
                style=style, 
                language=language, 
                preferred_provider=preferred_provider
            )

            from pprint import pformat
            logger.info(f"provider: \t{actual_provider} \t\tvoice_settings: \t{pformat(voice_settings, indent=2)}\t\tvoice id: \t{final_voice_id}\n")
            
            raw_audio_path = self._synthesize_speech(optimized_text, final_voice_id, voice_settings, actual_provider)
            temp_files.append(raw_audio_path)
            
            enhanced_audio_path = self._enhance_audio_professionally(raw_audio_path)
            temp_files.append(enhanced_audio_path)
            
            # NEW STEP 5: Mix with background music if requested
            final_audio_path = enhanced_audio_path
            duration = self._calculate_duration(final_audio_path)

            if add_background_music:
                try:
                    media_info = {"duration": duration, "has_audio": True}
                    mixed_audio_path = self.music_mixer.get_and_mix_music_with_cleanups(
                        enhanced_audio_path, media_info, temp_files, "narration", music_volume, background_music, "audio"
                    )
                    if mixed_audio_path != enhanced_audio_path:
                        temp_files.append(mixed_audio_path)
                        final_audio_path = mixed_audio_path
                        logger.info(f"Successfully mixed narration with background music: {background_music}")
                except Exception as e:
                    logger.warning(f"Music mixing failed, using narration only: {e}")
            
            # Existing steps 6-7 continue with final_audio_path instead of enhanced_audio_path
            
            quality_score = self._calculate_comprehensive_quality_score(final_audio_path, text, optimized_text)
            
            if not upload_to_cloud:
                return {
                    "audio_path": final_audio_path,
                    "temp_files": temp_files
                }


            audio_url = self.storage_manager.upload_file_with_retry(final_audio_path, cache_path)
            if not audio_url:
                return self._create_error_response("Failed to upload audio to storage")
            
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"AI-optimized narration completed: {audio_url}, duration={duration:.2f}s, quality={quality_score:.3f}, processing_time={processing_time:.3f}")
            
            return {
                "audio_url": audio_url,
                "audio_duration_seconds": duration,
                "voice_provider": "elevenlabs",
                "quality_score": quality_score,
                "processed_text": optimized_text,
                "error": ""
            }
            
        except Exception as e:
            logger.error(f"Narration generation failed: {str(e)}")
            return self._create_error_response(str(e))
        
        finally:
            if upload_to_cloud:
                self.cleanup_temp_files(temp_files)

    def generate_narration_cache_key(self, 
            text: str, 
            voice_id: str, 
            gender: str, 
            style: str,
            preferred_provider: str,
            optimize_speech: bool,
            add_background_music: bool,
            background_music: str | None = None,
            music_volume: str | None = "low",
            ):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        NARRATOR_ALGORITHM_VERSION = "v1.0"

        optimize_speech = "1" if optimize_speech else "0"
        add_background_music = "1" if add_background_music else "0"
        background_music = background_music or ""
        
        cache_data = (
            f"{NARRATOR_ALGORITHM_VERSION}|{text[:100]}|{voice_id}|{gender}|{style}|{preferred_provider}"
            f"|{optimize_speech}|{add_background_music}|{background_music}|{music_volume}"
        )
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()
        return f"narration/{cache_hash}.wav"
    
    def _synthesize_speech(self, text: str, voice_id: str, voice_settings: VoiceSettings, provider: str) -> str:
        """Synthesize speech using ElevenLabs with premium quality settings"""
        
        try:
            if provider == "openai":
                return self._synthesize_openai(text, voice_id or "alloy")
            elif provider == "elevenlabs":
                return self._synthesize_elevenlabs(text, voice_id, voice_settings)
            else:
                raise Exception(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Speech synthesis failed with {provider}: {str(e)}")
        

    def _synthesize_openai(self, text: str, voice_id: str) -> str:
        """Synthesize speech using OpenAI TTS"""
        
        try:
            from openai import OpenAI
            
            # Initialize OpenAI client
            openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            
            # Generate audio using OpenAI TTS
            logger.info(f"voice id: {voice_id} \t text: {text}\n")
            response = openai_client.audio.speech.create(
                model="gpt-4o-mini-tts",  # High quality model
                voice=voice_id,
                input=text,
                response_format="mp3"
            )
            
            # Save to temporary file
            # temp_path = os.path.join(tempfile.gettempdir(), f"narration_openai_{uuid.uuid4().hex}.mp3")
            temp_path = self.file_manager.create_temp_file(suffix=".mp3", prefix="narration_openai_")
            
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            
            # Validate generated file
            if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
                raise Exception("Generated audio file is empty or missing")
            
            logger.info(f"OpenAI TTS synthesis successful: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"OpenAI TTS synthesis failed: {str(e)}")
            raise Exception(f"OpenAI speech synthesis failed: {str(e)}")

    def _synthesize_elevenlabs(self, text: str, voice_id: str, voice_settings: VoiceSettings) -> str:
        """Synthesize speech using ElevenLabs with premium quality settings"""
        
        try:
            # Generate audio with highest quality settings
            audio_generator = self.client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",  # Premium model
                voice_settings=voice_settings
            )
            
            # Save to temporary file
            # temp_path = os.path.join(tempfile.gettempdir(), f"narration_elevenlabs_{uuid.uuid4().hex}.mp3")
            temp_path = self.file_manager.create_temp_file(suffix=".mp3", prefix="narration_elevenlabs")
            
            with open(temp_path, 'wb') as f:
                for chunk in audio_generator:
                    f.write(chunk)
            
            # Validate generated file
            if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
                raise Exception("Generated audio file is empty or missing")
            
            logger.info(f"ElevenLabs TTS synthesis successful: {temp_path}")
            return temp_path
            
        except Exception as e:
            logger.error(f"ElevenLabs TTS synthesis failed: {str(e)}")
            raise Exception(f"ElevenLabs speech synthesis failed: {str(e)}")

    
    # def _enhance_audio_professionally(self, input_path: str) -> str:
    #     """Apply professional-grade audio enhancement"""
        
    #     try:
    #         # Load audio at high quality
    #         audio, sr = librosa.load(input_path, sr=44100, mono=True)
            
    #         if len(audio) == 0:
    #             raise Exception("Empty audio loaded")
            
    #         # Apply premium audio processing pipeline
    #         enhanced_audio = self.audio_processor.enhance_narration_audio(audio, sr)
            
    #         # Save with highest quality settings
    #         # output_path = os.path.join(tempfile.gettempdir(), f"narration_enhanced_{uuid.uuid4().hex}.wav")
    #         output_path = self.file_manager.create_temp_audio()
    #         sf.write(output_path, enhanced_audio, sr, subtype='PCM_24')
            
    #         # Validate enhancement
    #         if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
    #             logger.warning("Audio enhancement failed, using original")
    #             return input_path
            
    #         return output_path
            
    #     except Exception as e:
    #         logger.warning(f"Audio enhancement failed: {str(e)}, using original")
    #         return input_path

    def _enhance_audio_professionally(self, input_path: str) -> str:
        """Apply professional-grade audio enhancement"""
        
        try:
            # Load audio at high quality
            audio, sr = librosa.load(input_path, sr=44100, mono=True)
            
            if len(audio) == 0:
                raise Exception("Empty audio loaded")
            
            # Apply premium audio processing pipeline
            enhanced_audio = self.audio_processor.enhance_narration_audio(audio, sr)
            
            # Save with scipy instead of soundfile
            output_path = self.file_manager.create_temp_audio()
            
            # Convert to 16-bit PCM (scipy limitation, but sufficient for narration)
            import numpy as np
            from scipy.io import wavfile
            
            # Normalize and convert to int16
            enhanced_audio_normalized = np.clip(enhanced_audio, -1.0, 1.0)
            enhanced_audio_int16 = (enhanced_audio_normalized * 32767).astype(np.int16)
            
            wavfile.write(output_path, sr, enhanced_audio_int16)
            
            # Validate enhancement
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                logger.warning("Audio enhancement failed, using original")
                return input_path
            
            return output_path
            
        except Exception as e:
            logger.warning(f"Audio enhancement failed: {str(e)}, using original")
            return input_path
    
    def _calculate_duration(self, audio_path: str) -> float:
        """Calculate precise audio duration"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            return len(y) / sr
        except Exception as e:
            logger.warning(f"Duration calculation failed: {e}")
            return 0.0
    
    def _calculate_comprehensive_quality_score(self, audio_path: str, original_text: str, optimized_text: str) -> float:
        """Calculate comprehensive quality score with AI enhancement metrics"""
        try:
            # Get audio quality metrics
            audio_quality = self.audio_processor.analyze_audio_quality_comprehensive(audio_path)
            
            # Text optimization quality
            text_improvement_ratio = len(optimized_text) / len(original_text) if original_text else 1.0
            text_quality_bonus = 0.1 if 0.8 <= text_improvement_ratio <= 1.5 else 0.0
            
            # Combine metrics
            base_quality = audio_quality.get("overall_quality", 0.85)
            final_quality = min(base_quality + text_quality_bonus, 1.0)
            
            return final_quality
            
        except Exception as e:
            logger.warning(f"Quality calculation failed: {e}")
            return 0.85
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            "audio_url": "",
            "audio_duration_seconds": 0.0,
            "voice_provider": "elevenlabs",
            "quality_score": 0.0,
            "processed_text": "",
            "error": error_message
        }
    
    def cleanup_temp_files(self, temp_files: list) -> None:
        """Clean up temporary files efficiently"""
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to cleanup {temp_file}: {e}")