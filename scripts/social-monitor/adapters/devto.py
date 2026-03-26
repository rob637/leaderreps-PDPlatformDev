"""Dev.to adapter using their free public API."""
import logging
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class DevToAdapter(BaseAdapter):
    """Adapter for Dev.to using their public API."""
    
    API_URL = "https://dev.to/api/articles"
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.per_page = config.get("per_page", 30)
        # Tags to search (leadership-adjacent in tech)
        self.tags = config.get("tags", [
            "leadership",
            "management", 
            "career",
            "softskills",
            "teamwork",
            "productivity",
            "mentorship",
            "culture",
        ])
    
    @property
    def platform_name(self) -> str:
        return "devto"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch articles from Dev.to."""
        if not self.enabled:
            return []
        
        posts = []
        seen_ids = set()
        
        # Search by tags
        for tag in self.tags:
            try:
                tag_posts = self._fetch_by_tag(tag)
                for post in tag_posts:
                    if post.id not in seen_ids and self._matches_keywords(post, keywords):
                        seen_ids.add(post.id)
                        posts.append(post)
            except Exception as e:
                logger.debug(f"Dev.to tag '{tag}' error: {e}")
        
        # Also search latest articles matching keywords
        try:
            latest = self._fetch_latest()
            for post in latest:
                if post.id not in seen_ids and self._matches_keywords(post, keywords):
                    seen_ids.add(post.id)
                    posts.append(post)
        except Exception as e:
            logger.debug(f"Dev.to latest error: {e}")
        
        logger.info(f"Dev.to: {len(posts)} articles found")
        return posts
    
    def _fetch_by_tag(self, tag: str) -> List[Post]:
        """Fetch articles by tag."""
        params = {
            "tag": tag,
            "per_page": self.per_page,
            "state": "rising",  # Get newer content
        }
        
        response = requests.get(self.API_URL, params=params, timeout=10)
        response.raise_for_status()
        
        return [self._article_to_post(a) for a in response.json() if a]
    
    def _fetch_latest(self) -> List[Post]:
        """Fetch latest articles."""
        params = {
            "per_page": self.per_page,
            "state": "fresh",
        }
        
        response = requests.get(self.API_URL, params=params, timeout=10)
        response.raise_for_status()
        
        return [self._article_to_post(a) for a in response.json() if a]
    
    def _article_to_post(self, article: Dict) -> Post:
        """Convert Dev.to article to Post object."""
        try:
            # Parse date
            created_at = datetime.now(timezone.utc)
            if article.get("published_at"):
                created_at = datetime.fromisoformat(
                    article["published_at"].replace("Z", "+00:00")
                )
            
            return Post(
                id=f"devto_{article['id']}",
                platform="devto",
                title=article.get("title", ""),
                content=article.get("description", ""),
                author=article.get("user", {}).get("username", "unknown"),
                url=article.get("url", ""),
                created_at=created_at,
                metadata={
                    "tags": article.get("tag_list", []),
                    "reactions": article.get("public_reactions_count", 0),
                    "comments": article.get("comments_count", 0),
                    "reading_time": article.get("reading_time_minutes", 0),
                }
            )
        except Exception as e:
            logger.debug(f"Error parsing Dev.to article: {e}")
            return None
    
    def _matches_keywords(self, post: Post, keywords: List[str]) -> bool:
        """Check if post matches any keywords."""
        if not post:
            return False
        text = f"{post.title} {post.content}".lower()
        tags = " ".join(post.metadata.get("tags", [])).lower()
        combined = f"{text} {tags}"
        return any(kw.lower() in combined for kw in keywords)
