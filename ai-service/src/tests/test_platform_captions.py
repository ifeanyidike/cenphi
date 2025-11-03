#!/usr/bin/env python3
"""
Test script for platform-specific caption styles with FFmpeg 7.1.1

This script creates test videos for each platform to verify:
1. FFmpeg 7.1.1 compatibility
2. Visual appearance of captions
3. No errors or warnings

Usage:
    python test_platform_captions.py

Requirements:
    - FFmpeg 7.1.1 installed
    - A test video file (will create one if missing)
    - A test SRT file (will create one if missing)
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path

# Add parent directory to path to import project modules
sys.path.insert(0, str(Path(__file__).parent))

class PlatformCaptionTester:
    def __init__(self):
        self.test_dir = tempfile.mkdtemp(prefix="caption_test_")
        print(f"Test directory: {self.test_dir}")

    def create_test_video(self) -> str:
        """Create a simple test video (10 seconds, 1080x1920 vertical)"""
        test_video = os.path.join(self.test_dir, "test_video.mp4")

        print("Creating test video...")
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "color=c=blue:s=1080x1920:d=10",  # 10 second blue video
            "-f", "lavfi",
            "-i", "sine=frequency=1000:duration=10",  # 1kHz tone
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            test_video
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Failed to create test video: {result.stderr}")
            sys.exit(1)

        print(f"✓ Test video created: {test_video}")
        return test_video

    def create_test_srt(self) -> str:
        """Create a test SRT file with sample captions"""
        test_srt = os.path.join(self.test_dir, "test_captions.srt")

        srt_content = """1
00:00:01,000 --> 00:00:03,000
This is a test caption

2
00:00:03,500 --> 00:00:06,000
Platform-specific styling

