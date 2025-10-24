#!/usr/bin/env python3
"""
Comprehensive test suite for FFmpeg intro/outro text escaping.

Tests all edge cases and malicious inputs to ensure fail-proof operation.
"""

import sys
import subprocess
import tempfile
import os
from dataclasses import dataclass
from typing import Optional, List

# Test cases covering all edge cases and attack vectors
TEST_CASES = [
    # Basic cases
    ("Simple text", "Welcome to our platform"),
    ("With apostrophe", "Here's what our customers say"),
    ("Multiple apostrophes", "We're here, it's great, they're happy"),

    # Special characters
    ("Brackets", "Check [our website] today!"),
    ("Multiple brackets", "[Special] offer [Limited time]"),
    ("Equals sign", "Price = $100"),
    ("Semicolon", "Welcome; Click here"),
    ("Comma", "Hello, welcome to our service"),
    ("At sign", "Email us at info@company.com"),
    ("Percent", "Get 50% off today!"),
    ("Colon", "Time: 10:00 AM"),

    # Complex combinations
    ("All special chars", "Welcome; Price = $100 [Best!] @ 50% off, it's amazing!"),
    ("Math expression", "x = y + z : result @ 100%"),
    ("Filter-like text", "[text0]drawtext=x:y;[v]"),

    # Control characters
    ("Newlines", "Line1\nLine2\nLine3"),
    ("Tabs", "Col1\tCol2\tCol3"),
    ("Mixed whitespace", "Text  with\t\nmixed   whitespace"),
    ("Carriage return", "Old\rNew"),

    # Length tests
    ("Very long", "Lorem ipsum dolor sit amet " * 50),  # ~1350 chars
    ("Exactly 500 chars", "X" * 500),
    ("Just over 500", "X" * 501),

    # Empty/whitespace
    ("Empty string", ""),
    ("Only spaces", "     "),
    ("Only newlines", "\n\n\n"),
    ("Only tabs", "\t\t\t"),

    # Unicode and emoji
    ("Emoji", "Hello 👋 Welcome 🎉"),
    ("Unicode", "Café résumé naïve"),
    ("Mixed unicode", "Welcome! 你好 مرحبا"),

    # Backslash attacks
    ("Single backslash", "Path\\to\\file"),
    ("Multiple backslashes", "C:\\\\Users\\\\Documents\\\\"),
    ("Mixed backslash", "Text\\with:mixed\\characters"),

    # Quote variations
    ("Double quotes", 'She said "hello"'),
    ("Mixed quotes", "It's a \"great\" day"),
    ("Backticks", "Use `code` here"),

    # URL and email
    ("URL", "Visit https://example.com:8080/path?key=value"),
    ("Email with special", "contact+info@company-name.com"),

    # Potential injection attempts
    ("FFmpeg injection 1", "text';[0:v]scale=100:100;#"),
    ("FFmpeg injection 2", "[v];drawtext=text='injected"),
    ("FFmpeg injection 3", "normal';crop=10:10;'text"),
    ("Command injection", "text;rm -rf /;#"),
    ("Shell escape", "text$(whoami)"),

    # Edge whitespace
    ("Leading spaces", "    Welcome"),
    ("Trailing spaces", "Welcome    "),
    ("Both", "   Welcome   "),

    # Number formats
    ("Scientific notation", "Speed: 3.14e8 m/s"),
    ("Negative numbers", "Temperature: -40°C"),
    ("Fractions", "Rate: 3/4 or 75%"),

    # Edge case: very short duration (will be tested separately)
    ("Short duration test", "Welcome"),
]

# Additional test cases for duration edge cases
DURATION_TEST_CASES = [
    ("Very short intro", "Hello", 0.5, False),
    ("Very short outro", "Goodbye", 0.5, True),
    ("Minimal intro", "Hi", 0.1, False),
    ("Minimal outro", "Bye", 0.1, True),
    ("Normal intro", "Welcome", 5.0, False),
    ("Normal outro", "Thank you", 5.0, True),
]


@dataclass
class IntroOutroConfig:
    """Minimal config for testing"""
    text_overlay: Optional[str]
    brand_name: Optional[str] = "TestBrand"
    primary_color: str = "#0f172a"
    secondary_color: str = "#f8fafc"


