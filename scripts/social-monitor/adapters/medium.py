"""Medium adapter using RSS feeds from leadership publications."""
import logging
import feedparser
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any
from email.utils import parsedate_to_datetime

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class MediumAdapter(BaseAdapter):
    """Adapter for Medium publications via RSS feeds."""
    
    # Leadership-focused Medium publications with RSS feeds
    DEFAULT_PUBLICATIONS = [
        # Top leadership publications
        "better-programming",      # Tech leadership
        "the-ascent",              # Personal growth/leadership
        "swlh",                    # Startups/leadership
        "personal-growth",         # Leadership skills
        "inc-magazine",            # Business leadership
        "entrepreneur",            # Entrepreneurship
        "leadership-prevails",     # Direct leadership content
        "management-matters",      # Management insights
        "the-helm",                # Leadership stories
        "high-growth-handbook",    # Scaling leadership
    ]
    
    FEED_URL = "https://medium.com/feed/{publication}"
    TAG_FEED_URL = "https://medium.com/feed/tag/{tag}"
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.publications = config.get("publications", self.DEFAULT_PUBLICATIONS)
        self.tags = config.get("tags", ["leadership", "management", "executive-coaching"])
        self.include_tags = config.get("include_tags", True)
    
    @property
    def platform_name(self) -> str:
        return "medium"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch articles from Medium publications and tags."""
        if not self.enabled:
            return []
        
        posts = []
        seen_ids = set()
        
        # Fetch from publications
        for pub in self.publications:
            try:
                feed_posts = self._fetch_feed(self.FEED_URL.format(publication=pub), pub)
                for post in feed_posts:
                    if post.id not in seen_ids and self._matches_keywords(post, keywords):
                        seen_ids.add(post.id)
                        posts.append(post)
            except Exception as e:
                logger.debug(f"Medium pub '{pub}' error: {e}")
        
        # Fetch from tags
        if self.include_tags:
            for tag in self.tags:
                try:
                    feed_posts = self._fetch_feed(self.TAG_FEED_URL.format(tag=tag), f"tag:{tag}")
                    for post in feed_posts:
                        if post.id not in seen_ids:
                            seen_ids.add(post.id)
                            posts.append(post)
                except Exception as e:
                    logger.debug(f"Medium tag '{tag}' error: {e}")
        
        logger.info(f"Medium: {len(posts)} articles found")
        return posts
    
    def _fetch_feed(self, url: str, source: str) -> List[Post]:
        """Fetch and parse an RSS feed."""
        posts = []
        
        try:
            response = requests.get(url, timeout=10, headers={
                "User-Agent": "Mozilla/5.0 (compatible; LeaderReps/1.0)"
            })
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:20]:  # Limit per feed
                post = self._entry_to_post(entry, source)
                if post:
                    posts.append(post)
                    
        except Exception as e:
            logger.debug(f"Feed fetch error for {url}: {e}")
        
        return posts
    
    def _entry_to_post(self, entry: Dict, source: str) -> Post:
        """Convert RSS entry to Post object."""
        try:
            # Get unique ID
            post_id = entry.get("id", entry.get("link", ""))
            if not post_id:
                return None
            
            # Parse date
            created_at = datetime.now(timezone.utc)
            if entry.get("published"):
                try:
                    created_at = parsedate_to_datetime(entry["published"])
                except:
                    pass
            
            # Get content summary
            content = ""
            if entry.get("summary"):
                # Strip HTML tags roughly
                import re
                content = re.sub(r'<[^>]+>', '', entry["summary"])[:500]
            
            return Post(
                id=f"medium_{hash(post_id) % 10**10}",
                platform="medium",
                title=entry.get("title", ""),
                content=content,
                author=entry.get("author", "Unknown"),
                url=entry.get("link", ""),
                created_at=created_at,
                metadata={
                    "source": source,
                    "tags": [t.get("term", "") for t in entry.get("tags", [])],
                }
            )
        except Exception as e:
            logger.debug(f"Error parsing Medium entry: {e}")
            return None
    
    def _matches_keywords(self, post: Post, keywords: List[str]) -> bool:
        """Check if post matches any keywords."""
        text = f"{post.title} {post.content}".lower()
        return any(kw.lower() in text for kw in keywords)
