"""Firestore service for reading subscription config."""
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

# Path to service account key (relative to script directory)
DEFAULT_CRED_PATH = Path(__file__).parent.parent.parent.parent / "leaderreps-pd-platform-firebase-adminsdk.json"


class FirestoreService:
    """Service for interacting with Firestore subscription data."""
    
    SUBSCRIPTIONS_DOC = "config/social-monitor-subscriptions"
    
    def __init__(self, credentials_path: Optional[Path] = None):
        """
        Initialize Firestore connection.
        
        Args:
            credentials_path: Path to service account JSON file
        """
        self.credentials_path = credentials_path or DEFAULT_CRED_PATH
        self._db = None
        self._initialized = False
    
    def _init_firebase(self):
        """Initialize Firebase Admin SDK."""
        if self._initialized:
            return
        
        try:
            # Check if already initialized
            firebase_admin.get_app()
            self._initialized = True
        except ValueError:
            # Not initialized, do it now
            if not self.credentials_path.exists():
                logger.error(f"Firebase credentials not found: {self.credentials_path}")
                raise FileNotFoundError(f"Credentials file not found: {self.credentials_path}")
            
            cred = credentials.Certificate(str(self.credentials_path))
            firebase_admin.initialize_app(cred)
            self._initialized = True
            logger.info("Firebase Admin SDK initialized")
        
        self._db = firestore.client()
    
    @property
    def db(self):
        """Get Firestore client (lazy initialization)."""
        if self._db is None:
            self._init_firebase()
        return self._db
    
    def get_subscriptions(self) -> List[Dict[str, Any]]:
        """
        Fetch active subscriptions from Firestore.
        
        Returns:
            List of subscription dicts with email, platforms, frequency, etc.
        """
        try:
            doc_ref = self.db.document(self.SUBSCRIPTIONS_DOC)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.warning("No subscriptions document found in Firestore")
                return []
            
            data = doc.to_dict()
            subscriptions = data.get("subscriptions", [])
            
            # Filter to only enabled subscriptions
            active = [s for s in subscriptions if s.get("enabled", True)]
            
            logger.info(f"Loaded {len(active)} active subscriptions from Firestore")
            return active
            
        except Exception as e:
            logger.error(f"Error fetching subscriptions from Firestore: {e}")
            return []
    
    def get_subscription_emails(self) -> List[str]:
        """Get list of all subscribed email addresses."""
        subscriptions = self.get_subscriptions()
        return [s.get("email") for s in subscriptions if s.get("email")]

    # ========================================
    # SENT POSTS TRACKING (DEDUPLICATION)
    # ========================================
    
    SENT_POSTS_DOC = "config/social-monitor-sent-posts"
    
    def get_sent_post_ids(self) -> set:
        """
        Get set of post IDs that have already been sent.
        
        Returns:
            Set of post ID strings
        """
        try:
            doc_ref = self.db.document(self.SENT_POSTS_DOC)
            doc = doc_ref.get()
            
            if not doc.exists:
                return set()
            
            data = doc.to_dict()
            post_ids = data.get("postIds", [])
            logger.debug(f"Loaded {len(post_ids)} sent post IDs from Firestore")
            return set(post_ids)
            
        except Exception as e:
            logger.error(f"Error fetching sent post IDs: {e}")
            return set()
    
    def mark_posts_as_sent(self, post_ids: List[str], user_email: str = "python-script"):
        """
        Mark posts as sent in Firestore.
        
        Args:
            post_ids: List of post IDs that were just sent
            user_email: Who triggered this run (for logging)
        """
        try:
            # Get existing sent IDs
            existing = self.get_sent_post_ids()
            
            # Merge and keep last 500 (rolling window)
            all_ids = list(set(post_ids) | existing)[:500]
            
            doc_ref = self.db.document(self.SENT_POSTS_DOC)
            doc_ref.set({
                "postIds": all_ids,
                "lastRun": firestore.SERVER_TIMESTAMP,
                "lastRunBy": user_email,
                "lastPostCount": len(post_ids),
            }, merge=True)
            
            logger.info(f"Marked {len(post_ids)} posts as sent (total tracked: {len(all_ids)})")
            
        except Exception as e:
            logger.error(f"Error saving sent post IDs: {e}")
    
    def filter_unsent_posts(self, posts: List[Any]) -> List[Any]:
        """
        Filter a list of posts to only those not previously sent.
        
        Args:
            posts: List of Post objects with .id attribute
            
        Returns:
            Filtered list of unsent posts
        """
        sent_ids = self.get_sent_post_ids()
        unsent = [p for p in posts if p.id not in sent_ids]
        logger.info(f"Filtered {len(posts)} posts to {len(unsent)} unsent ({len(posts) - len(unsent)} already sent)")
        return unsent


# Singleton instance
_firestore_service = None

def get_firestore_service(credentials_path: Optional[Path] = None) -> FirestoreService:
    """Get or create the Firestore service singleton."""
    global _firestore_service
    if _firestore_service is None:
        _firestore_service = FirestoreService(credentials_path)
    return _firestore_service
