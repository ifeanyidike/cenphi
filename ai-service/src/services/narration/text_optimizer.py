# src/narration/text_optimizer.py  
from typing import Dict, Any
from src.ai_providers.client import ai_client
import logging
import re

logger = logging.getLogger(__name__)

class TextOptimizer:
    """AI-powered text optimization specifically for speech synthesis"""
    
    def __init__(self):
        self.optimization_cache = {}  # Simple cache for repeated optimizations
    
    def optimize_for_speech(self, text: str, style: str = "professional", language: str = "en") -> Dict[str, Any]:
        """
        Optimize text for natural speech synthesis using AI
        
        Returns:
            Dict with optimized_text, confidence_score, and applied_changes
        """
        
        # Check cache first for identical requests
        cache_key = f"{hash(text)}_{style}_{language}"
        if cache_key in self.optimization_cache:
            logger.info("Using cached text optimization")
            return self.optimization_cache[cache_key]
        
        try:
            # AI-powered optimization
            optimized_result = self._ai_optimize_text(text, style, language)
            
            # Validate and enhance the result
            validated_result = self._validate_and_enhance_optimization(text, optimized_result, style)
            
            # Cache the result
            self.optimization_cache[cache_key] = validated_result
            
            return validated_result
            
        except Exception as e:
            logger.warning(f"AI text optimization failed: {e}, using fallback")
            return self._fallback_optimization(text, style)
    
    def _ai_optimize_text(self, text: str, style: str, language: str) -> Dict[str, Any]:
        """Core AI text optimization"""
        
        optimization_prompt = self._create_optimization_prompt(text, style, language)
        
        response = ai_client.chat_completion(
            messages=[{"role": "user", "content": optimization_prompt}],
            model="gpt-4.1-nano",
            temperature=0.2,  # Low temperature for consistent optimization
            max_tokens=min(len(text) * 2, 3000)  # Allow up to 2x original length
        )
        
        # Parse the AI response
        return self._parse_ai_optimization_response(response.content, text)
    
    def _create_optimization_prompt(self, text: str, style: str, language: str) -> str:
        """Create a clean AI prompt to optimize and optionally translate text for narration"""

        prompt = f"""
    You are a speech narration expert. Your task is to prepare the following input text for natural and fluent narration in the "{style}" style and in the "{language}" language.

    If the input is not already in {language}, first translate it.

    Then optimize it for narration by following these rules:
    1. Break long sentences into natural speaking chunks.
    2. Add commas where natural pauses occur.
    3. Expand all abbreviations, acronyms, and technical terms.
    4. Convert all numbers to written words (e.g., 2024 → twenty twenty-four, 85% → eighty-five percent).
    5. Keep all sentences under 20 words where possible.
    6. Use a tone that matches the "{style}" style.
    7. Do not change the meaning, but make the language smooth, clear, and engaging.
    8. Eliminate parentheses, colons, slashes, or overly complex punctuation.

    ONLY return the optimized text.
    Do NOT include any labels, explanation, or formatting — just the optimized text.

    TEXT:
    {text}
    """

        return prompt.strip()


    
    def _parse_ai_optimization_response(self, ai_response: str, original_text: str) -> Dict[str, Any]:
        """Parse AI response and extract optimization details"""
        
        try:
            # Extract optimized text
            optimized_match = re.search(r'Optimized Text:\s*(.+?)(?=\nConfidence:|$)', ai_response, re.DOTALL)
            optimized_text = optimized_match.group(1).strip() if optimized_match else ai_response.strip()
            
            # Extract confidence score
            confidence_match = re.search(r'Confidence:\s*(\d+)', ai_response)
            confidence = int(confidence_match.group(1)) / 10 if confidence_match else 0.8
            
            # Extract changes made
            changes_match = re.search(r'Changes Made:\s*(.+?)$', ai_response, re.DOTALL)
            changes_made = changes_match.group(1).strip() if changes_match else "Text optimized for speech"
            
            return {
                "optimized_text": optimized_text,
                "confidence_score": confidence,
                "changes_made": changes_made,
                "original_length": len(original_text),
                "optimized_length": len(optimized_text),
                "improvement_ratio": len(optimized_text) / len(original_text) if original_text else 1.0
            }
            
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {e}")
            # Fallback to basic parsing
            return {
                "optimized_text": ai_response.strip(),
                "confidence_score": 0.7,
                "changes_made": "Basic optimization applied",
                "original_length": len(original_text),
                "optimized_length": len(ai_response.strip()),
                "improvement_ratio": len(ai_response.strip()) / len(original_text) if original_text else 1.0
            }
    
    def _validate_and_enhance_optimization(self, original_text: str, ai_result: Dict[str, Any], style: str) -> Dict[str, Any]:
        """Validate AI optimization and apply additional enhancements"""
        
        optimized_text = ai_result["optimized_text"]
        
        # Validation checks
        validation_issues = []
        
        # Length validation
        length_ratio = ai_result["improvement_ratio"]
        if length_ratio < 0.5 or length_ratio > 3.0:
            validation_issues.append("Unexpected length change")
        
        # Content preservation check
        if len(optimized_text) < len(original_text) * 0.6:
            validation_issues.append("Possible content loss")
        
        # Apply post-processing enhancements
        enhanced_text = self._apply_post_processing_enhancements(optimized_text, style)
        
        # Update result with enhancements
        ai_result["optimized_text"] = enhanced_text
        ai_result["validation_issues"] = validation_issues
        ai_result["post_processing_applied"] = True
        
        # Adjust confidence based on validation
        if validation_issues:
            ai_result["confidence_score"] *= 0.8
        
        return ai_result
    
    def _apply_post_processing_enhancements(self, text: str, style: str) -> str:
        """Apply final enhancements to optimized text"""
        
        # Ensure proper sentence endings
        text = text.strip()
        if not text.endswith(('.', '!', '?')):
            text += '.'
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common punctuation issues
        text = re.sub(r'\s+([,.!?])', r'\1', text)  # Remove spaces before punctuation
        text = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', text)  # Ensure space after sentence endings
        
        # Style-specific adjustments
        if style.lower() in ["energetic", "enthusiastic", "excited"]:
            # Add slight emphasis through punctuation
            text = re.sub(r'([.!?])\s+(This|That|It|They|We)\s+(is|was|are|were)\s+(amazing|incredible|fantastic|outstanding|excellent)', 
                         r'\1 \2 \3 truly \4', text, flags=re.IGNORECASE)
        
        elif style.lower() in ["professional", "business", "corporate"]:
            # Ensure formal tone consistency
            text = re.sub(r'\b(gonna|wanna|gotta)\b', lambda m: {'gonna': 'going to', 'wanna': 'want to', 'gotta': 'have to'}[m.group()], text, flags=re.IGNORECASE)
        
        return text
    
    def _fallback_optimization(self, text: str, style: str) -> Dict[str, Any]:
        """Fallback optimization using rule-based approach with inflect"""
        
        logger.info("Applying fallback text optimization")
        
        # Basic text processing
        processed = re.sub(r'\s+', ' ', text.strip())
        
        # Essential abbreviation expansion (UNCHANGED)
        abbreviations = {
            r'\bCEO\b': 'Chief Executive Officer',
            r'\bCTO\b': 'Chief Technology Officer',
            r'\bCFO\b': 'Chief Financial Officer',
            r'\bAI\b': 'Artificial Intelligence',
            r'\bAPI\b': 'A P I',
            r'\bURL\b': 'U R L',
            r'\bFAQ\b': 'frequently asked questions',
            r'\bvs\.\b': 'versus',
            r'\betc\.\b': 'et cetera',
            r'\be\.g\.\b': 'for example',
            r'\bi\.e\.\b': 'that is',
            r'\bInc\.\b': 'Incorporated',
            r'\bLtd\.\b': 'Limited',
            r'\bLLC\b': 'Limited Liability Company'
        }
        
        for pattern, replacement in abbreviations.items():
            processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
        
        # ============================================================================
        # UPDATED: Number handling with inflect (replaces num2words)
        # ============================================================================
        try:
            import inflect
            p = inflect.engine()
            
            # Percentages: "85%" → "eighty-five percent"
            processed = re.sub(r'(\d+)%', 
                            lambda m: f"{p.number_to_words(int(m.group(1)))} percent", 
                            processed)
            
            # Years: "2024" → "twenty twenty-four" 
            def convert_year(match):
                year_str = match.group(0)
                year = int(year_str)
                
                if 2000 <= year <= 2099:
                    # Modern years: split into two parts
                    first_two = year // 100  # 20
                    last_two = year % 100    # 24
                    if last_two == 0:
                        return f"{p.number_to_words(first_two)} hundred"
                    else:
                        return f"{p.number_to_words(first_two)} {p.number_to_words(last_two)}"
                elif 1900 <= year <= 1999:
                    # 1900s: can be said as "nineteen ninety-nine" or full number
                    if year % 100 == 0:
                        return p.number_to_words(year)
                    else:
                        first_two = year // 100  # 19
                        last_two = year % 100    # 99
                        return f"{p.number_to_words(first_two)} {p.number_to_words(last_two)}"
                else:
                    # Other years: say as full number
                    return p.number_to_words(year)
            
            processed = re.sub(r'\b(19|20)(\d{2})\b', convert_year, processed)
            
            # Simple numbers: "123" → "one hundred twenty-three"
            processed = re.sub(r'\b(\d{1,3})\b', 
                            lambda m: p.number_to_words(int(m.group(1))), 
                            processed)
            
            # Handle larger numbers if present
            processed = re.sub(r'\b(\d{4,})\b', 
                            lambda m: p.number_to_words(int(m.group(1))), 
                            processed)
            
        except ImportError:
            logger.warning("inflect package not available, keeping numbers as digits")
        except Exception as e:
            logger.warning(f"Number conversion failed: {e}")
        
        # Ensure proper ending (UNCHANGED)
        if not processed.endswith(('.', '!', '?')):
            processed += '.'
        
        return {
            "optimized_text": processed,
            "confidence_score": 0.7,  # Higher confidence with inflect
            "changes_made": "Fallback optimization: abbreviations expanded, numbers converted with inflect",
            "original_length": len(text),
            "optimized_length": len(processed),
            "improvement_ratio": len(processed) / len(text) if text else 1.0,
            "fallback_used": True
        }
    
    def analyze_text_complexity(self, text: str) -> Dict[str, Any]:
        """Analyze text complexity for speech synthesis"""
        
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        # Basic metrics
        word_count = len(words)
        sentence_count = len([s for s in sentences if s.strip()])
        avg_words_per_sentence = word_count / max(sentence_count, 1)
        
        # Complexity indicators
        long_words = len([w for w in words if len(w) > 6])
        abbreviations = len(re.findall(r'\b[A-Z]{2,}\b', text))
        numbers = len(re.findall(r'\d+', text))
        
        # Readability estimate (simplified)
        complexity_score = (
            min(avg_words_per_sentence / 15, 1.0) * 0.4 +  # Sentence length
            min(long_words / word_count, 0.5) * 0.3 +       # Word complexity
            min((abbreviations + numbers) / word_count, 0.3) * 0.3  # Technical content
        )
        
        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "avg_words_per_sentence": avg_words_per_sentence,
            "complexity_score": complexity_score,
            "optimization_recommended": complexity_score > 0.6,
            "issues": {
                "long_sentences": avg_words_per_sentence > 20,
                "many_abbreviations": abbreviations > word_count * 0.05,
                "many_numbers": numbers > word_count * 0.1,
                "complex_words": long_words > word_count * 0.3
            }
        }