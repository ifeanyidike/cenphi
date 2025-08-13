# ================================================================
# FILE: src/__init__.py
# ================================================================
"""
AI Service Source Package

Production-grade AI testimonial management platform with Modal deployment.
"""

# Version info
__version__ = "1.0.0"
__author__ = "Testimonial Management Platform"

# Import all modal apps for proper package discovery
from . import services

__all__ = ['services']