3
00:00:06,500 --> 00:00:09,000
FFmpeg 7.1.1 compatible
"""

        with open(test_srt, 'w', encoding='utf-8') as f:
            f.write(srt_content)

        print(f"✓ Test SRT created: {test_srt}")
        return test_srt

    def get_platform_styles(self):
        """Define platform-specific caption styles for testing"""
        return {
            "current_tiktok": {
                "description": "Current TikTok style (baseline)",
                "force_style": (
                    "FontName=Arial,FontSize=18,Bold=1,BorderStyle=1,Outline=2,Shadow=0,"
                    "PrimaryColour=&Hffffff&,OutlineColour=&H000000&,"
                    "BackColour=&H80000000&,Alignment=2,MarginV=30"
                )
            },
            "enhanced_tiktok": {
                "description": "Enhanced TikTok style (yellow box background)",
                "force_style": (
                    "FontName=Arial Black,FontSize=24,Bold=1,BorderStyle=4,Outline=0,Shadow=3,"
                    "PrimaryColour=&H000000&,BackColour=&H0000ffff&,"  # Black on bright yellow (CORRECT)
                    "Alignment=2,MarginV=50,Spacing=3"
                )
            },
            "enhanced_instagram_reels": {
                "description": "Enhanced Instagram Reels (pink box background)",
                "force_style": (
                    "FontName=Arial Black,FontSize=22,Bold=1,BorderStyle=4,Outline=0,Shadow=3,"
                    "PrimaryColour=&Hffffff&,BackColour=&H00ff69b4&,"  # White on hot pink
                    "Alignment=2,MarginV=45,Spacing=3"
                )
            },
            "enhanced_youtube_shorts": {
                "description": "Enhanced YouTube Shorts (clean black box)",
                "force_style": (
                    "FontName=Arial,FontSize=22,Bold=1,BorderStyle=4,Outline=0,Shadow=2,"
                    "PrimaryColour=&Hffffff&,BackColour=&HCC000000&,"  # White on 80% black
                    "Alignment=2,MarginV=40,Spacing=2"
                )
            },
            "enhanced_instagram_story": {
                "description": "Enhanced Instagram Story (compact)",
                "force_style": (
                    "FontName=Arial,FontSize=18,Bold=1,BorderStyle=4,Outline=0,Shadow=2,"
                    "PrimaryColour=&Hffffff&,BackColour=&HCC000000&,"  # White on 80% black
                    "Alignment=2,MarginV=35,Spacing=2"
                )
            },
            "enhanced_linkedin": {
                "description": "Enhanced LinkedIn (professional subtle box)",
                "force_style": (
                    "FontName=Arial,FontSize=20,Bold=1,BorderStyle=4,Outline=0,Shadow=1,"
                    "PrimaryColour=&Hffffff&,BackColour=&HE6000000&,"  # White on very subtle black
                    "Alignment=2,MarginV=35,Spacing=1"
                )
            }
        }

    def test_caption_style(self, platform_name: str, style_config: dict, video_path: str, srt_path: str) -> dict:
        """Test a single caption style"""
        output_path = os.path.join(self.test_dir, f"output_{platform_name}.mp4")

        # Properly escape SRT path for FFmpeg
        escaped_srt = srt_path.replace("\\", "/").replace(":", "\\:")

        subtitle_filter = f"subtitles='{escaped_srt}':force_style='{style_config['force_style']}'"

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", subtitle_filter,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "17",
            "-profile:v", "high",
            "-level", "4.1",
            "-c:a", "copy",
            "-movflags", "+faststart",
            output_path
        ]

        print(f"\n{'='*60}")
        print(f"Testing: {platform_name}")
        print(f"Description: {style_config['description']}")
        print(f"Command: {' '.join(cmd)}")
        print(f"{'='*60}")

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        test_result = {
            "platform": platform_name,
            "description": style_config['description'],
            "success": result.returncode == 0,
            "output_path": output_path if result.returncode == 0 else None,
            "error": result.stderr if result.returncode != 0 else None,
            "warnings": self._extract_warnings(result.stderr)
        }

        if test_result["success"]:
            file_size = os.path.getsize(output_path)
            print(f"✓ SUCCESS: Output created ({file_size} bytes)")
            print(f"  Output: {output_path}")
        else:
            print(f"✗ FAILED: {result.stderr[:200]}")

        if test_result["warnings"]:
            print(f"⚠ Warnings: {len(test_result['warnings'])} found")
            for warning in test_result["warnings"][:3]:
                print(f"  - {warning}")

        return test_result

    def _extract_warnings(self, stderr: str) -> list:
        """Extract warning messages from FFmpeg stderr"""
        warnings = []
        for line in stderr.split('\n'):
            if 'warning' in line.lower() or 'deprecated' in line.lower():
                warnings.append(line.strip())
        return warnings

    def run_all_tests(self):
        """Run tests for all platform styles"""
        print("\n" + "="*60)
        print("Platform Caption Style Test Suite")
        print("FFmpeg Version Check")
        print("="*60)

        # Check FFmpeg version
        version_check = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        )
        print(version_check.stdout.split('\n')[0])

        # Create test assets
        test_video = self.create_test_video()
        test_srt = self.create_test_srt()

        # Get platform styles
        styles = self.get_platform_styles()

        # Run tests
        results = []
        for platform_name, style_config in styles.items():
            result = self.test_caption_style(platform_name, style_config, test_video, test_srt)
            results.append(result)

        # Print summary
        self.print_summary(results)

        return results

    def print_summary(self, results: list):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)

        passed = sum(1 for r in results if r["success"])
        total = len(results)

        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")

        print("\nDetailed Results:")
        for result in results:
            status = "✓" if result["success"] else "✗"
            warnings = f" ({len(result['warnings'])} warnings)" if result["warnings"] else ""
            print(f"  {status} {result['platform']}: {result['description']}{warnings}")
            if result["output_path"]:
                print(f"    → {result['output_path']}")

        print("\n" + "="*60)
        print("NEXT STEPS:")
        print("="*60)
        print(f"1. Review output videos in: {self.test_dir}")
        print("2. Check visual appearance of each caption style")
        print("3. If all tests pass, apply changes to caption_generator.py")
        print("4. If any test fails, review the error messages above")
        print("\nTo view a test video:")
        print(f"  open {self.test_dir}/output_enhanced_tiktok.mp4")
        print("="*60)

def main():
    """Main test execution"""
    try:
        tester = PlatformCaptionTester()
        results = tester.run_all_tests()

        # Exit with error if any tests failed
        if not all(r["success"] for r in results):
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nTest failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
