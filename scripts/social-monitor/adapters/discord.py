"""Discord adapter for monitoring channels."""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from .base import BaseAdapter, Post

logger = logging.getLogger(__name__)


class DiscordAdapter(BaseAdapter):
    """
    Discord adapter for monitoring channels.
    
    Can work in two modes:
    1. Bot mode: Uses a Discord bot token to read channel messages
    2. Webhook mode: Receives messages via webhook (requires external setup)
    
    Note: Bot mode requires the bot to be invited to the server with 
    message reading permissions.
    """
    
    @property
    def platform_name(self) -> str:
        return "discord"
    
    def fetch_posts(self, keywords: List[str]) -> List[Post]:
        """
        Fetch messages from configured Discord channels.
        
        Args:
            keywords: Keywords for filtering
        
        Returns:
            List of Post objects matching keywords
        """
        if not self.is_enabled():
            logger.info("Discord adapter is disabled")
            return []
        
        bot_token = self.config.get("bot_token", "")
        channel_ids = self.config.get("channel_ids", [])
        
        if not bot_token:
            logger.warning("Discord: No bot token configured, skipping")
            return []
        
        if not channel_ids:
            logger.warning("Discord: No channel IDs configured, skipping")
            return []
        
        # Try synchronous approach using requests
        all_messages = []
        
        for channel_id in channel_ids:
            try:
                messages = self._fetch_channel_messages(bot_token, channel_id)
                all_messages.extend(messages)
                logger.debug(f"Fetched {len(messages)} messages from channel {channel_id}")
            except Exception as e:
                logger.error(f"Error fetching Discord channel {channel_id}: {e}")
        
        # Filter by keywords
        matched = self.filter_by_keywords(all_messages, keywords)
        logger.info(f"Discord: {len(matched)} messages matched keywords out of {len(all_messages)} total")
        
        return matched
    
    def _fetch_channel_messages(
        self, 
        bot_token: str, 
        channel_id: str,
        limit: int = 50
    ) -> List[Post]:
        """
        Fetch recent messages from a Discord channel using the REST API.
        
        Args:
            bot_token: Discord bot token
            channel_id: Channel ID to fetch from
            limit: Maximum messages to fetch
        
        Returns:
            List of Post objects
        """
        import requests
        
        url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
        headers = {
            "Authorization": f"Bot {bot_token}",
            "Content-Type": "application/json"
        }
        params = {"limit": limit}
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        messages_data = response.json()
        posts = []
        
        for msg in messages_data:
            try:
                post = self._parse_message(msg, channel_id)
                posts.append(post)
            except Exception as e:
                logger.error(f"Error parsing Discord message: {e}")
        
        return posts
    
    def _parse_message(self, msg: Dict[str, Any], channel_id: str) -> Post:
        """
        Parse a Discord message into a Post object.
        
        Args:
            msg: Discord message data from API
            channel_id: Channel the message is from
        
        Returns:
            Post object
        """
        unique_id = f"discord:{msg['id']}"
        
        # Get author info
        author = msg.get("author", {})
        author_name = author.get("username", "Unknown")
        author_id = author.get("id", "")
        
        # Discord doesn't have public profile URLs for users
        author_url = None
        
        # Get timestamp
        created_at = None
        if "timestamp" in msg:
            try:
                # Discord uses ISO format timestamps
                ts = msg["timestamp"]
                created_at = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                pass
        
        # Get message content
        content = msg.get("content", "")
        
        # Build a message URL if we have guild ID in metadata
        # Format: https://discord.com/channels/{guild_id}/{channel_id}/{message_id}
        guild_id = msg.get("guild_id", "")
        if guild_id:
            url = f"https://discord.com/channels/{guild_id}/{channel_id}/{msg['id']}"
        else:
            url = f"https://discord.com/channels/@me/{channel_id}/{msg['id']}"
        
        return Post(
            id=unique_id,
            platform="discord",
            title="",  # Discord messages don't have titles
            content=content,
            author=author_name,
            author_url=author_url,
            url=url,
            created_at=created_at,
            channel=channel_id,
            metadata={
                "message_id": msg["id"],
                "author_id": author_id,
                "guild_id": guild_id,
                "has_attachments": bool(msg.get("attachments")),
                "has_embeds": bool(msg.get("embeds")),
            }
        )
    
    async def fetch_posts_async(self, keywords: List[str]) -> List[Post]:
        """
        Async version using discord.py library.
        
        This is more efficient for long-running daemon mode.
        Requires discord.py to be installed.
        
        Args:
            keywords: Keywords for filtering
        
        Returns:
            List of Post objects matching keywords
        """
        if not self.is_enabled():
            return []
        
        try:
            import discord
        except ImportError:
            logger.error("Discord.py not installed for async mode")
            return []
        
        # Implementation would use discord.py Client
        # For now, fall back to sync method
        return self.fetch_posts(keywords)
