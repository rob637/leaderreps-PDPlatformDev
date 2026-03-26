"""Indie Hackers adapter - startup/business leadership discussions."""
import logging
import feedparser
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any
from email.utils import parsedate_to_datetime
import re

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class IndieHackersAdapter(BaseAdapter):
    """Adapter for Indie Hackers forum and posts."""
    
    # IH has RSS feeds for different categories
    FEED_URL = "https://www.indiehackers.com/feed.xml"
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.posts_limit = config.get("posts_limit", 50)
    
    @property
    def platform_name(self) -> str:
        return "indiehackers"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch posts from Indie Hackers."""
        if not self.enabled:
            return []
        
        posts = []
        
        try:
            response = requests.get(self.FEED_URL, timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (compatible; LeaderReps/1.0)"
            })
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:self.posts_limit]:
                post = self._entry_to_post(entry)
                if post and self._matches_keywords(post, keywords):
                    posts.append(post)
                    
        except Exception as e:
            logger.debug(f"Indie Hackers fetch error: {e}")
        
        logger.info(f"Indie Hackers: {len(posts)} posts found")
        return posts
    
    def _entry_to_post(self, entry: Dict) -> Post:
        """Convert RSS entry to Post object."""
        try:
            post_id = entry.get("id", entry.get("link", ""))
            if not post_id:
                return None
            
            created_at = datetime.now(timezone.utc)
            if entry.get("published"):
                try:
                    created_at = parsedate_to_datetime(entry["published"])
                except:
                    pass
            
            content = ""
            if entry.get("summary"):
                content = re.sub(r'<[^>]+>', '', entry["summary"])[:500]
            
            return Post(
                id=f"ih_{hash(post_id) % 10**10}",
                platform="indiehackers",
                title=entry.get("title", ""),
                content=content,
                author=entry.get("author", "Unknown"),
                url=entry.get("link", ""),
                created_at=created_at,
                metadata={}
            )
        except Exception as e:
            logger.debug(f"Error parsing IH entry: {e}")
            return None
    
    def _matches_keywords(self, post: Post, keywords: List[str]) -> bool:
        """Check if post matches keywords."""
        if not post:
            return False
        text = f"{post.title} {post.content}".lower()
        return any(kw.lower() in text for kw in keywords)
