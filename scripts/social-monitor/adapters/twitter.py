"""Twitter/X adapter using the API v2."""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class TwitterAdapter(BaseAdapter):
    """
    Twitter/X adapter using the official API v2.
    
    Requires API credentials (Bearer token for search).
    """
    
    @property
    def platform_name(self) -> str:
        return "twitter"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """
        Fetch tweets matching configured searches.
        
        Args:
            keywords: Keywords for search queries
        
        Returns:
            List of Post objects
        """
        if not self.is_enabled():
            logger.info("Twitter adapter is disabled")
            return []
        
        # Check for API credentials
        api_keys = self._get_api_keys()
        if not api_keys.get("bearer_token"):
            logger.warning("Twitter: No bearer token configured, skipping")
            return []
        
        try:
            import tweepy
        except ImportError:
            logger.error("Twitter: tweepy not installed, run: pip install tweepy")
            return []
        
        all_tweets = []
        
        try:
            client = tweepy.Client(bearer_token=api_keys["bearer_token"])
            
            # Search using configured queries
            search_queries = self.config.get("search_queries", [])
            max_results = self.config.get("max_results", 50)
            
            for query in search_queries:
                try:
                    tweets = self._search_tweets(client, query, max_results)
                    all_tweets.extend(tweets)
                except Exception as e:
                    logger.error(f"Twitter search error for '{query}': {e}")
            
            # Also search for keywords directly if no queries configured
            if not search_queries and keywords:
                # Build a query from keywords
                kw_query = " OR ".join([f'"{kw}"' for kw in keywords[:5]])  # Twitter has query limits
                kw_query += " -is:retweet lang:en"
                
                try:
                    tweets = self._search_tweets(client, kw_query, max_results)
                    all_tweets.extend(tweets)
                except Exception as e:
                    logger.error(f"Twitter keyword search error: {e}")
            
        except Exception as e:
            logger.error(f"Twitter client error: {e}")
            return []
        
        # Deduplicate by ID
        seen_ids = set()
        unique_tweets = []
        for tweet in all_tweets:
            if tweet.id not in seen_ids:
                seen_ids.add(tweet.id)
                unique_tweets.append(tweet)
        
        # Filter by keywords if not already searched
        if search_queries:
            matched = self.filter_by_keywords(unique_tweets, keywords)
        else:
            matched = unique_tweets
            # Mark all keywords as matched since we searched for them
            for tweet in matched:
                tweet.matched_keywords = keywords[:5]
        
        logger.info(f"Twitter: {len(matched)} tweets matched")
        
        return matched
    
    def _get_api_keys(self) -> Dict[str, str]:
        """Get Twitter API credentials from config."""
        # Check both twitter config section and parent api_keys section
        twitter_config = self.config.get("api_keys", {})
        if not twitter_config:
            # Try to get from parent config (passed from main config)
            twitter_config = self.config
        return twitter_config
    
    def _search_tweets(
        self, 
        client: Any, 
        query: str, 
        max_results: int
    ) -> List[Post]:
        """
        Search for tweets using Twitter API v2.
        
        Args:
            client: Tweepy Client instance
            query: Twitter search query
            max_results: Maximum results to return
        
        Returns:
            List of Post objects
        """
        # Note: max_results must be between 10-100 for recent search
        max_results = min(max(max_results, 10), 100)
        
        response = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            tweet_fields=["created_at", "author_id", "entities", "public_metrics"],
            user_fields=["username", "name"],
            expansions=["author_id"]
        )
        
        if not response.data:
            return []
        
        # Build user lookup
        users = {}
        if response.includes and "users" in response.includes:
            for user in response.includes["users"]:
                users[user.id] = {
                    "username": user.username,
                    "name": user.name
                }
        
        posts = []
        
        for tweet in response.data:
            try:
                post = self._parse_tweet(tweet, users)
                posts.append(post)
            except Exception as e:
                logger.error(f"Error parsing tweet {tweet.id}: {e}")
        
        return posts
    
    def _parse_tweet(self, tweet: Any, users: Dict[str, Dict]) -> Post:
        """
        Parse a Tweepy tweet into a Post object.
        
        Args:
            tweet: Tweepy Tweet object
            users: Dictionary of user info by ID
        
        Returns:
            Post object
        """
        unique_id = f"twitter:{tweet.id}"
        
        # Get author info
        author_info = users.get(tweet.author_id, {})
        username = author_info.get("username", "")
        author_name = author_info.get("name", username)
        
        author_url = f"https://twitter.com/{username}" if username else None
        tweet_url = f"https://twitter.com/{username}/status/{tweet.id}" if username else ""
        
        # Extract hashtags
        hashtags = []
        if hasattr(tweet, "entities") and tweet.entities:
            if "hashtags" in tweet.entities:
                hashtags = [h["tag"] for h in tweet.entities["hashtags"]]
        
        # Get timestamp
        created_at = None
        if hasattr(tweet, "created_at") and tweet.created_at:
            created_at = tweet.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
        
        # Get engagement metrics
        metrics = {}
        if hasattr(tweet, "public_metrics") and tweet.public_metrics:
            metrics = tweet.public_metrics
        
        return Post(
            id=unique_id,
            platform="twitter",
            title="",  # Tweets don't have titles
            content=tweet.text,
            author=author_name,
            author_url=author_url,
            url=tweet_url,
            created_at=created_at,
            hashtags=hashtags,
            metadata={
                "tweet_id": str(tweet.id),
                "author_id": str(tweet.author_id),
                "username": username,
                "metrics": metrics,
            }
        )
