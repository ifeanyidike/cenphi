# ================================================================
# FILE: src/services/clip/__init__.py
# ================================================================
"""
Smart Clipping Package

Production-grade intelligent clip generation from long-form media with advanced
moment detection, professional quality optimization, and social media compliance.
Your smart_clipping_app.py imports from .moment_detector and .clip_generator.
"""

# Version info
__version__ = "2.0.0"
__author__ = "Testimonial Management Platform"

# Import the classes that your smart_clipping_app.py needs
from .clip_generator import ClipGenerator

# Import the main app module
from .clipper import SmartClipper

__all__ = [
    'SmartClipper',
    'ClipGenerator',
]