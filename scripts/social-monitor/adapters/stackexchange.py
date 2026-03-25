"""Stack Exchange adapter for Workplace and related sites."""
import logging
import requests
from datetime import datetime, timezone
from typing import List, Dict, Any

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class StackExchangeAdapter(BaseAdapter):
    """Adapter for Stack Exchange sites (Workplace, PM, etc.)."""
    
    API_URL = "https://api.stackexchange.com/2.3/questions"
    
    # Leadership-relevant Stack Exchange sites
    DEFAULT_SITES = [
        "workplace",           # Primary - workplace issues, management
        "pm",                  # Project Management
        "softwareengineering", # Tech leadership
    ]
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.sites = config.get("sites", self.DEFAULT_SITES)
        self.pagesize = config.get("pagesize", 30)
        self.api_key = config.get("api_key", "")  # Optional, increases quota
        
        # Leadership-relevant tags to monitor
        self.tags = config.get("tags", [
            "management",
            "leadership",
            "team",
            "communication",
            "feedback",
            "career-development",
            "promotion",
            "manager",
        ])
    
    @property
    def platform_name(self) -> str:
        return "stackexchange"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """Fetch questions from Stack Exchange sites."""
        if not self.enabled:
            return []
        
        posts = []
        seen_ids = set()
        
        for site in self.sites:
            # Fetch by tags (more targeted)
            for tag in self.tags:
                try:
                    tag_posts = self._fetch_by_tag(site, tag)
                    for post in tag_posts:
                        if post and post.id not in seen_ids:
                            seen_ids.add(post.id)
                            posts.append(post)
                except Exception as e:
                    logger.debug(f"SE {site}/{tag} error: {e}")
            
            # Also fetch newest questions and filter by keywords
            try:
                newest = self._fetch_newest(site)
                for post in newest:
                    if post and post.id not in seen_ids and self._matches_keywords(post, keywords):
                        seen_ids.add(post.id)
                        posts.append(post)
            except Exception as e:
                logger.debug(f"SE {site} newest error: {e}")
        
        logger.info(f"Stack Exchange: {len(posts)} questions found")
        return posts
    
    def _fetch_by_tag(self, site: str, tag: str) -> List[Post]:
        """Fetch questions by tag."""
        params = {
            "site": site,
            "tagged": tag,
            "sort": "creation",
            "order": "desc",
            "pagesize": self.pagesize,
            "filter": "withbody",  # Include question body
        }
        if self.api_key:
            params["key"] = self.api_key
        
        response = requests.get(self.API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return [self._question_to_post(q, site) for q in data.get("items", [])]
    
    def _fetch_newest(self, site: str) -> List[Post]:
        """Fetch newest questions."""
        params = {
            "site": site,
            "sort": "creation",
            "order": "desc",
            "pagesize": self.pagesize,
            "filter": "withbody",
        }
        if self.api_key:
            params["key"] = self.api_key
        
        response = requests.get(self.API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return [self._question_to_post(q, site) for q in data.get("items", [])]
    
    def _question_to_post(self, question: Dict, site: str) -> Post:
        """Convert SE question to Post object."""
        try:
            # Parse date
            created_at = datetime.fromtimestamp(
                question.get("creation_date", 0), 
                tz=timezone.utc
            )
            
            # Clean up body (remove HTML)
            import re
            body = question.get("body", "")
            body = re.sub(r'<[^>]+>', '', body)[:500]
            
            return Post(
                id=f"se_{site}_{question['question_id']}",
                platform="stackexchange",
                title=question.get("title", ""),
                content=body,
                author=question.get("owner", {}).get("display_name", "Unknown"),
                url=question.get("link", ""),
                created_at=created_at,
                metadata={
                    "site": site,
                    "tags": question.get("tags", []),
                    "score": question.get("score", 0),
                    "answer_count": question.get("answer_count", 0),
                    "view_count": question.get("view_count", 0),
                    "is_answered": question.get("is_answered", False),
                }
            )
        except Exception as e:
            logger.debug(f"Error parsing SE question: {e}")
            return None
    
    def _matches_keywords(self, post: Post, keywords: List[str]) -> bool:
        """Check if post matches any keywords."""
        if not post:
            return False
        text = f"{post.title} {post.content}".lower()
        tags = " ".join(post.metadata.get("tags", [])).lower()
        combined = f"{text} {tags}"
        return any(kw.lower() in combined for kw in keywords)
