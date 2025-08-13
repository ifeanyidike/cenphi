# ================================================================
# FILE: src/services/__init__.py
# ================================================================
"""
Modal Apps Package

Production-grade Modal applications for AI testimonial management platform.
Import all submodules to ensure they're discovered by Modal.
"""

# Version info
__version__ = "1.0.0"
__author__ = "Testimonial Management Platform"

from . import emotions
from . import enhancement
from . import narration
from . import clip
from . import platform_optimizer

__all__ = [ 
    'emotions',
    'enhancement',
    'narration',
    'clip',
    'platform_optimizer'
]