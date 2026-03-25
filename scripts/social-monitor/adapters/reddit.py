"""Reddit adapter using RSS feeds (no API key required)."""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from time import mktime

import feedparser

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class RedditAdapter(BaseAdapter):
    """
    Reddit adapter using RSS feeds.
    
    Reddit provides RSS feeds for subreddits at:
    - https://www.reddit.com/r/{subreddit}/new/.rss
    - https://www.reddit.com/r/{subreddit}/hot/.rss
    
    No API key required!
    """
    
    RSS_BASE_URL = "https://www.reddit.com/r/{subreddit}/{feed_type}/.rss"
    
    @property
    def platform_name(self) -> str:
        return "reddit"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """
        Fetch posts from configured subreddits via RSS.
        
        Args:
            keywords: Keywords for filtering (filtering done after fetch)
        
        Returns:
            List of Post objects matching keywords
        """
        if not self.is_enabled():
            logger.info("Reddit adapter is disabled")
            return []
        
        subreddits = self.config.get("subreddits", [])
        feed_type = self.config.get("feed_type", "new")
        posts_per_sub = self.config.get("posts_per_subreddit", 25)
        
        all_posts = []
        
        for subreddit in subreddits:
            try:
                posts = self._fetch_subreddit(subreddit, feed_type, posts_per_sub)
                all_posts.extend(posts)
                logger.debug(f"Fetched {len(posts)} posts from r/{subreddit}")
            except Exception as e:
                logger.error(f"Error fetching r/{subreddit}: {e}")
        
        # Filter by keywords
        matched = self.filter_by_keywords(all_posts, keywords)
        logger.info(f"Reddit: {len(matched)} posts matched keywords out of {len(all_posts)} total")
        
        return matched
    
    def _fetch_subreddit(
        self, 
        subreddit: str, 
        feed_type: str, 
        limit: int
    ) -> List[Post]:
        """
        Fetch posts from a single subreddit.
        
        Args:
            subreddit: Subreddit name (without /r/)
            feed_type: 'new' or 'hot'
            limit: Maximum posts to return
        
        Returns:
            List of Post objects
        """
        url = self.RSS_BASE_URL.format(subreddit=subreddit, feed_type=feed_type)
        
        # feedparser handles the HTTP request
        feed = feedparser.parse(url)
        
        if feed.bozo:
            # bozo flag indicates parsing issues
            logger.warning(f"Feed parsing issue for r/{subreddit}: {feed.bozo_exception}")
        
        posts = []
        
        for entry in feed.entries[:limit]:
            try:
                post = self._parse_entry(entry, subreddit)
                posts.append(post)
            except Exception as e:
                logger.error(f"Error parsing entry from r/{subreddit}: {e}")
        
        return posts
    
    def _parse_entry(self, entry: Dict[str, Any], subreddit: str) -> Post:
        """
        Parse an RSS feed entry into a Post object.
        
        Args:
            entry: feedparser entry object
            subreddit: Source subreddit name
        
        Returns:
            Post object
        """
        # Extract post ID from the entry id (usually the permalink)
        post_id = entry.get("id", entry.get("link", ""))
        
        # Create unique ID combining platform and post ID
        unique_id = f"reddit:{post_id}"
        
        # Get timestamp
        created_at = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            created_at = datetime.fromtimestamp(
                mktime(entry.published_parsed), 
                tz=timezone.utc
            )
        elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
            created_at = datetime.fromtimestamp(
                mktime(entry.updated_parsed),
                tz=timezone.utc
            )
        
        # Extract title
        title = entry.get("title", "")
        
        # Extract content - Reddit RSS includes HTML content
        content = ""
        if hasattr(entry, "content") and entry.content:
            content = entry.content[0].get("value", "")
        elif hasattr(entry, "summary"):
            content = entry.summary
        
        # Clean HTML from content (basic cleanup)
        content = self._strip_html(content)
        
        # Get author
        author = entry.get("author", "")
        if author.startswith("/u/"):
            author = author[3:]
        
        author_url = f"https://www.reddit.com/u/{author}" if author else None
        
        # Get post URL
        url = entry.get("link", "")
        
        return Post(
            id=unique_id,
            platform="reddit",
            title=title,
            content=content,
            author=author,
            author_url=author_url,
            url=url,
            created_at=created_at,
            subreddit=subreddit,
            metadata={
                "feed_entry_id": entry.get("id", ""),
            }
        )
    
    def _strip_html(self, text: str) -> str:
        """
        Remove HTML tags from text (basic implementation).
        
        Args:
            text: HTML text
        
        Returns:
            Plain text
        """
        import re
        
        # Remove HTML tags
        clean = re.sub(r'<[^>]+>', '', text)
        
        # Decode common HTML entities
        clean = clean.replace("&amp;", "&")
        clean = clean.replace("&lt;", "<")
        clean = clean.replace("&gt;", ">")
        clean = clean.replace("&quot;", '"')
        clean = clean.replace("&#39;", "'")
        clean = clean.replace("&nbsp;", " ")
        
        # Normalize whitespace
        clean = re.sub(r'\s+', ' ', clean).strip()
        
        return clean
