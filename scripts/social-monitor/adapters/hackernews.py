"""Hacker News adapter using free Algolia API."""
import logging
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class HackerNewsAdapter(BaseAdapter):
    """Adapter for Hacker News using Algolia search API."""
    
    SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date"
    ITEM_URL = "https://news.ycombinator.com/item?id={}"
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.search_types = config.get("search_types", ["story", "comment"])
        self.results_per_search = config.get("results_per_search", 50)
    
    @property
    def platform_name(self) -> str:
        return "hackernews"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch matching posts from Hacker News."""
        if not self.enabled:
            return []
        
        posts = []
        seen_ids = set()
        
        # Search for each keyword
        for keyword in keywords:
            try:
                for search_type in self.search_types:
                    results = self._search(keyword, search_type)
                    for item in results:
                        post = self._item_to_post(item, keyword)
                        if post and post.id not in seen_ids:
                            seen_ids.add(post.id)
                            posts.append(post)
            except Exception as e:
                logger.error(f"HN search error for '{keyword}': {e}")
        
        logger.info(f"Hacker News: {len(posts)} posts found")
        return posts
    
    def _search(self, query: str, tags: str) -> List[Dict]:
        """Search HN using Algolia API."""
        params = {
            "query": query,
            "tags": tags,
            "hitsPerPage": self.results_per_search,
        }
        
        response = requests.get(self.SEARCH_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("hits", [])
    
    def _item_to_post(self, item: Dict, matched_keyword: str) -> Post:
        """Convert HN item to Post object."""
        try:
            item_id = str(item.get("objectID", ""))
            if not item_id:
                return None
            
            # Determine if story or comment
            is_comment = item.get("_tags", []) and "comment" in item.get("_tags", [])
            
            if is_comment:
                title = f"Comment on: {item.get('story_title', 'Unknown')}"
                content = item.get("comment_text", "")
            else:
                title = item.get("title", "")
                content = item.get("story_text", "") or ""
            
            # Parse timestamp
            created_at = datetime.now(timezone.utc)
            if item.get("created_at_i"):
                created_at = datetime.fromtimestamp(item["created_at_i"], tz=timezone.utc)
            
            return Post(
                id=f"hn_{item_id}",
                platform="hackernews",
                title=title,
                content=content,
                author=item.get("author", "unknown"),
                url=self.ITEM_URL.format(item_id),
                created_at=created_at,
                metadata={
                    "points": item.get("points"),
                    "num_comments": item.get("num_comments"),
                    "is_comment": is_comment,
                    "story_id": item.get("story_id"),
                    "matched_keyword": matched_keyword,
                }
            )
        except Exception as e:
            logger.error(f"Error parsing HN item: {e}")
            return None
