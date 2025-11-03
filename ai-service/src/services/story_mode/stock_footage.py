# src/services/story_mode/stock_footage.py

import os
import logging
import requests
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class StockFootageSearcher:
    """
    Production-grade stock footage search service.

    Integrates with Pexels and Pixabay APIs to search for B-roll footage.

    Features:
    - Multi-provider search (Pexels + Pixabay)
    - Result caching (24-hour TTL)
    - Relevance scoring
    - Orientation filtering
    - Duration filtering
    - Rate limit handling
    """

    def __init__(self):
        self.pexels_api_key = os.environ.get("PEXELS_API_KEY", "")
        self.pixabay_api_key = os.environ.get("PIXABAY_API_KEY", "")
        self._cache = {}  # Simple in-memory cache
        self._cache_ttl = 86400  # 24 hours
        logger.info("StockFootageSearcher initialized")

    def search(
        self,
        query: str,
        provider: str = "both",
        max_results: int = 10,
        orientation: str = "all",
        min_duration: int = 0,
        max_duration: int = 0
    ) -> Dict[str, Any]:
        """
        Search for stock footage across providers.

        Args:
            query: Search query (keywords)
            provider: "pexels", "pixabay", or "both"
            max_results: Maximum results per provider
            orientation: "landscape", "portrait", "square", or "all"
            min_duration: Minimum video duration in seconds
            max_duration: Maximum video duration in seconds

        Returns:
            {
                "results": List[StockFootageItem],
                "total_results": int,
                "query": str,
                "search_time": float
            }
        """
        start_time = time.time()
        logger.info(f"Searching stock footage: '{query}' - provider: {provider}")

        # Check cache
        cache_key = f"{query}_{provider}_{max_results}_{orientation}_{min_duration}_{max_duration}"
        if cache_key in self._cache:
            cached_result, cached_time = self._cache[cache_key]
            if time.time() - cached_time < self._cache_ttl:
                logger.info(f"Cache hit for query: {query}")
                return cached_result

        all_results = []

        # Search Pexels
        if provider in ["pexels", "both"] and self.pexels_api_key:
            pexels_results = self._search_pexels(
                query=query,
                max_results=max_results,
                orientation=orientation,
                min_duration=min_duration,
                max_duration=max_duration
            )
            all_results.extend(pexels_results)

        # Search Pixabay
        if provider in ["pixabay", "both"] and self.pixabay_api_key:
            pixabay_results = self._search_pixabay(
                query=query,
                max_results=max_results,
                orientation=orientation,
                min_duration=min_duration,
                max_duration=max_duration
            )
            all_results.extend(pixabay_results)

        # Sort by relevance score
        all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        # Limit total results
        if len(all_results) > max_results * 2:
            all_results = all_results[:max_results * 2]

        search_time = time.time() - start_time

        result = {
            "results": all_results,
            "total_results": len(all_results),
            "query": query,
            "search_time": search_time
        }

        # Cache result
        self._cache[cache_key] = (result, time.time())

        logger.info(f"Stock footage search completed: {len(all_results)} results in {search_time:.2f}s")
        return result

    def _search_pexels(
        self,
        query: str,
        max_results: int,
        orientation: str,
        min_duration: int,
        max_duration: int
    ) -> List[Dict[str, Any]]:
        """Search Pexels API for stock videos."""
        try:
            url = "https://api.pexels.com/videos/search"

            headers = {
                "Authorization": self.pexels_api_key
            }

            params = {
                "query": query,
                "per_page": min(max_results, 80),  # Pexels max is 80
                "page": 1
            }

            # Add orientation filter if specified
            if orientation != "all":
                params["orientation"] = orientation

            response = requests.get(url, headers=headers, params=params, timeout=10)

            if response.status_code == 429:
                logger.warning("Pexels API rate limit exceeded")
                return []

            if response.status_code != 200:
                logger.error(f"Pexels API error: {response.status_code}")
                return []

            data = response.json()
            videos = data.get("videos", [])

            results = []
            for video in videos:
                # Get HD video file
                video_files = video.get("video_files", [])
                hd_file = None
                sd_file = None

                for file in video_files:
                    quality = file.get("quality", "")
                    if quality == "hd":
                        hd_file = file
                    elif quality == "sd":
                        sd_file = file

                if not hd_file and not sd_file:
                    continue

                duration = video.get("duration", 0)

                # Apply duration filters
                if min_duration > 0 and duration < min_duration:
                    continue
                if max_duration > 0 and duration > max_duration:
                    continue

                # Build result item
                item = {
                    "id": str(video.get("id", "")),
                    "provider": "pexels",
                    "preview_url": video.get("image", ""),
                    "video_url": hd_file.get("link", "") if hd_file else sd_file.get("link", ""),
                    "video_url_sd": sd_file.get("link", "") if sd_file else "",
                    "width": video.get("width", 1920),
                    "height": video.get("height", 1080),
                    "duration": duration,
                    "photographer": video.get("user", {}).get("name", "Unknown"),
                    "photographer_url": video.get("user", {}).get("url", ""),
                    "tags": [],  # Pexels doesn't provide tags in API
                    "relevance_score": self._calculate_relevance(query, video)
                }

                results.append(item)

            logger.info(f"Pexels search returned {len(results)} results")
            return results

        except requests.exceptions.Timeout:
            logger.error("Pexels API request timed out")
            return []
        except Exception as e:
            logger.error(f"Pexels search error: {str(e)}")
            return []

    def _search_pixabay(
        self,
        query: str,
        max_results: int,
        orientation: str,
        min_duration: int,
        max_duration: int
    ) -> List[Dict[str, Any]]:
        """Search Pixabay API for stock videos."""
        try:
            url = "https://pixabay.com/api/videos/"

            params = {
                "key": self.pixabay_api_key,
                "q": query,
                "per_page": min(max_results, 200),  # Pixabay max is 200
                "page": 1
            }

            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 429:
                logger.warning("Pixabay API rate limit exceeded")
                return []

            if response.status_code != 200:
                logger.error(f"Pixabay API error: {response.status_code}")
                return []

            data = response.json()
            videos = data.get("hits", [])

            results = []
            for video in videos:
                # Get video files
                video_files = video.get("videos", {})
                large_file = video_files.get("large", {})
                medium_file = video_files.get("medium", {})

                if not large_file and not medium_file:
                    continue

                duration = video.get("duration", 0)

                # Apply duration filters
                if min_duration > 0 and duration < min_duration:
                    continue
                if max_duration > 0 and duration > max_duration:
                    continue

                # Apply orientation filter
                video_width = large_file.get("width", 1920) if large_file else medium_file.get("width", 1280)
                video_height = large_file.get("height", 1080) if large_file else medium_file.get("height", 720)

                if orientation != "all":
                    if orientation == "landscape" and video_width <= video_height:
                        continue
                    elif orientation == "portrait" and video_height <= video_width:
                        continue
                    elif orientation == "square" and abs(video_width - video_height) > 100:
                        continue

                # Build result item
                item = {
                    "id": str(video.get("id", "")),
                    "provider": "pixabay",
                    "preview_url": video.get("userImageURL", ""),
                    "video_url": large_file.get("url", "") if large_file else medium_file.get("url", ""),
                    "video_url_sd": medium_file.get("url", "") if medium_file else "",
                    "width": video_width,
                    "height": video_height,
                    "duration": duration,
                    "photographer": video.get("user", "Unknown"),
                    "photographer_url": f"https://pixabay.com/users/{video.get('user_id', '')}/",
                    "tags": video.get("tags", "").split(", "),
                    "relevance_score": self._calculate_relevance(query, video)
                }

                results.append(item)

            logger.info(f"Pixabay search returned {len(results)} results")
            return results

        except requests.exceptions.Timeout:
            logger.error("Pixabay API request timed out")
            return []
        except Exception as e:
            logger.error(f"Pixabay search error: {str(e)}")
            return []

    def _calculate_relevance(self, query: str, video: Dict[str, Any]) -> float:
        """
        Calculate relevance score for a video based on query match.

        Simple scoring:
        - Title/tags match: 1.0
        - Partial match: 0.5-0.8
        - No match: 0.3 (base score)
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())

        score = 0.3  # Base score

        # Check tags (Pixabay provides tags)
        tags = video.get("tags", "")
        if isinstance(tags, str):
            tags_lower = tags.lower()
            # Exact query match in tags
            if query_lower in tags_lower:
                score += 0.5

            # Individual word matches
            tag_words = set(tags_lower.split())
            matching_words = query_words.intersection(tag_words)
            if matching_words:
                score += 0.2 * (len(matching_words) / len(query_words))

        # Boost popular videos (higher views/likes)
        views = video.get("views", 0)
        likes = video.get("likes", 0)

        if views > 10000:
            score += 0.1
        if likes > 100:
            score += 0.1

        # Cap at 1.0
        return min(score, 1.0)
