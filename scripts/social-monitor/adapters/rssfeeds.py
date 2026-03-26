"""Generic RSS adapter for leadership blogs and newsletters."""
import logging
import feedparser
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any
from email.utils import parsedate_to_datetime
import re

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class RSSAdapter(BaseAdapter):
    """Adapter for monitoring leadership RSS feeds (blogs, newsletters, podcasts)."""
    
    # Curated leadership content feeds
    DEFAULT_FEEDS = [
        # Top Leadership Blogs
        {"url": "https://hbr.org/feed", "name": "Harvard Business Review"},
        {"url": "https://www.mckinsey.com/insights/rss", "name": "McKinsey Insights"},
        {"url": "https://feeds.feedburner.com/LeadershipNow", "name": "Leadership Now"},
        {"url": "https://www.leadershipfreak.blog/feed/", "name": "Leadership Freak"},
        {"url": "https://blog.shrm.org/feed", "name": "SHRM Blog"},
        {"url": "https://www.inc.com/rss/", "name": "Inc Magazine"},
        {"url": "https://www.fastcompany.com/rss", "name": "Fast Company"},
        {"url": "https://www.entrepreneur.com/feed", "name": "Entrepreneur"},
        {"url": "https://feeds.feedburner.com/FirstRoundReview", "name": "First Round Review"},
        {"url": "https://a16z.com/feed/", "name": "a16z Blog"},
        
        # Executive Coaching / Development
        {"url": "https://coachfederation.org/blog/feed/", "name": "ICF Blog"},
        {"url": "https://www.ccl.org/feed/", "name": "Center for Creative Leadership"},
        
        # Tech Leadership
        {"url": "https://randsinrepose.com/feed/", "name": "Rands in Repose"},
        {"url": "https://larahogan.me/feed.xml", "name": "Lara Hogan"},
        {"url": "https://charity.wtf/feed/", "name": "Charity Majors"},
        {"url": "https://www.patkua.com/feed/", "name": "Pat Kua"},
        {"url": "https://lethain.com/feeds.xml", "name": "Will Larson"},
    ]
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.feeds = config.get("feeds", self.DEFAULT_FEEDS)
        self.posts_per_feed = config.get("posts_per_feed", 10)
    
    @property
    def platform_name(self) -> str:
        return "rss"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch articles from RSS feeds."""
        if not self.enabled:
            return []
        
        posts = []
        seen_ids = set()
        
        for feed_config in self.feeds:
            try:
                feed_posts = self._fetch_feed(feed_config)
                for post in feed_posts:
                    if post and post.id not in seen_ids:
                        # For curated feeds, include all (they're pre-filtered by source)
                        # But still filter by keywords for broader feeds
                        if self._matches_keywords(post, keywords):
                            seen_ids.add(post.id)
                            posts.append(post)
            except Exception as e:
                logger.debug(f"RSS feed '{feed_config.get('name', feed_config.get('url'))}' error: {e}")
        
        logger.info(f"RSS Feeds: {len(posts)} articles found")
        return posts
    
    def _fetch_feed(self, feed_config: Dict) -> List[Post]:
        """Fetch and parse an RSS feed."""
        posts = []
        url = feed_config.get("url", "")
        name = feed_config.get("name", url)
        
        if not url:
            return posts
        
        try:
            response = requests.get(url, timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (compatible; LeaderReps/1.0)"
            })
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:self.posts_per_feed]:
                post = self._entry_to_post(entry, name)
                if post:
                    posts.append(post)
                    
        except Exception as e:
            logger.debug(f"Feed fetch error for {name}: {e}")
        
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
            elif entry.get("updated"):
                try:
                    created_at = parsedate_to_datetime(entry["updated"])
                except:
                    pass
            
            # Get content summary
            content = ""
            if entry.get("summary"):
                content = re.sub(r'<[^>]+>', '', entry["summary"])[:500]
            elif entry.get("description"):
                content = re.sub(r'<[^>]+>', '', entry["description"])[:500]
            
            return Post(
                id=f"rss_{hash(post_id) % 10**10}",
                platform="rss",
                title=entry.get("title", ""),
                content=content,
                author=entry.get("author", source),
                url=entry.get("link", ""),
                created_at=created_at,
                metadata={
                    "source": source,
                    "tags": [t.get("term", "") for t in entry.get("tags", [])],
                }
            )
        except Exception as e:
            logger.debug(f"Error parsing RSS entry: {e}")
            return None
    
    def _matches_keywords(self, post: Post, keywords: List[str]) -> bool:
        """Check if post matches any keywords (loose match for curated sources)."""
        if not post:
            return False
        # For RSS feeds from leadership sources, be more permissive
        # Include if it has ANY leadership-adjacent content
        text = f"{post.title} {post.content}".lower()
        
        # Always include from curated sources with these terms
        leadership_terms = [
            "leader", "manage", "team", "feedback", "coach", "mentor",
            "executive", "ceo", "culture", "hire", "fire", "performance",
            "communication", "conflict", "motivation", "vision", "strategy"
        ]
        
        # Check for keyword matches OR general leadership content
        has_keyword = any(kw.lower() in text for kw in keywords)
        has_leadership_term = any(term in text for term in leadership_terms)
        
        return has_keyword or has_leadership_term
