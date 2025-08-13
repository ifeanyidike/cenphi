# ================================================================
# FILE: src/services/narration/__init__.py
# ================================================================
"""
Testimonial Narration Package

Production-grade text-to-speech narration service for testimonials with advanced
text processing, multiple TTS providers, and professional audio post-processing.
"""

# Version info
__version__ = "2.0.0"
__author__ = "Testimonial Management Platform"

# Import processing modules to ensure package discovery
from .text_optimizer import TextOptimizer
from .voice_manager import VoiceManager
from .audio_processor import AudioProcessor 
from .narrator import NarrationGenerator

__all__ = [
    'TextOptimizer',
    'VoiceManager', 
    'AudioProcessor',
    'NarrationGenerator'
]