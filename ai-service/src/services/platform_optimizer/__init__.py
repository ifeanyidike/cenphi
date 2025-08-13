# ================================================================
# FILE: src/services/platform_optimizer/__init__.py
# ================================================================
"""
Platform Optimizer Package

Production-grade social media optimization service for testimonial content.
Intelligently optimizes video, audio, and image content for various platforms
with emotional moment detection and smooth transitions.
Your platform_optimizer_app.py imports from .platform_specs.
"""

# Version info
__version__ = "1.0.0"
__author__ = "Testimonial Management Platform"

from .platform_specs import PlatformSpecs
from .media_processor import MediaProcessor

# Import the main app module
from .optimizer import PlatformOptimizer

__all__ = [
    'PlatformSpecs',
    'MediaProcessor',
    'PlatformOptimizer',
]