# src/services/story_mode/broll_placement_ai.py

import logging
import re
import json
from typing import List, Dict, Any, Optional, Set
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

from src.ai_providers.client import ai_client

logger = logging.getLogger(__name__)


class BrollPlacementAI:
    """
    AI-powered B-roll placement service.

    Analyzes video transcripts to intelligently place B-roll footage at
    contextually appropriate moments without disrupting the narrative flow.

    Key Features:
    - Transcript analysis for general topic identification
    - Keyword extraction and semantic matching
    - Natural pause detection
    - Duration management (prevents overwhelming the video)
    - Overlap prevention
    """

    # Words that indicate visual references (avoid B-roll during these)
    VISUAL_REFERENCE_WORDS = {
        'see', 'look', 'watch', 'here', 'this', 'these', 'show', 'display',
        'screen', 'above', 'below', 'right', 'left', 'pointing'
    }

    # Words that indicate good moments for B-roll (general concepts)
    GENERAL_TOPIC_INDICATORS = {
        'platform', 'service', 'product', 'company', 'team', 'business',
        'solution', 'approach', 'strategy', 'process', 'method', 'system',
        'experience', 'journey', 'story', 'results', 'impact', 'benefits'
    }

    # Common stopwords to filter out
    STOPWORDS = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'i', 'you', 'we', 'they',
        'he', 'she', 'it', 'my', 'your', 'our', 'their', 'me', 'him', 'her'
    }

    def __init__(self):
        logger.info("BrollPlacementAI initialized")

    def analyze_and_place_broll(
        self,
        transcript_segments: List[Dict[str, Any]],
        broll_clips: List[Dict[str, Any]],
        video_duration: float,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main entry point for AI-powered B-roll placement.

        Args:
            transcript_segments: List of transcript segments with timestamps
                [{"text": str, "start": float, "end": float}, ...]
            broll_clips: List of available B-roll clips
                [{"id": str, "url": str, "name": str, "duration": float, "keywords": List[str]}, ...]
            video_duration: Total duration of main video in seconds
            config: Configuration dict with:
                - max_broll_duration: Maximum duration per B-roll insert
                - max_broll_percent: Maximum percent of video that can be B-roll (default 0.3)
                - transition_type: fade/dissolve/cut

        Returns:
            {
                "placements": List[Dict] - Suggested B-roll placements
                "total_broll_duration": float,
                "coverage_percent": float,
                "warnings": List[str]
            }
        """
        logger.info(f"[BrollAI] Analyzing transcript for B-roll placement...")
        logger.info(f"[BrollAI] Video: {video_duration}s, Clips: {len(broll_clips)}, Segments: {len(transcript_segments)}")

        max_broll_duration = config.get('max_broll_duration', 10.0)
        max_broll_percent = config.get('max_broll_percent', 0.3)
        transition_type = config.get('transition_type', 'fade')

        # Step 1: Find candidate insertion points in transcript
        candidates = self._find_insertion_candidates(transcript_segments, video_duration)
        logger.info(f"[BrollAI] Found {len(candidates)} candidate insertion points")

        # Step 2: Match B-roll clips to candidates
        placements = self._match_broll_to_candidates(
            candidates,
            broll_clips,
            max_broll_duration,
            transition_type
        )
        logger.info(f"[BrollAI] Matched {len(placements)} B-roll placements")

        # Step 3: Manage duration limits
        placements, warnings = self._manage_duration_limits(
            placements,
            video_duration,
            max_broll_percent
        )
        logger.info(f"[BrollAI] Final placements after duration management: {len(placements)}")

        # Step 4: Prevent overlaps
        placements = self._prevent_overlaps(placements)
        logger.info(f"[BrollAI] Final placements after overlap prevention: {len(placements)}")

        # Calculate stats
        total_broll_duration = sum(p['duration'] for p in placements)
        coverage_percent = (total_broll_duration / video_duration) * 100 if video_duration > 0 else 0

        result = {
            "placements": placements,
            "total_broll_duration": round(total_broll_duration, 2),
            "coverage_percent": round(coverage_percent, 1),
            "warnings": warnings
        }

        logger.info(f"[BrollAI] ✅ Placement complete: {len(placements)} clips, {result['total_broll_duration']}s total ({result['coverage_percent']}% coverage)")

        # DEBUG: Log placement times to verify they're reasonable
        for i, p in enumerate(placements):
            logger.info(f"[BrollAI] Placement {i}: start={p['start_time']}s, duration={p['duration']}s")

        return result

    def _process_single_segment(
        self,
        segment: Dict[str, Any],
        segment_index: int,
        video_duration: float,
        is_first_batch: bool
    ) -> Optional[Dict[str, Any]]:
        """
        Process a single segment for B-roll suitability (thread-safe).

        Returns candidate dict if suitable, None otherwise.
        """
        try:
            text = segment.get('text', '').strip().lower()
            start_time = segment.get('start', segment.get('start_time', 0))
            end_time = segment.get('end', segment.get('end_time', start_time + 5))

            # DEBUG: Log first few segments to check if timestamps are in milliseconds or seconds
            if is_first_batch and segment_index < 3:
                logger.info(f"[BrollAI] Segment {segment_index}: start={start_time}, end={end_time}, video_duration={video_duration}")

            # CRITICAL FIX: Convert milliseconds to seconds if needed
            if start_time > video_duration * 1.5:  # Safety margin
                if is_first_batch and segment_index < 3:
                    logger.warning(f"[BrollAI] Timestamps appear to be in milliseconds! Converting to seconds...")
                start_time = start_time / 1000.0
                end_time = end_time / 1000.0
                if is_first_batch and segment_index < 3:
                    logger.info(f"[BrollAI] Converted: start={start_time}s, end={end_time}s")

            if not text:
                return None

            # Skip very short segments
            duration = end_time - start_time
            if duration < 2.0:
                return None

            # Use AI to analyze segment for B-roll suitability
            ai_analysis = self._ai_analyze_segment(text, start_time, end_time, video_duration)

            # Only return if AI deems it suitable
            if ai_analysis['is_suitable'] and ai_analysis['confidence'] > 0.3:
                return {
                    'start_time': start_time,
                    'end_time': end_time,
                    'text': text,
                    'keywords': ai_analysis['semantic_keywords'],
                    'main_topic': ai_analysis['main_topic'],
                    'confidence': ai_analysis['confidence'],
                    'reason': ai_analysis['reasoning'],
                    'segment_index': segment_index
                }
            return None

        except Exception as e:
            logger.warning(f"[BrollAI] Error processing segment {segment_index}: {e}")
            return None

    def _find_insertion_candidates(
        self,
        transcript_segments: List[Dict[str, Any]],
        video_duration: float
    ) -> List[Dict[str, Any]]:
        """
        Identify good moments in the transcript for B-roll insertion using AI.
        Uses parallel processing for performance (15 concurrent workers).

        Returns list of candidates with:
        - start_time
        - end_time
        - text
        - keywords
        - main_topic (from AI analysis)
        - confidence (0-1)
        - reason
        """
        candidates = []
        # Reduced from 15 to 6 to respect Together AI rate limits (typically 60 req/min)
        # 6 workers gives ~10x speedup while staying under rate limits
        max_workers = 6

        logger.info(f"[BrollAI] Processing {len(transcript_segments)} segments with {max_workers} parallel workers...")

        try:
            # Use ThreadPoolExecutor for parallel AI analysis
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all segments for processing
                future_to_index = {}
                for i, segment in enumerate(transcript_segments):
                    # First batch flag for debug logging
                    is_first_batch = (i < max_workers)
                    future = executor.submit(
                        self._process_single_segment,
                        segment,
                        i,
                        video_duration,
                        is_first_batch
                    )
                    future_to_index[future] = i

                # Collect results as they complete (maintains thread safety)
                for future in as_completed(future_to_index):
                    try:
                        result = future.result(timeout=10)  # 10 second timeout per segment
                        if result is not None:
                            candidates.append(result)
                    except Exception as e:
                        segment_idx = future_to_index[future]
                        logger.warning(f"[BrollAI] Segment {segment_idx} analysis failed: {e}")
                        continue

        except Exception as e:
            logger.error(f"[BrollAI] Parallel processing failed, falling back to sequential: {e}")
            # Fallback to sequential processing if parallel fails
            for i, segment in enumerate(transcript_segments):
                result = self._process_single_segment(segment, i, video_duration, i < 3)
                if result is not None:
                    candidates.append(result)

        # Sort by confidence (highest first)
        candidates.sort(key=lambda x: x['confidence'], reverse=True)

        logger.info(f"[BrollAI] ✅ AI identified {len(candidates)} suitable insertion points from {len(transcript_segments)} segments")

        return candidates

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text."""
        # Clean and tokenize
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())

        # Filter stopwords
        keywords = [w for w in words if w not in self.STOPWORDS]

        # Count frequency
        word_freq = Counter(keywords)

        # Return top keywords
        top_keywords = [word for word, _ in word_freq.most_common(5)]

        return top_keywords

    def _ai_analyze_segment(
        self,
        text: str,
        start_time: float,
        end_time: float,
        video_duration: float
    ) -> Dict[str, Any]:
        """
        Use AI to analyze transcript segment for B-roll suitability.
        Includes retry logic with exponential backoff for rate limiting.

        Returns:
        {
            "is_suitable": bool,
            "confidence": float (0-1),
            "main_topic": str,
            "semantic_keywords": List[str],
            "reasoning": str
        }
        """
        max_retries = 3
        base_delay = 1.0  # Start with 1 second delay

        for attempt in range(max_retries):
            try:
                prompt = f"""Analyze this video transcript segment for B-roll footage placement:

Transcript: "{text}"
Timestamp: {start_time:.1f}s - {end_time:.1f}s
Video Duration: {video_duration:.1f}s

Determine:
1. Is this a GOOD moment for B-roll? (Avoid if speaker is referencing visual elements like "see here", "look at this", "on screen")
2. What is the MAIN TOPIC/THEME being discussed? (1-3 words)
3. List 3-5 SEMANTIC KEYWORDS that describe visual concepts mentioned
4. Confidence score (0-1) for B-roll placement
5. Brief reasoning

Respond ONLY with valid JSON:
{{
  "is_suitable": true/false,
  "confidence": 0.0-1.0,
  "main_topic": "topic here",
  "semantic_keywords": ["keyword1", "keyword2", "keyword3"],
  "reasoning": "brief explanation"
}}"""

                response = ai_client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    model="gpt-4.1-nano",  # Fast, cheap model for analysis
                    temperature=0.3,
                    max_tokens=300
                )

                result = json.loads(response.content.strip())

                # Apply time-based adjustments
                if start_time < 3.0:
                    result["confidence"] *= 0.7
                    result["reasoning"] += " (early in video)"

                if end_time > video_duration - 5.0:
                    result["confidence"] *= 0.7
                    result["reasoning"] += " (late in video)"

                return result

            except Exception as e:
                error_str = str(e).lower()
                is_rate_limit = "rate" in error_str or "429" in error_str or "limit" in error_str

                if is_rate_limit and attempt < max_retries - 1:
                    # Exponential backoff: 1s, 2s, 4s
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"[BrollAI] Rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    # Non-rate-limit error or final attempt failed
                    logger.warning(f"[BrollAI] AI analysis failed after {attempt + 1} attempts, falling back to keyword-based: {e}")
                    return self._fallback_segment_analysis(text, start_time, end_time, video_duration)

        # Should never reach here, but just in case
        return self._fallback_segment_analysis(text, start_time, end_time, video_duration)

    def _fallback_segment_analysis(
        self,
        text: str,
        start_time: float,
        end_time: float,
        video_duration: float
    ) -> Dict[str, Any]:
        """
        Fallback keyword-based analysis if AI fails.
        """
        keywords = self._extract_keywords(text)
        confidence, reason = self._calculate_confidence_legacy(
            text, keywords, start_time, end_time, video_duration
        )

        has_visual_ref = any(word in text for word in self.VISUAL_REFERENCE_WORDS)

        return {
            "is_suitable": confidence > 0.3 and not has_visual_ref,
            "confidence": confidence,
            "main_topic": keywords[0] if keywords else "general",
            "semantic_keywords": keywords,
            "reasoning": reason
        }

    def _calculate_confidence_legacy(
        self,
        text: str,
        keywords: List[str],
        start_time: float,
        end_time: float,
        video_duration: float
    ) -> tuple[float, str]:
        """
        Legacy keyword-based confidence calculation (fallback).
        """
        confidence = 0.5  # Base confidence
        reasons = []

        # NEGATIVE SIGNALS (reduce confidence)

        # 1. Avoids visual references
        has_visual_ref = any(word in text for word in self.VISUAL_REFERENCE_WORDS)
        if has_visual_ref:
            confidence -= 0.4
            reasons.append("contains visual reference")

        # 2. Avoid first 3 seconds (intro/hook)
        if start_time < 3.0:
            confidence -= 0.3
            reasons.append("too early in video")

        # 3. Avoid last 5 seconds (CTA/conclusion)
        if end_time > video_duration - 5.0:
            confidence -= 0.3
            reasons.append("too late in video")

        # POSITIVE SIGNALS (increase confidence)

        # 1. Contains general topic words
        has_general_topic = any(word in keywords for word in self.GENERAL_TOPIC_INDICATORS)
        if has_general_topic:
            confidence += 0.3
            reasons.append("discusses general concepts")

        # 2. Longer segments are better (more context)
        duration = end_time - start_time
        if duration >= 5.0:
            confidence += 0.2
            reasons.append("sufficient duration")

        # 3. Has meaningful keywords
        if len(keywords) >= 3:
            confidence += 0.1
            reasons.append("rich content")

        # Clamp to 0-1 range
        confidence = max(0.0, min(1.0, confidence))

        # Build reason string
        if not reasons:
            reason_str = "neutral segment"
        elif confidence < 0.4:
            reason_str = f"low confidence: {', '.join(reasons)}"
        else:
            reason_str = ', '.join(reasons)

        return confidence, reason_str

    def _calculate_confidence(
        self,
        text: str,
        keywords: List[str],
        start_time: float,
        end_time: float,
        video_duration: float
    ) -> tuple[float, str]:
        """
        Calculate confidence score using AI-powered analysis.

        Returns (confidence_score, reason)
        """
        # Use AI analysis
        ai_result = self._ai_analyze_segment(text, start_time, end_time, video_duration)

        return ai_result["confidence"], ai_result["reasoning"]

    def _match_broll_to_candidates(
        self,
        candidates: List[Dict],
        broll_clips: List[Dict],
        max_duration: float,
        transition_type: str
    ) -> List[Dict]:
        """
        Match B-roll clips to insertion candidates using AI-powered semantic similarity.
        """
        placements = []
        used_candidates = set()

        for clip in broll_clips:
            clip_keywords = self._extract_broll_keywords(clip)
            clip_name = clip.get('name', 'B-roll')

            best_match = None
            best_score = 0.0
            best_reasoning = ""

            # Find best matching candidate using AI
            for candidate in candidates:
                if candidate['segment_index'] in used_candidates:
                    continue  # Already used

                # Use AI to semantically match B-roll to segment
                segment_topic = candidate.get('main_topic', candidate['keywords'][0] if candidate['keywords'] else 'general')

                match_result = self._ai_match_broll(
                    segment_text=candidate['text'],
                    segment_topic=segment_topic,
                    clip_keywords=clip_keywords,
                    clip_name=clip_name
                )

                # Combine AI match score with candidate confidence
                final_score = (match_result['match_score'] * 0.7) + (candidate['confidence'] * 0.3)

                if final_score > best_score:
                    best_score = final_score
                    best_match = candidate
                    best_reasoning = match_result['reasoning']

            # If we found a reasonable match, create a placement
            if best_match and best_score > 0.3:
                # Calculate B-roll duration (don't exceed segment or max duration)
                segment_duration = best_match['end_time'] - best_match['start_time']
                clip_duration = min(
                    clip.get('duration', max_duration),
                    max_duration,
                    segment_duration * 0.8  # Use max 80% of segment
                )

                placements.append({
                    'clip_id': clip.get('id', clip.get('pexels_id', f"clip_{len(placements)}")),
                    'clip_url': clip.get('url', clip.get('source_url', '')),
                    'clip_name': clip_name,
                    'start_time': best_match['start_time'],
                    'duration': round(clip_duration, 2),
                    'transition_type': transition_type,
                    'confidence': round(best_score, 2),
                    'reason': best_reasoning,
                    'segment_text': best_match['text'][:50] + '...'
                })

                used_candidates.add(best_match['segment_index'])

        return placements

    def _extract_broll_keywords(self, clip: Dict) -> List[str]:
        """
        Extract keywords from B-roll clip metadata.

        Uses clip name, Pexels tags, or filename.
        """
        keywords = []

        # From clip name
        name = clip.get('name', '')
        if name:
            # Extract words from filename (e.g., "office-meeting-123.mp4" -> ["office", "meeting"])
            words = re.findall(r'[a-zA-Z]{3,}', name.lower())
            keywords.extend(words)

        # From Pexels tags (if available)
        tags = clip.get('tags', [])
        if tags:
            keywords.extend([tag.lower() for tag in tags])

        # From URL (last resort)
        url = clip.get('url', '')
        if url and not keywords:
            # Extract from URL path
            words = re.findall(r'/([a-z]{3,})', url.lower())
            keywords.extend(words)

        # Remove duplicates and filter
        keywords = list(set(k for k in keywords if k not in self.STOPWORDS))

        return keywords[:5]  # Top 5

    def _ai_match_broll(
        self,
        segment_text: str,
        segment_topic: str,
        clip_keywords: List[str],
        clip_name: str
    ) -> Dict[str, Any]:
        """
        Use AI to semantically match B-roll clip to transcript segment.

        Returns:
        {
            "match_score": float (0-1),
            "relevance": str,
            "reasoning": str
        }
        """
        try:
            prompt = f"""Match B-roll footage to video transcript segment:

TRANSCRIPT SEGMENT: "{segment_text}"
MAIN TOPIC: {segment_topic}

B-ROLL CLIP:
- Name: {clip_name}
- Keywords/Tags: {', '.join(clip_keywords)}

Determine:
1. How RELEVANT is this B-roll to the transcript content? (0-1 score)
2. Would this B-roll VISUALLY ENHANCE the message? (high/medium/low)
3. Brief reasoning for the match quality

Respond ONLY with valid JSON:
{{
  "match_score": 0.0-1.0,
  "relevance": "high/medium/low",
  "reasoning": "brief explanation"
}}"""

            response = ai_client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model="gpt-4.1-nano",
                temperature=0.3,
                max_tokens=200
            )

            result = json.loads(response.content.strip())
            return result

        except Exception as e:
            logger.warning(f"[BrollAI] AI matching failed, falling back to keyword-based: {e}")
            # Fallback to keyword-based matching
            return self._fallback_broll_matching(segment_text, clip_keywords)

    def _fallback_broll_matching(
        self,
        segment_text: str,
        clip_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Fallback keyword-based matching if AI fails.
        """
        segment_words = set(re.findall(r'\b[a-z]{3,}\b', segment_text.lower()))
        clip_words = set(clip_keywords)

        overlaps = len(segment_words & clip_words)
        union_size = len(segment_words | clip_words)
        jaccard = overlaps / union_size if union_size > 0 else 0.0

        relevance = "high" if jaccard > 0.3 else "medium" if jaccard > 0.1 else "low"

        return {
            "match_score": jaccard,
            "relevance": relevance,
            "reasoning": f"Keyword overlap: {overlaps} matches"
        }

    def _calculate_match_score(
        self,
        segment_keywords: List[str],
        clip_keywords: List[str],
        base_confidence: float
    ) -> float:
        """
        Calculate how well a B-roll clip matches a transcript segment.
        Uses AI for semantic understanding.
        """
        if not segment_keywords or not clip_keywords:
            return 0.0

        # Count keyword overlaps (fallback)
        overlaps = len(set(segment_keywords) & set(clip_keywords))

        # Calculate Jaccard similarity
        union_size = len(set(segment_keywords) | set(clip_keywords))
        jaccard = overlaps / union_size if union_size > 0 else 0.0

        # Weighted score: 70% keyword match + 30% base confidence
        score = (jaccard * 0.7) + (base_confidence * 0.3)

        return score

    def _manage_duration_limits(
        self,
        placements: List[Dict],
        video_duration: float,
        max_percent: float
    ) -> tuple[List[Dict], List[str]]:
        """
        Ensure total B-roll doesn't exceed maximum percentage of video.
        """
        warnings = []
        max_total_duration = video_duration * max_percent

        # Calculate current total
        total_duration = sum(p['duration'] for p in placements)

        if total_duration <= max_total_duration:
            return placements, warnings

        # Need to trim - keep highest confidence placements
        placements.sort(key=lambda x: x.get('confidence', 0.5), reverse=True)

        trimmed_placements = []
        running_total = 0.0

        for placement in placements:
            if running_total + placement['duration'] <= max_total_duration:
                trimmed_placements.append(placement)
                running_total += placement['duration']
            else:
                # Try to fit a shorter version
                remaining = max_total_duration - running_total
                if remaining >= 2.0:  # Min 2 seconds
                    placement['duration'] = round(remaining, 2)
                    trimmed_placements.append(placement)
                    break

        dropped_count = len(placements) - len(trimmed_placements)
        if dropped_count > 0:
            warnings.append(
                f"Dropped {dropped_count} B-roll clips to stay under {int(max_percent*100)}% duration limit"
            )

        return trimmed_placements, warnings

    def _prevent_overlaps(self, placements: List[Dict]) -> List[Dict]:
        """
        Ensure B-roll clips don't overlap with each other.
        """
        if len(placements) <= 1:
            return placements

        # Sort by start time
        placements.sort(key=lambda x: x['start_time'])

        non_overlapping = []

        for placement in placements:
            if not non_overlapping:
                non_overlapping.append(placement)
                continue

            last_placement = non_overlapping[-1]
            last_end = last_placement['start_time'] + last_placement['duration']

            # Ensure minimum 2-second gap
            min_start = last_end + 2.0

            if placement['start_time'] >= min_start:
                non_overlapping.append(placement)
            else:
                # Try to shift it later
                new_start = min_start
                placement['start_time'] = new_start
                non_overlapping.append(placement)

        return non_overlapping


# Singleton instance
_broll_placement_ai = None

def get_broll_placement_ai() -> BrollPlacementAI:
    """Get singleton BrollPlacementAI instance."""
    global _broll_placement_ai
    if _broll_placement_ai is None:
        _broll_placement_ai = BrollPlacementAI()
    return _broll_placement_ai
