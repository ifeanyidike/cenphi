#!/usr/bin/env python3
"""
Direct testing of runpod_handler without HTTP server
Place this in your ai-service directory and run: python test_validation_error_direct.py
"""

import sys
import os
import traceback

# Add the ai-service directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_validation_error():
    """Test the exact validation error that occurs in RunPod"""
    print("🧪 Testing RunPod Validation Error Direct")
    print("=" * 50)
    
    try:
        # Import the handler
        from runpod_handler import handler
        print("✅ Successfully imported runpod_handler")
        
        # Create the exact event that causes validation error in RunPod
        test_event = {
            "input": {
                "task": "enhance_media",
                "media_url": "https://example.com/test.mp4",
                "quality": "high",
                "upload_to_cloud": True,
                # These null values cause the validation error:
                "watermark_text": None,     # ← ValidationError: string_type
                "brand_color": None,        # ← ValidationError: string_type
                "logo_url": None,          # ← ValidationError: string_type
                "watermark_position": None,
                "testimonial_id": None,
                "job_id": None
            }
        }
        
        print("\n📝 Test Event:")
        print(f"Task: {test_event['input']['task']}")
        print(f"Media URL: {test_event['input']['media_url']}")
        print(f"Watermark Text: {test_event['input']['watermark_text']}")
        print(f"Brand Color: {test_event['input']['brand_color']}")
        print(f"Logo URL: {test_event['input']['logo_url']}")
        
        print("\n🚀 Calling handler with null values...")
        print("-" * 30)
        
        # This is where the validation error should occur
        result = handler(test_event)
        
        print("-" * 30)
        print("📊 Result:")
        print(result)
        
        # Check if we got the validation error
        if isinstance(result, dict) and result.get("error"):
            error = result["error"]
            if "validation" in error.lower() or "string_type" in error.lower():
                print("\n✅ VALIDATION ERROR REPRODUCED!")
                print(f"Error: {error}")
                print("\n🔧 This is the same error you see in RunPod.")
                print("Apply the Pydantic model fix and test again.")
            else:
                print(f"\n⚠️  Got different error: {error}")
        else:
            print("\n❌ No error occurred - this is unexpected")
            print("Either the fix is already applied or there's a setup issue")
            
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure you're running this from the ai-service directory")
        print("Current directory:", os.getcwd())
        print("Expected files: runpod_handler.py, src/config/models.py")
        
    except Exception as e:
        print(f"💥 Exception occurred: {e}")
        print("\nFull traceback:")
        print(traceback.format_exc())

def test_after_fix():
    """Test with empty strings (should work after Pydantic fix)"""
    print("\n" + "=" * 50)
    print("🧪 Testing After Fix (Empty Strings)")
    print("=" * 50)
    
    try:
        from runpod_handler import handler
        
        # Same test but with empty strings instead of nulls
        test_event = {
            "input": {
                "task": "enhance_media",
                "media_url": "https://example.com/test.mp4",
                "quality": "high",
                "upload_to_cloud": True,
                # Empty strings instead of nulls:
                "watermark_text": "",
                "brand_color": "",
                "logo_url": "",
                "watermark_position": "",
                "testimonial_id": "",
                "job_id": ""
            }
        }
        
        print("🚀 Calling handler with empty strings...")
        result = handler(test_event)
        
        print("📊 Result:")
        print(result)
        
        if isinstance(result, dict) and result.get("error"):
            print(f"\n⚠️  Still got error: {result['error']}")
        else:
            print("\n✅ Success with empty strings!")
            
    except Exception as e:
        print(f"💥 Exception: {e}")

if __name__ == "__main__":
    # Test the validation error
    test_validation_error()
    
    # Test with empty strings
    test_after_fix()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    print("If you saw 'VALIDATION ERROR REPRODUCED', that's the RunPod issue!")
    print("Apply the Pydantic model fixes, then run this test again.")
    print("After the fix, the null values should work without validation errors.")