def escape_for_drawtext(text: str) -> str:
    """
    Production-grade FFmpeg drawtext escaping.
    Copied from intro_outro_generator.py
    """
    # Step 1: Escape backslashes FIRST
    text = text.replace("\\", "\\\\")

    # Step 2: Escape FFmpeg-specific characters
    text = text.replace(":", "\\:")
    text = text.replace("%", "\\%")
    text = text.replace("[", "\\[")
    text = text.replace("]", "\\]")
    text = text.replace("=", "\\=")
    text = text.replace(";", "\\;")
    text = text.replace(",", "\\,")
    text = text.replace("@", "\\@")

    # Step 3: Escape apostrophes LAST
    text = text.replace("'", "'\\''")

    return text


def sanitize_text(text: str, job_id: str = "test") -> str:
    """
    Sanitize and validate user input.
    Copied from intro_outro_generator.py
    """
    import re

    original_text = text
    text = text.strip()

    # Reject empty or whitespace-only text
    if not text:
        print(f"  ⚠️  Empty text, using fallback")
        text = "Welcome"

    # Limit text length
    MAX_TEXT_LENGTH = 500
    if len(text) > MAX_TEXT_LENGTH:
        print(f"  ⚠️  Text too long ({len(text)} chars), truncating to {MAX_TEXT_LENGTH}")
        text = text[:MAX_TEXT_LENGTH].rsplit(' ', 1)[0] + "..."

    # Remove control characters and normalize whitespace
    text = re.sub(r'[\n\r\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = ''.join(char for char in text if ord(char) >= 32 or char == ' ')

    return text


def generate_test_filter(text: str, width: int = 1920, height: int = 1080, duration: float = 5.0, is_outro: bool = False) -> str:
    """
    Generate FFmpeg filter complex for testing.
    Simplified version of _create_professional_visual.
    """
    # Sanitize text
    text = sanitize_text(text)

    # Split into lines (max 50 chars per line)
    words = text.split()
    lines = []
    current_line = []
    current_length = 0

    for word in words:
        if current_length + len(word) + 1 > 50 and current_line:
            lines.append(' '.join(current_line))
            current_line = [word]
            current_length = len(word)
        else:
            current_line.append(word)
            current_length += len(word) + 1

    if current_line:
        lines.append(' '.join(current_line))

    # Escape lines
    escaped_lines = [escape_for_drawtext(line) for line in lines]

    # Final validation
    if not escaped_lines:
        print(f"  ⚠️  No lines after escaping, using fallback")
        escaped_lines = [escape_for_drawtext("Welcome")]

    # Build filter
    filter_parts = []
    current_label = "[0:v]"
    text_color = "f8fafc"
    title_font_size = int(height * 0.055)
    line_spacing = int(height * 0.07)
    num_lines = len(escaped_lines)
    total_text_height = num_lines * line_spacing
    start_y = f"(h-{total_text_height})/2"

    # Use a known font file path
    font_file = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    for i, line in enumerate(escaped_lines):
        y_pos = f"{start_y}+{i*line_spacing}"
        separator = ";" if i > 0 else ""

        filter_parts.append(
            f"{separator}{current_label}drawtext=text='{line}':"
            f"fontcolor=0x{text_color}:"
            f"fontsize={title_font_size}:"
            f"x=(w-text_w)/2:"
            f"y={y_pos}:"
            f"fontfile='{font_file}':"
            f"shadowcolor=0x000000@0.85:"
            f"shadowx=4:shadowy=4:"
            f"line_spacing={int(line_spacing*0.3)}[text{i}]"
        )
        current_label = f"[text{i}]"

    # Add zoom and fade with proper duration handling
    # CRITICAL: Ensure fade parameters are valid for ANY duration (even very short)
    if is_outro:
        # Outro: fade out gracefully
        fade_duration = min(1.0, duration * 0.5)  # Max 50% of duration
        fade_start = max(0, duration - fade_duration)
        fade_effect = f"fade=t=out:st={fade_start:.3f}:d={fade_duration:.3f}"
        zoom_expr = f"1+0.03*min(t/{duration},1)"
    else:
        # Intro: fade in smoothly
        fade_duration = min(1.0, duration * 0.5)  # Max 50% of duration
        fade_effect = f"fade=t=in:st=0:d={fade_duration:.3f}"
        zoom_expr = f"1.03-0.03*min(t/{duration},1)"

    # NOTE: Use named parameters with single quotes for scale expressions
    # This allows commas in min() function without conflicting with filter chain separators
    filter_parts.append(
        f";{current_label}scale=w='iw*{zoom_expr}':h='ih*{zoom_expr}':eval=frame,"
        f"crop={width}:{height},"
        f"{fade_effect}[v]"
    )

    return "".join(filter_parts)


def test_ffmpeg_filter(filter_complex: str) -> tuple[bool, str]:
    """
    Test if FFmpeg can parse the filter.
    Returns (success, error_message)
    """
    # Create a minimal FFmpeg command to test filter parsing
    cmd = [
        "ffmpeg",
        "-f", "lavfi",
        "-i", "color=c=0x0f172a:s=1920x1080:r=30:d=1",
        "-f", "lavfi",
        "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "1:a",
        "-t", "0.1",  # Only 0.1 seconds for fast testing
        "-f", "null",  # Don't actually write output
        "-"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            return (True, "")
        else:
            # Extract just the relevant error
            stderr = result.stderr
            error_lines = [
                line for line in stderr.split('\n')
                if 'error' in line.lower() or 'invalid' in line.lower() or 'failed' in line.lower()
            ]
            return (False, '\n'.join(error_lines[:3]))  # First 3 error lines
    except subprocess.TimeoutExpired:
        return (False, "Timeout - FFmpeg took too long")
    except Exception as e:
        return (False, f"Exception: {str(e)}")


def run_tests():
    """Run all test cases"""
    print("=" * 80)
    print("FFmpeg Intro/Outro Text Escaping - Comprehensive Test Suite")
    print("=" * 80)
    print()

    passed = 0
    failed = 0
    results = []

    # Test text escaping cases
    for test_name, test_text in TEST_CASES:
        print(f"Testing: {test_name}")
        print(f"  Input: {repr(test_text[:100])}")

        try:
            # Generate filter
            filter_complex = generate_test_filter(test_text)
            print(f"  Filter length: {len(filter_complex)} chars")

            # Test with FFmpeg
            success, error = test_ffmpeg_filter(filter_complex)

            if success:
                print(f"  ✅ PASS")
                passed += 1
                results.append((test_name, "PASS", None))
            else:
                print(f"  ❌ FAIL")
                print(f"  Error: {error}")
                failed += 1
                results.append((test_name, "FAIL", error))

        except Exception as e:
            print(f"  ❌ EXCEPTION: {str(e)}")
            failed += 1
            results.append((test_name, "EXCEPTION", str(e)))

        print()

    # Test duration edge cases
    print("=" * 80)
    print("Testing Duration Edge Cases")
    print("=" * 80)
    print()

    for test_name, test_text, duration, is_outro in DURATION_TEST_CASES:
        print(f"Testing: {test_name}")
        print(f"  Input: {repr(test_text)}, duration={duration}s, is_outro={is_outro}")

        try:
            # Generate filter
            filter_complex = generate_test_filter(test_text, duration=duration, is_outro=is_outro)
            print(f"  Filter length: {len(filter_complex)} chars")

            # Test with FFmpeg
            success, error = test_ffmpeg_filter(filter_complex)

            if success:
                print(f"  ✅ PASS")
                passed += 1
                results.append((test_name, "PASS", None))
            else:
                print(f"  ❌ FAIL")
                print(f"  Error: {error}")
                failed += 1
                results.append((test_name, "FAIL", error))

        except Exception as e:
            print(f"  ❌ EXCEPTION: {str(e)}")
            failed += 1
            results.append((test_name, "EXCEPTION", str(e)))

        print()

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total tests: {passed + failed}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success rate: {passed / (passed + failed) * 100:.1f}%")
    print()

    if failed > 0:
        print("FAILED TESTS:")
        print("-" * 80)
        for name, status, error in results:
            if status != "PASS":
                print(f"  • {name}")
                if error:
                    print(f"    {error[:200]}")
        print()

    # Exit code
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())
