#!/usr/bin/env python3
"""
Social Media Monitor for LeaderReps

Monitors social media platforms for posts matching leadership development keywords.
When found, uses Gemini to generate response drafts and optionally emails notifications.

Usage:
    python monitor.py --test              # Test mode (print instead of email)
    python monitor.py --daemon            # Continuous monitoring
    python monitor.py --config custom.yaml  # Use custom config file
"""

import argparse
import json
import logging
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Any

import yaml

# Add the script directory to path for imports
SCRIPT_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(SCRIPT_DIR))

from adapters import (
    RedditAdapter, TwitterAdapter, DiscordAdapter, HackerNewsAdapter,
    MediumAdapter, DevToAdapter, StackExchangeAdapter, RSSAdapter,
    IndieHackersAdapter, Post
)
from services import GeminiService, EmailService, get_firestore_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("monitor")


class SeenPostsStore:
    """
    Persistent storage for seen post IDs to avoid re-notifying.
    
    Stores post IDs with timestamps, auto-cleans old entries.
    """
    
    def __init__(self, filepath: Path, max_age_days: int = 7):
        self.filepath = filepath
        self.max_age_days = max_age_days
        self._seen: Dict[str, str] = {}  # post_id -> timestamp
        self._load()
    
    def _load(self):
        """Load seen posts from file."""
        if self.filepath.exists():
            try:
                with open(self.filepath, "r") as f:
                    data = json.load(f)
                    self._seen = data.get("posts", {})
                    logger.debug(f"Loaded {len(self._seen)} seen posts")
            except Exception as e:
                logger.warning(f"Error loading seen posts: {e}")
                self._seen = {}
    
    def _save(self):
        """Save seen posts to file."""
        try:
            data = {
                "posts": self._seen,
                "updated": datetime.now(timezone.utc).isoformat()
            }
            with open(self.filepath, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving seen posts: {e}")
    
    def is_seen(self, post_id: str) -> bool:
        """Check if a post has been seen."""
        return post_id in self._seen
    
    def mark_seen(self, post_id: str):
        """Mark a post as seen."""
        self._seen[post_id] = datetime.now(timezone.utc).isoformat()
    
    def filter_unseen(self, posts: List[Post]) -> List[Post]:
        """Filter posts to only those not seen before."""
        return [p for p in posts if not self.is_seen(p.id)]
    
    def cleanup_old(self):
        """Remove entries older than max_age_days."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.max_age_days)
        
        to_remove = []
        for post_id, timestamp in self._seen.items():
            try:
                ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                if ts < cutoff:
                    to_remove.append(post_id)
            except Exception:
                pass
        
        for post_id in to_remove:
            del self._seen[post_id]
        
        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old seen posts")
    
    def commit(self):
        """Save changes to disk."""
        self.cleanup_old()
        self._save()
    
    def get_count(self) -> int:
        """Get number of seen posts."""
        return len(self._seen)


class SocialMonitor:
    """
    Main social media monitoring orchestrator.
    """
    
    def __init__(self, config_path: Path, test_mode: bool = False):
        """
        Initialize the monitor.
        
        Args:
            config_path: Path to config.yaml
            test_mode: If True, print instead of emailing
        """
        self.config_path = config_path
        self.test_mode = test_mode
        self.config = self._load_config()
        
        # Initialize seen posts store
        seen_path = SCRIPT_DIR / "seen_posts.json"
        self.seen_store = SeenPostsStore(seen_path)
        
        # Initialize adapters
        self.adapters = self._init_adapters()
        
        # Initialize services
        self.gemini = self._init_gemini()
        self.email = self._init_email()
        
        # Get keywords
        self.keywords = self.config.get("keywords", [])
        
        # Monitoring settings
        monitor_config = self.config.get("monitor", {})
        self.interval = monitor_config.get("interval_seconds", 300)
        self.max_posts = monitor_config.get("max_posts_per_run", 20)
        self.max_age_hours = monitor_config.get("max_post_age_hours", 24)
        
        # Daemon control
        self._running = False
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        if not self.config_path.exists():
            logger.error(f"Config file not found: {self.config_path}")
            logger.info("Copy config.example.yaml to config.yaml and configure it")
            sys.exit(1)
        
        with open(self.config_path, "r") as f:
            return yaml.safe_load(f)
    
    def _init_adapters(self) -> List:
        """Initialize platform adapters based on config."""
        adapters = []
        
        # Reddit adapter
        reddit_config = self.config.get("reddit", {})
        if reddit_config.get("enabled", True):
            adapters.append(RedditAdapter(reddit_config))
            logger.info("Reddit adapter enabled")
        
        # Twitter adapter
        twitter_config = self.config.get("twitter", {})
        if twitter_config.get("enabled", False):
            twitter_config["api_keys"] = self.config.get("api_keys", {}).get("twitter", {})
            adapters.append(TwitterAdapter(twitter_config))
            logger.info("Twitter adapter enabled")
        
        # Discord adapter
        discord_config = self.config.get("discord", {})
        if discord_config.get("enabled", False):
            adapters.append(DiscordAdapter(discord_config))
            logger.info("Discord adapter enabled")
        
        # Hacker News adapter
        hn_config = self.config.get("hackernews", {})
        if hn_config.get("enabled", False):
            adapters.append(HackerNewsAdapter(hn_config))
            logger.info("Hacker News adapter enabled")
        
        # Medium adapter
        medium_config = self.config.get("medium", {})
        if medium_config.get("enabled", False):
            adapters.append(MediumAdapter(medium_config))
            logger.info("Medium adapter enabled")
        
        # Dev.to adapter
        devto_config = self.config.get("devto", {})
        if devto_config.get("enabled", False):
            adapters.append(DevToAdapter(devto_config))
            logger.info("Dev.to adapter enabled")
        
        # Stack Exchange adapter
        se_config = self.config.get("stackexchange", {})
        if se_config.get("enabled", False):
            adapters.append(StackExchangeAdapter(se_config))
            logger.info("Stack Exchange adapter enabled")
        
        # Leadership RSS feeds adapter
        rss_config = self.config.get("rss_feeds", {})
        if rss_config.get("enabled", False):
            adapters.append(RSSAdapter(rss_config))
            logger.info("RSS Feeds adapter enabled")
        
        # Indie Hackers adapter
        ih_config = self.config.get("indiehackers", {})
        if ih_config.get("enabled", False):
            adapters.append(IndieHackersAdapter(ih_config))
            logger.info("Indie Hackers adapter enabled")
        
        return adapters
    
    def _init_gemini(self) -> Optional[GeminiService]:
        """Initialize Gemini service."""
        api_key = self.config.get("api_keys", {}).get("gemini", "")
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            logger.warning("No Gemini API key configured, responses won't be generated")
            return None
        
        gemini_config = self.config.get("gemini", {})
        return GeminiService(gemini_config, api_key)
    
    def _init_email(self) -> Optional[EmailService]:
        """Initialize email service."""
        email_config = self.config.get("email", {})
        
        # Check for SMTP credentials
        if not email_config.get("smtp_user") or not email_config.get("smtp_pass"):
            logger.warning("No SMTP credentials configured, emails won't be sent")
            return None
        
        return EmailService(email_config)
    
    def fetch_all_posts(self) -> List[Post]:
        """
        Fetch posts from all enabled adapters.
        
        Returns:
            List of matched posts from all platforms
        """
        all_posts = []
        
        for adapter in self.adapters:
            try:
                posts = adapter.fetch_posts(self.keywords)
                all_posts.extend(posts)
                logger.info(f"{adapter.platform_name}: {len(posts)} matches")
            except Exception as e:
                logger.error(f"Error fetching from {adapter.platform_name}: {e}")
        
        return all_posts
    
    def filter_by_age(self, posts: List[Post]) -> List[Post]:
        """Filter posts to only recent ones."""
        if not self.max_age_hours:
            return posts
        
        cutoff = datetime.now(timezone.utc) - timedelta(hours=self.max_age_hours)
        
        filtered = []
        for post in posts:
            if post.created_at is None:
                # Include posts without timestamps
                filtered.append(post)
            elif post.created_at > cutoff:
                filtered.append(post)
        
        return filtered
    
    def process_posts(self, posts: List[Post]) -> Dict[str, Optional[str]]:
        """
        Generate responses for posts using Gemini.
        
        Returns:
            Dict mapping post ID to suggested response
        """
        responses = {}
        
        for post in posts:
            response = None
            if self.gemini:
                try:
                    response = self.gemini.generate_response(post)
                    if response:
                        logger.debug(f"Generated response for {post.id}")
                except Exception as e:
                    logger.error(f"Error generating response for {post.id}: {e}")
            
            responses[post.id] = response
        
        return responses
    
    def notify(self, posts: List[Post], responses: Dict[str, Optional[str]]):
        """
        Send notifications for matched posts.
        
        In test mode, prints to console instead of emailing.
        """
        if not posts:
            return
        
        if self.test_mode:
            self._print_results(posts, responses)
        else:
            self._send_emails(posts, responses)
    
    def _print_results(self, posts: List[Post], responses: Dict[str, Optional[str]]):
        """Print results to console (test mode)."""
        print("\n" + "=" * 70)
        print(f"  🎯 FOUND {len(posts)} MATCHING POSTS")
        print("=" * 70)
        
        for i, post in enumerate(posts, 1):
            print(f"\n--- Post {i}/{len(posts)} ---")
            print(f"Platform: {post.platform.upper()}")
            if post.subreddit:
                print(f"Subreddit: r/{post.subreddit}")
            print(f"Author: {post.author}")
            print(f"URL: {post.url}")
            print(f"Keywords: {', '.join(post.matched_keywords)}")
            
            if post.title:
                print(f"\nTitle: {post.title}")
            
            print(f"\nContent:")
            print("-" * 40)
            content = post.content[:500]
            if len(post.content) > 500:
                content += "..."
            print(content)
            print("-" * 40)
            
            response = responses.get(post.id)
            if response:
                print(f"\n💡 Suggested Response:")
                print("-" * 40)
                print(response)
                print("-" * 40)
            
            print()
        
        print("=" * 70)
        print(f"  Test mode - no emails sent")
        print("=" * 70 + "\n")
    
    def _send_emails(self, posts: List[Post], responses: Dict[str, Optional[str]]):
        """Send email notifications to all subscribers."""
        if not self.email:
            logger.warning("Email service not configured, skipping notifications")
            return
        
        # Try to get subscriptions from Firestore
        subscriptions = self._get_subscriptions()
        
        if not subscriptions:
            # Fall back to config.yaml recipient
            logger.info("No Firestore subscriptions, using config recipient")
            self._send_to_single_recipient(posts, responses)
            return
        
        # Send to each subscriber with their filtered platforms
        for sub in subscriptions:
            self._send_to_subscriber(sub, posts, responses)
    
    def _get_subscriptions(self) -> List[Dict[str, Any]]:
        """Fetch subscriptions from Firestore."""
        try:
            firestore = get_firestore_service()
            return firestore.get_subscriptions()
        except Exception as e:
            logger.warning(f"Could not fetch Firestore subscriptions: {e}")
            return []
    
    def _send_to_single_recipient(self, posts: List[Post], responses: Dict[str, Optional[str]]):
        """Send to the single recipient configured in config.yaml."""
        if len(posts) > 1:
            success = self.email.send_batch_notification(posts, responses)
            if success:
                logger.info(f"Sent batch notification for {len(posts)} posts")
        else:
            post = posts[0]
            response = responses.get(post.id)
            success = self.email.send_notification(post, response)
            if success:
                logger.info(f"Sent notification for post {post.id}")
    
    def _send_to_subscriber(
        self, 
        subscription: Dict[str, Any], 
        all_posts: List[Post], 
        responses: Dict[str, Optional[str]]
    ):
        """Send filtered posts to a specific subscriber."""
        email = subscription.get("email")
        platforms = subscription.get("platforms", [])
        
        if not email or not platforms:
            return
        
        # Map internal platform names to Post.platform values
        platform_map = {
            "reddit": "reddit",
            "hackernews": "hackernews",
            "medium": "medium",
            "devto": "devto",
            "stackexchange": "stackexchange",
            "rss": "rss",
            "indiehackers": "indiehackers",
        }
        
        # Filter posts to only those from subscriber's selected platforms
        subscriber_platforms = set(platform_map.get(p, p) for p in platforms)
        filtered_posts = [p for p in all_posts if p.platform in subscriber_platforms]
        
        if not filtered_posts:
            logger.debug(f"No posts for {email} (platforms: {platforms})")
            return
        
        # Send the email
        success = self.email.send_batch_notification(filtered_posts, responses, recipient=email)
        if success:
            logger.info(f"Sent {len(filtered_posts)} posts to {email} ({', '.join(platforms)})")
        else:
            logger.error(f"Failed to send email to {email}")
    
    def run_once(self) -> int:
        """
        Run a single monitoring cycle.
        
        Returns:
            Number of new posts processed
        """
        logger.info("Starting monitoring cycle...")
        
        # Fetch all posts
        posts = self.fetch_all_posts()
        logger.info(f"Total matched posts: {len(posts)}")
        
        # Filter by age
        posts = self.filter_by_age(posts)
        logger.info(f"After age filter: {len(posts)}")
        
        # Filter out seen posts (using BOTH local store AND Firestore)
        new_posts = self.seen_store.filter_unseen(posts)
        
        # Also filter using Firestore (shared with Cloud Function)
        try:
            firestore_svc = get_firestore_service()
            new_posts = firestore_svc.filter_unsent_posts(new_posts)
        except Exception as e:
            logger.warning(f"Firestore dedup unavailable, using local only: {e}")
        
        logger.info(f"New (unseen) posts: {len(new_posts)}")
        
        if not new_posts:
            logger.info("No new posts to process")
            return 0
        
        # Limit number of posts
        if len(new_posts) > self.max_posts:
            logger.info(f"Limiting to {self.max_posts} posts")
            new_posts = new_posts[:self.max_posts]
        
        # AI Relevance Check - filter to only truly leadership-relevant posts
        if self.gemini:
            logger.info("Checking AI relevance of posts...")
            relevant_posts = []
            for post in new_posts:
                try:
                    if self.gemini.check_relevance(post):
                        relevant_posts.append(post)
                except Exception as e:
                    logger.warning(f"Relevance check failed for {post.id}, including: {e}")
                    relevant_posts.append(post)
            
            filtered_count = len(new_posts) - len(relevant_posts)
            if filtered_count > 0:
                logger.info(f"AI filtered out {filtered_count} irrelevant posts")
            new_posts = relevant_posts
            
            if not new_posts:
                logger.info("No posts passed AI relevance check")
                return 0
        
        # Generate responses
        responses = self.process_posts(new_posts)
        
        # Send notifications
        self.notify(new_posts, responses)
        
        # Mark as seen (both local AND Firestore)
        for post in new_posts:
            self.seen_store.mark_seen(post.id)
        
        # Save seen posts locally
        self.seen_store.commit()
        
        # Also save to Firestore (shared with Cloud Function)
        try:
            firestore_svc = get_firestore_service()
            firestore_svc.mark_posts_as_sent([p.id for p in new_posts], user_email="python-script")
        except Exception as e:
            logger.warning(f"Failed to save to Firestore: {e}")
        
        logger.info(f"Processed {len(new_posts)} posts")
        return len(new_posts)
    
    def run_daemon(self):
        """
        Run in daemon mode (continuous monitoring).
        """
        logger.info(f"Starting daemon mode (interval: {self.interval}s)")
        logger.info("Press Ctrl+C to stop")
        
        self._running = True
        
        # Set up signal handlers
        def handle_signal(signum, frame):
            logger.info("Received shutdown signal")
            self._running = False
        
        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)
        
        cycle = 0
        while self._running:
            cycle += 1
            logger.info(f"=== Cycle {cycle} ===")
            
            try:
                count = self.run_once()
                logger.info(f"Cycle {cycle} complete: {count} new posts")
            except Exception as e:
                logger.error(f"Error in cycle {cycle}: {e}")
            
            if self._running:
                logger.info(f"Sleeping for {self.interval} seconds...")
                # Sleep in small intervals to allow quick shutdown
                for _ in range(self.interval):
                    if not self._running:
                        break
                    time.sleep(1)
        
        logger.info("Daemon stopped")
    
    def test_connections(self):
        """Test all configured service connections."""
        print("\n🔍 Testing connections...\n")
        
        # Test Gemini
        if self.gemini:
            print("Gemini API: ", end="")
            if self.gemini.test_connection():
                print("✅ Connected")
            else:
                print("❌ Failed")
        else:
            print("Gemini API: ⚠️  Not configured")
        
        # Test Resend
        if self.email:
            print("Resend API: ", end="")
            if self.email.test_connection():
                print("✅ Configured")
            else:
                print("❌ Failed")
        else:
            print("Resend API: ⚠️  Not configured")
        
        # Test adapters
        print("\nPlatform Adapters:")
        for adapter in self.adapters:
            status = "✅ Enabled" if adapter.is_enabled() else "⚠️  Disabled"
            print(f"  {adapter.platform_name.title()}: {status}")
        
        print(f"\nKeywords configured: {len(self.keywords)}")
        print(f"Seen posts stored: {self.seen_store.get_count()}")
        print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Social Media Monitor for LeaderReps",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --test              Test mode (print instead of email)
  %(prog)s --daemon            Continuous monitoring
  %(prog)s --check             Test API connections only
  %(prog)s --config my.yaml    Use custom config file
        """
    )
    
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Test mode: print results instead of sending emails"
    )
    
    parser.add_argument(
        "--daemon", "-d",
        action="store_true",
        help="Daemon mode: run continuously"
    )
    
    parser.add_argument(
        "--check", "-c",
        action="store_true",
        help="Check API connections and exit"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to config file (default: config.yaml)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Resolve config path
    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = SCRIPT_DIR / config_path
    
    # Initialize monitor
    try:
        monitor = SocialMonitor(config_path, test_mode=args.test)
    except Exception as e:
        logger.error(f"Failed to initialize monitor: {e}")
        sys.exit(1)
    
    # Run based on mode
    if args.check:
        monitor.test_connections()
    elif args.daemon:
        monitor.run_daemon()
    else:
        # Single run
        count = monitor.run_once()
        print(f"\nProcessed {count} new posts")


if __name__ == "__main__":
    main()
