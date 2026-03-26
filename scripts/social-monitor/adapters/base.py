"""Base adapter class for social media platforms."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any


@dataclass
class Post:
    """Represents a social media post from any platform."""
    
    # Unique identifier for deduplication
    id: str
    
    # Platform source (reddit, twitter, discord)
    platform: str
    
    # Post content
    title: str
    content: str
    
    # Author info
    author: str
    author_url: Optional[str] = None
    
    # Post metadata
    url: str = ""
    created_at: Optional[datetime] = None
    
    # Platform-specific context
    subreddit: Optional[str] = None  # Reddit
    channel: Optional[str] = None    # Discord
    hashtags: List[str] = field(default_factory=list)  # Twitter
    
    # Matching info
    matched_keywords: List[str] = field(default_factory=list)
    
    # Extra metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        if not isinstance(other, Post):
            return False
        return self.id == other.id
    
    @property
    def full_text(self) -> str:
        """Returns combined title and content for keyword matching."""
        parts = []
        if self.title:
            parts.append(self.title)
        if self.content:
            parts.append(self.content)
        return "\n\n".join(parts)
    
    @property
    def display_text(self) -> str:
        """Returns a formatted display text for notifications."""
        text = ""
        if self.title:
            text += f"**{self.title}**\n\n"
        if self.content:
            # Truncate long content
            content = self.content[:500]
            if len(self.content) > 500:
                content += "..."
            text += content
        return text
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "platform": self.platform,
            "title": self.title,
            "content": self.content,
            "author": self.author,
            "author_url": self.author_url,
            "url": self.url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "subreddit": self.subreddit,
            "channel": self.channel,
            "hashtags": self.hashtags,
            "matched_keywords": self.matched_keywords,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Post":
        """Create from dictionary."""
        created_at = None
        if data.get("created_at"):
            created_at = datetime.fromisoformat(data["created_at"])
        
        return cls(
            id=data["id"],
            platform=data["platform"],
            title=data.get("title", ""),
            content=data.get("content", ""),
            author=data.get("author", ""),
            author_url=data.get("author_url"),
            url=data.get("url", ""),
            created_at=created_at,
            subreddit=data.get("subreddit"),
            channel=data.get("channel"),
            hashtags=data.get("hashtags", []),
            matched_keywords=data.get("matched_keywords", []),
            metadata=data.get("metadata", {}),
        )


class BaseAdapter(ABC):
    """Base class for platform adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the adapter with platform-specific config.
        
        Args:
            config: Platform configuration from config.yaml
        """
        self.config = config
        self.enabled = config.get("enabled", True)
    
    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Return the platform name (e.g., 'reddit', 'twitter')."""
        pass
    
    @abstractmethod
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """
        Fetch recent posts from the platform.
        
        Args:
            keywords: List of keywords to filter by (can be used for API queries)
        
        Returns:
            List of Post objects
        """
        pass
    
    def filter_by_keywords(self, posts: List[Post], keywords: List[str]) -> List[Post]:
        """
        Filter posts by matching keywords in their content.
        
        Args:
            posts: List of posts to filter
            keywords: List of keywords to match
        
        Returns:
            List of posts that match at least one keyword
        """
        filtered = []
        keywords_lower = [kw.lower() for kw in keywords]
        
        for post in posts:
            text = post.full_text.lower()
            matched = []
            
            for kw, kw_lower in zip(keywords, keywords_lower):
                if kw_lower in text:
                    matched.append(kw)
            
            if matched:
                post.matched_keywords = matched
                filtered.append(post)
        
        return filtered
    
    def is_enabled(self) -> bool:
        """Check if this adapter is enabled in config."""
        return self.enabled
