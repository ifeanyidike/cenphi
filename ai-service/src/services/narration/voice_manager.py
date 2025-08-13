# src/services/narration/voice_manager.py
import logging
import os
from typing import Dict, Tuple, Optional, Any, List
from elevenlabs import ElevenLabs, VoiceSettings
import threading
import time
from openai import OpenAI
from src.ai_providers.client import ai_client

logger = logging.getLogger(__name__)

class VoiceManager:
    """Multi-provider AI-powered voice management with intelligent selection and optimization"""
    
    def __init__(self, api_key: str = None, openai_api_key: str = None, provider_priority: List[str] = None):
        """
        Initialize voice manager with multiple providers
        
        Args:
            api_key: ElevenLabs API key
            openai_api_key: OpenAI API key
            provider_priority: List of providers in order of preference ['openai', 'elevenlabs', 'claude']
        """
        # Provider priority configuration
        self.provider_priority = provider_priority or ['openai', 'elevenlabs']
        
        # Initialize providers
        self.providers = {}
        self._initialize_providers(api_key, openai_api_key)
        
        # Cache management
        self._voice_cache = {}
        self._cache_lock = threading.Lock()
        self._cache_expiry = 3600  # 1 hour
        self._last_cache_update = 0
        
        # Voice mappings for all providers
        self._voice_profiles = self._initialize_voice_profiles()
        
        # Voice optimization profiles
        self._voice_optimization_profiles = {
            "professional": {
                "stability": 0.85,
                "similarity_boost": 0.90,
                "style": 0.0,
                "openai_voice_style": "professional"
            },
            "conversational": {
                "stability": 0.80,
                "similarity_boost": 0.85,
                "style": 0.20,
                "openai_voice_style": "conversational"
            },
            "energetic": {
                "stability": 0.75,
                "similarity_boost": 0.85,
                "style": 0.40,
                "openai_voice_style": "energetic"
            },
            "authoritative": {
                "stability": 0.90,
                "similarity_boost": 0.92,
                "style": 0.10,
                "openai_voice_style": "authoritative"
            },
            "calm": {
                "stability": 0.95,
                "similarity_boost": 0.80,
                "style": -0.15,
                "openai_voice_style": "calm"
            },
            "warm": {
                "stability": 0.82,
                "similarity_boost": 0.88,
                "style": 0.25,
                "openai_voice_style": "warm"
            }
        }
        
        logger.info(f"VoiceManager initialized with providers: {list(self.providers.keys())}")
    
    def _initialize_providers(self, elevenlabs_key: str, openai_key: str):
        """Initialize available TTS providers"""
        
        # Initialize OpenAI TTS
        openai_key = openai_key or os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                self.providers['openai'] = OpenAI(api_key=openai_key)
                logger.info("OpenAI TTS provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI TTS: {e}")
        
        # Initialize ElevenLabs
        elevenlabs_key = elevenlabs_key or os.environ.get("ELEVENLABS_API_KEY")
        if elevenlabs_key:
            try:
                self.providers['elevenlabs'] = ElevenLabs(api_key=elevenlabs_key)
                logger.info("ElevenLabs TTS provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize ElevenLabs TTS: {e}")
    
    def _initialize_voice_profiles(self) -> Dict[str, Dict]:
        """Initialize comprehensive voice profiles for all providers"""
        
        return {
            # OpenAI Voices
            "openai_alloy": {
                "provider": "openai",
                "voice_id": "alloy",
                "characteristics": ["neutral", "balanced", "clear", "versatile"],
                "optimal_for": ["general", "educational", "balanced"],
                "voice_type": "neutral",
                "quality": "standard"
            },
            "openai_echo": {
                "provider": "openai",
                "voice_id": "echo",
                "characteristics": ["male", "professional", "clear", "authoritative"],
                "optimal_for": ["business", "professional", "presentations"],
                "voice_type": "male",
                "quality": "standard"
            },
            "openai_fable": {
                "provider": "openai",
                "voice_id": "fable",
                "characteristics": ["expressive", "dynamic", "engaging", "storytelling"],
                "optimal_for": ["stories", "creative", "entertainment"],
                "voice_type": "neutral",
                "quality": "standard"
            },
            "openai_onyx": {
                "provider": "openai",
                "voice_id": "onyx",
                "characteristics": ["male", "deep", "strong", "authoritative", "serious"],
                "optimal_for": ["authoritative", "corporate", "leadership"],
                "voice_type": "male",
                "quality": "standard"
            },
            "openai_nova": {
                "provider": "openai",
                "voice_id": "nova",
                "characteristics": ["female", "professional", "clear", "trustworthy", "warm"],
                "optimal_for": ["professional", "business", "presentations"],
                "voice_type": "female",
                "quality": "standard"
            },
            "openai_shimmer": {
                "provider": "openai",
                "voice_id": "shimmer",
                "characteristics": ["female", "energetic", "bright", "enthusiastic", "youthful"],
                "optimal_for": ["marketing", "promotional", "announcements"],
                "voice_type": "female",
                "quality": "standard"
            },

            # Added for gpt-4o-mini-tts
            "openai_coral": {
                "provider": "openai",
                "voice_id": "coral",
                "characteristics": ["female", "warm", "friendly", "approachable"],
                "optimal_for": ["customer support", "tutorials", "onboarding"],
                "voice_type": "female",
                "quality": "standard"
            },
            "openai_ash": {
                "provider": "openai",
                "voice_id": "ash",
                "characteristics": ["male", "calm", "soothing", "meditative"],
                "optimal_for": ["meditation", "storytelling", "narration"],
                "voice_type": "male",
                "quality": "standard"
            },
            
            # ElevenLabs Voices
            "elevenlabs_rachel": {
                "provider": "elevenlabs",
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "characteristics": ["professional", "authoritative", "clear", "corporate", "trustworthy"],
                "optimal_for": ["business", "educational", "formal", "presentations"],
                "voice_type": "female",
                "quality": "premium"
            },
            "elevenlabs_domi": {
                "provider": "elevenlabs",
                "voice_id": "AZnzlk1XvdvUeBnXmlld", 
                "characteristics": ["warm", "personable", "friendly", "conversational", "engaging"],
                "optimal_for": ["testimonials", "personal", "casual", "storytelling"],
                "voice_type": "female",
                "quality": "premium"
            },
            "elevenlabs_bella": {
                "provider": "elevenlabs",
                "voice_id": "EXAVITQu4vr4xnSDxMaL",
                "characteristics": ["energetic", "enthusiastic", "dynamic", "youthful", "expressive"],
                "optimal_for": ["marketing", "promotional", "excited", "energetic"],
                "voice_type": "female",
                "quality": "premium"
            },
            "elevenlabs_grace": {
                "provider": "elevenlabs",
                "voice_id": "oWAxZDx7w5VEj9dCyTzz",
                "characteristics": ["calm", "soothing", "gentle", "meditative", "peaceful"],
                "optimal_for": ["relaxation", "calm", "meditation", "gentle"],
                "voice_type": "female",
                "quality": "premium"
            },
            "elevenlabs_arnold": {
                "provider": "elevenlabs",
                "voice_id": "VR6AewLTigWG4xSOukaG",
                "characteristics": ["professional", "deep", "authoritative", "commanding", "serious"],
                "optimal_for": ["business", "corporate", "authoritative", "serious"],
                "voice_type": "male",
                "quality": "premium"
            },
            "elevenlabs_daniel": {
                "provider": "elevenlabs",
                "voice_id": "onwK4e9ZLuTAKqWW03F9",
                "characteristics": ["conversational", "warm", "friendly", "approachable", "natural"],
                "optimal_for": ["conversational", "testimonials", "friendly", "approachable"],
                "voice_type": "male",
                "quality": "premium"
            },
            "elevenlabs_callum": {
                "provider": "elevenlabs",
                "voice_id": "5Q0t7uMcjvnagumLfvZi",
                "characteristics": ["dynamic", "energetic", "engaging", "youthful", "vibrant"],
                "optimal_for": ["energetic", "marketing", "dynamic", "promotional"],
                "voice_type": "male",
                "quality": "premium"
            },
            "elevenlabs_josh": {
                "provider": "elevenlabs",
                "voice_id": "TxGEqnHWrfWFTfGW9XjX",
                "characteristics": ["authoritative", "commanding", "strong", "confident", "leadership"],
                "optimal_for": ["leadership", "authoritative", "confident", "strong"],
                "voice_type": "male",
                "quality": "premium"
            }
        }
    
    def prioritize(self, preferred_provider: Optional[str] = "openai") -> List[str]:
        # Determine provider priority
        priority = self.provider_priority.copy()
        if preferred_provider and preferred_provider in self.providers:
            # Move preferred provider to front
            if preferred_provider in priority:
                priority.remove(preferred_provider)
            priority.insert(0, preferred_provider)

        return priority
    
    def get_optimal_voice_configuration(
        self, 
        text: str,
        voice_id: Optional[str], 
        gender: str, 
        style: str, 
        language: str = "en",
        preferred_provider: Optional[str] = "openai"
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        AI-powered optimal voice configuration across all providers
        
        Returns:
            Tuple of (provider, voice_id, voice_settings)
        """

        logger.info(f"voice_id: {voice_id}\t\t provider: {preferred_provider}")

        priority = self.prioritize(preferred_provider)
        
        # Step 1: AI-powered voice selection
        if not voice_id:
            provider, voice_id = self._ai_select_optimal_voice_across_providers(
                text, gender, style, language, priority
            )
        else:
            # Find provider for given voice_id
            provider = self._find_provider_for_voice(voice_id)
            if not provider:
                logger.warning(f"Voice ID '{voice_id}' not found, using AI selection")
                provider, voice_id = self._ai_select_optimal_voice_across_providers(
                    text, gender, style, language, priority
                )
        
        # Step 2: Generate provider-specific settings
        voice_settings = self._generate_provider_settings(text, provider, voice_id, style)
        
        logger.info(f"Selected voice: {provider}:{voice_id}")
        
        return provider, voice_id, voice_settings
    
    def _ai_select_optimal_voice_across_providers(
        self, 
        text: str, 
        gender: str, 
        style: str, 
        language: str,
        provider_priority: List[str]
    ) -> Tuple[str, str]:
        """Use AI to select optimal voice across all providers"""
        
        try:
            # Filter available voices by provider priority and gender
            available_voices = []
            for provider in provider_priority:
                if provider not in self.providers:
                    continue
                    
                provider_voices = [
                    (name, data) for name, data in self._voice_profiles.items()
                    if (data["provider"] == provider and 
                        (data["voice_type"] == gender.lower() or 
                         data["voice_type"] == "neutral" or 
                         gender.lower() == "any"))
                ]
                available_voices.extend(provider_voices)
            
            if not available_voices:
                # Fallback to any available voice
                available_voices = list(self._voice_profiles.items())
            
            # Create voice descriptions for AI
            voice_descriptions = []
            for name, voice_data in available_voices:
                characteristics = ", ".join(voice_data["characteristics"])
                optimal_for = ", ".join(voice_data["optimal_for"])
                provider = voice_data["provider"]
                quality = voice_data.get("quality", "standard")
                
                voice_descriptions.append(
                    f"{name} ({provider}, {quality}): {characteristics} (optimal for: {optimal_for})"
                )
            
            voice_options = "\n".join(voice_descriptions)
            analysis_text = text[:1000] + "..." if len(text) > 1000 else text
            
            selection_prompt = f"""
Analyze this text content and select the most suitable voice for narration across multiple TTS providers.

Text to analyze:
"{analysis_text}"

Requested style: {style}
Requested gender: {gender}
Provider priority: {', '.join(provider_priority)}

Available voices:
{voice_options}

Consider:
1. Content formality and tone
2. Target audience appeal  
3. Provider quality (premium > standard)
4. Voice characteristics matching content style
5. Provider priority order

Respond with only the voice name from the list above (e.g., "openai_nova", "elevenlabs_rachel"), nothing else:"""

            response = ai_client.chat_completion(
                messages=[{"role": "user", "content": selection_prompt}],
                model="gpt-4.1-nano",
                temperature=0.3,
                max_tokens=50
            )
            
            selected_voice_name = response.content.strip()
            
            # Validate AI selection
            if selected_voice_name in self._voice_profiles:
                voice_data = self._voice_profiles[selected_voice_name]
                provider = voice_data["provider"]
                voice_id = voice_data["voice_id"]
                
                # Ensure provider is available
                if provider in self.providers:
                    logger.info(f"AI selected voice: {selected_voice_name} ({provider})")
                    return provider, voice_id
            
            logger.warning(f"AI selection '{selected_voice_name}' invalid, using fallback")
            return self._fallback_voice_selection_cross_provider(gender, style, provider_priority)
                
        except Exception as e:
            logger.warning(f"AI voice selection failed: {e}, using fallback")
            return self._fallback_voice_selection_cross_provider(gender, style, provider_priority)
    
    def _fallback_voice_selection_cross_provider(
        self, 
        gender: str, 
        style: str, 
        provider_priority: List[str]
    ) -> Tuple[str, str]:
        """Fallback voice selection across providers"""
        
        gender_clean = gender.lower()
        style_clean = style.lower()
        
        # Define fallback mapping priorities
        fallback_preferences = []
        
        if "professional" in style_clean or "business" in style_clean:
            if gender_clean == "female":
                fallback_preferences = [
                    ("openai", "nova"), ("elevenlabs", "21m00Tcm4TlvDq8ikWAM"),
                    ("openai", "alloy")
                ]
            else:
                fallback_preferences = [
                    ("openai", "echo"), ("elevenlabs", "VR6AewLTigWG4xSOukaG"),
                    ("openai", "onyx")
                ]
        elif "energetic" in style_clean or "dynamic" in style_clean:
            if gender_clean == "female":
                fallback_preferences = [
                    ("openai", "shimmer"), ("elevenlabs", "EXAVITQu4vr4xnSDxMaL"),
                    ("openai", "fable")
                ]
            else:
                fallback_preferences = [
                    ("openai", "fable"), ("elevenlabs", "5Q0t7uMcjvnagumLfvZi"),
                    ("openai", "echo")
                ]
        else:
            # Default conversational
            if gender_clean == "female":
                fallback_preferences = [
                    ("openai", "nova"), ("elevenlabs", "AZnzlk1XvdvUeBnXmlld"),
                    ("openai", "alloy")
                ]
            else:
                fallback_preferences = [
                    ("openai", "echo"), ("elevenlabs", "onwK4e9ZLuTAKqWW03F9"),
                    ("openai", "alloy")
                ]
        
        # Try preferences in provider priority order
        for provider in provider_priority:
            for pref_provider, voice_id in fallback_preferences:
                if pref_provider == provider and provider in self.providers:
                    return provider, voice_id
        
        # Ultimate fallback
        for provider in provider_priority:
            if provider in self.providers:
                if provider == "openai":
                    return "openai", "alloy"
                elif provider == "elevenlabs":
                    return "elevenlabs", "21m00Tcm4TlvDq8ikWAM"
        
        raise Exception("No TTS providers available")
    
    def _find_provider_for_voice(self, voice_id: str) -> Optional[str]:
        """Find which provider has the given voice ID"""
        for voice_data in self._voice_profiles.values():
            if voice_data["voice_id"] == voice_id:
                return voice_data["provider"]
        return None
    
    def _generate_provider_settings(
        self, 
        text: str, 
        provider: str, 
        voice_id: str, 
        style: str
    ) -> Dict[str, Any]:
        """Generate provider-specific voice settings"""
        
        base_profile = self._get_base_optimization_profile(style)
        
        if provider == "openai":
            return self._generate_openai_settings(text, voice_id, base_profile)
        elif provider == "elevenlabs":
            return self._generate_elevenlabs_settings(text, voice_id, base_profile)
        else:
            return {}
    
    def _generate_openai_settings(
        self, 
        text: str, 
        voice_id: str, 
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate OpenAI TTS settings"""
        return {
            "model": "gpt-4o-mini-tts",  # High quality model
            "voice": voice_id,
            "response_format": "mp3",
            "speed": 1.0  # Normal speed, could be adjusted based on content
        }
    
    def _generate_elevenlabs_settings(
        self, 
        text: str, 
        voice_id: str, 
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate ElevenLabs settings (existing logic)"""
        try:
            # AI optimization for ElevenLabs (simplified version of existing logic)
            analysis_text = text[:800] + "..." if len(text) > 800 else text
            
            optimization_prompt = f"""
Optimize ElevenLabs voice settings for this content:

Text: "{analysis_text}"
Base profile: {profile}

Provide micro-adjustments:
Respond in format: stability_adj=X.XX, similarity_adj=X.XX, style_adj=X.XX"""

            response = ai_client.chat_completion(
                messages=[{"role": "user", "content": optimization_prompt}],
                model="gpt-4.1-nano",
                temperature=0.2,
                max_tokens=100
            )
            
            adjustments = self._parse_voice_adjustments(response.content)
            
            return VoiceSettings(
                stability=max(0.1, min(1.0, profile["stability"] + adjustments.get("stability", 0.0))),
                similarity_boost=max(0.1, min(1.0, profile["similarity_boost"] + adjustments.get("similarity", 0.0))),
                style=max(-1.0, min(1.0, profile["style"] + adjustments.get("style", 0.0))),
                use_speaker_boost=True
            )
            
        except Exception as e:
            logger.warning(f"ElevenLabs optimization failed: {e}")
            return VoiceSettings(
                stability=profile["stability"],
                similarity_boost=profile["similarity_boost"],
                style=profile["style"],
                use_speaker_boost=True
            )
    
    def _get_base_optimization_profile(self, style: str) -> Dict[str, Any]:
        """Get base optimization profile for style"""
        style_clean = style.lower()
        
        # Map unknown styles
        style_mapping = {
            "business": "professional",
            "corporate": "professional", 
            "casual": "conversational",
            "friendly": "warm",
            "excited": "energetic",
            "dynamic": "energetic",
            "serious": "authoritative",
            "gentle": "calm",
            "soothing": "calm"
        }
        
        mapped_style = style_mapping.get(style_clean, style_clean)
        return self._voice_optimization_profiles.get(mapped_style, self._voice_optimization_profiles["professional"])
    
    def _parse_voice_adjustments(self, ai_response: str) -> Dict[str, float]:
        """Parse AI response for voice setting adjustments"""
        import re
        
        adjustments = {}
        
        stability_match = re.search(r'stability_adj=([+-]?\d*\.?\d+)', ai_response)
        similarity_match = re.search(r'similarity_adj=([+-]?\d*\.?\d+)', ai_response)
        style_match = re.search(r'style_adj=([+-]?\d*\.?\d+)', ai_response)
        
        if stability_match:
            adjustments["stability"] = float(stability_match.group(1))
        if similarity_match:
            adjustments["similarity"] = float(similarity_match.group(1))
        if style_match:
            adjustments["style"] = float(style_match.group(1))
        
        return adjustments
    
    def get_available_providers(self) -> List[str]:
        """Get list of available TTS providers"""
        return list(self.providers.keys())
    
    def get_voices_for_provider(self, provider: str) -> List[Dict[str, Any]]:
        """Get available voices for a specific provider"""
        return [
            {
                "name": name,
                "voice_id": data["voice_id"],
                "characteristics": data["characteristics"],
                "voice_type": data["voice_type"],
                "quality": data.get("quality", "standard")
            }
            for name, data in self._voice_profiles.items()
            if data["provider"] == provider
        ]
    
    def set_provider_priority(self, new_priority: List[str]):
        """Update provider priority order"""
        # Validate all providers exist
        valid_providers = [p for p in new_priority if p in self.providers]
        if valid_providers:
            self.provider_priority = valid_providers
            logger.info(f"Provider priority updated to: {self.provider_priority}")
        else:
            logger.warning("No valid providers in new priority list")
    
    def analyze_content_for_voice_recommendation(self, text: str) -> Dict[str, Any]:
        """Analyze content and provide voice recommendations with reasoning"""
        
        try:
            analysis_prompt = f"""
Analyze this text content for voice narration recommendations:

Text: "{text[:1000]}{'...' if len(text) > 1000 else ''}"

Provide analysis for:
1. Formality level (1-10, where 1=very casual, 10=very formal)
2. Energy level (1-10, where 1=very calm, 10=very energetic)
3. Emotional tone (neutral, warm, authoritative, enthusiastic, calm, serious)
4. Target audience (general, business, personal, educational, marketing)
5. Content complexity (simple, moderate, complex)

Respond in JSON format:
{{
  "formality": number,
  "energy": number, 
  "emotional_tone": "string",
  "target_audience": "string",
  "complexity": "string",
  "reasoning": "explanation of analysis"
}}"""

            response = ai_client.chat_completion(
                messages=[{"role": "user", "content": analysis_prompt}],
                model="gpt-4.1-nano",
                temperature=0.2,
                max_tokens=300
            )
            
            import json
            analysis = json.loads(response.content)
            
            # Add voice recommendations based on analysis
            analysis["recommended_voices"] = self._get_voice_recommendations_from_analysis(analysis)
            
            return analysis
            
        except Exception as e:
            logger.warning(f"Content analysis failed: {e}")
            return {
                "formality": 5,
                "energy": 5,
                "emotional_tone": "neutral",
                "target_audience": "general",
                "complexity": "moderate",
                "reasoning": "Analysis unavailable, using defaults",
                "recommended_voices": []
            }
    
    def _get_voice_recommendations_from_analysis(self, analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get voice recommendations based on content analysis"""
        
        recommendations = []
        
        formality = analysis.get("formality", 5)
        energy = analysis.get("energy", 5)
        tone = analysis.get("emotional_tone", "neutral")
        
        # Score each voice based on analysis
        for name, voice_data in self._voice_profiles.items():
            score = 0
            
            # Formality scoring
            if formality >= 7 and "professional" in voice_data["characteristics"]:
                score += 2
            elif formality <= 4 and "conversational" in voice_data["characteristics"]:
                score += 2
            
            # Energy scoring
            if energy >= 7 and "energetic" in voice_data["characteristics"]:
                score += 2
            elif energy <= 4 and "calm" in voice_data["characteristics"]:
                score += 2
            
            # Tone matching
            if tone in voice_data["characteristics"]:
                score += 3
            
            # Provider quality bonus
            if voice_data.get("quality") == "premium":
                score += 1
            
            if score > 0:
                recommendations.append({
                    "voice_name": name,
                    "voice_id": voice_data["voice_id"],
                    "provider": voice_data["provider"],
                    "score": score,
                    "reasons": voice_data["characteristics"],
                    "quality": voice_data.get("quality", "standard")
                })
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:5]  # Top 5 recommendations
    
    def _validate_voice_id(self, voice_id: str) -> bool:
        """Validate voice ID across all providers"""
        try:
            # Check in our voice profiles first
            for voice_data in self._voice_profiles.values():
                if voice_data["voice_id"] == voice_id:
                    provider = voice_data["provider"]
                    if provider in self.providers:
                        return True
            
            # For ElevenLabs, check live API if available
            if "elevenlabs" in self.providers:
                with self._cache_lock:
                    current_time = time.time()
                    
                    if current_time - self._last_cache_update > self._cache_expiry:
                        self._refresh_voice_cache()
                    
                    return voice_id in self._voice_cache
            
            return False
                
        except Exception as e:
            logger.warning(f"Voice validation failed for {voice_id}: {e}")
            return False
    
    def _refresh_voice_cache(self) -> None:
        """Refresh voice cache from ElevenLabs API"""
        try:
            if "elevenlabs" not in self.providers:
                return
                
            voices = self.providers["elevenlabs"].voices.get_all()
            
            new_cache = {}
            for voice in voices.voices:
                new_cache[voice.voice_id] = {
                    "name": voice.name,
                    "category": getattr(voice, 'category', 'general')
                }
            
            self._voice_cache = new_cache
            self._last_cache_update = time.time()
            
            logger.info(f"ElevenLabs voice cache refreshed with {len(self._voice_cache)} voices")
            
        except Exception as e:
            logger.error(f"Failed to refresh ElevenLabs voice cache: {e}")
    
    def get_voice_by_characteristics(self, characteristics: List[str], provider: str = None) -> List[Dict[str, Any]]:
        """Get voices matching specific characteristics"""
        matching_voices = []
        
        for name, voice_data in self._voice_profiles.items():
            if provider and voice_data["provider"] != provider:
                continue
                
            # Check if any characteristics match
            voice_chars = voice_data["characteristics"]
            matches = sum(1 for char in characteristics if char.lower() in [c.lower() for c in voice_chars])
            
            if matches > 0:
                matching_voices.append({
                    "name": name,
                    "voice_id": voice_data["voice_id"],
                    "provider": voice_data["provider"],
                    "match_score": matches / len(characteristics),
                    "characteristics": voice_chars,
                    "voice_type": voice_data["voice_type"],
                    "quality": voice_data.get("quality", "standard")
                })
        
        # Sort by match score
        matching_voices.sort(key=lambda x: x["match_score"], reverse=True)
        return matching_voices
    
    def get_random_voice(self, provider: str = None, voice_type: str = None) -> Dict[str, Any]:
        """Get a random voice, optionally filtered by provider and type"""
        import random
        
        available_voices = []
        for name, voice_data in self._voice_profiles.items():
            if provider and voice_data["provider"] != provider:
                continue
            if voice_type and voice_data["voice_type"] != voice_type:
                continue
            if voice_data["provider"] not in self.providers:
                continue
                
            available_voices.append((name, voice_data))
        
        if not available_voices:
            return {}
        
        name, voice_data = random.choice(available_voices)
        return {
            "name": name,
            "voice_id": voice_data["voice_id"],
            "provider": voice_data["provider"],
            "characteristics": voice_data["characteristics"],
            "voice_type": voice_data["voice_type"],
            "quality": voice_data.get("quality", "standard")
        }