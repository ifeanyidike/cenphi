# ================================================================
# FILE: src/services/enhancement/__init__.py
# ================================================================
"""
Media Enhancement Package

Production-grade media enhancement for images, audio, and video.
"""

# Version info
__version__ = "2.0.0"
__author__ = "Testimonial Management Platform"

# Import enhancement modules to ensure package discovery
from .enhancer import MediaEnhancer
from .video_enhancer import VideoEnhancer

__all__ = [
    'MediaEnhancer', 'AudioEnhancer', 'VideoEnhancer', 'ImageEnhancer'
]