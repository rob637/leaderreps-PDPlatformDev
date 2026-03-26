"""Gemini AI service using direct HTTP API."""
import logging
import requests
from typing import Dict, Any, Optional

from adapters.base import Post

logger = logging.getLogger(__name__)

# Default context for LeaderReps
DEFAULT_CONTEXT = """You are helping respond to social media posts about leadership development.

ABOUT LEADERREPS:
LeaderReps is a leadership professional development platform offering:
- Cohort-based 8-week leadership programs
- Daily leadership practices and reflections  
- AI coaching and personalized development plans
- Community events and peer learning

CURRENT PROMOTION - COACHING THE COACHES WEBINAR:
"Why Feedback Fails" - A FREE 60-minute working session on giving effective feedback.
URL: https://www.leaderreps.com/coaching-the-coaches

CLEAR Framework for feedback:
- Check: Make sure they're open to feedback
- Label: Give them a headline
- Evidence: Describe only what a camera would record
- Anchor: Connect the behavior to the impact
- Request: Be clear about what you want moving forward

RESPONSE GUIDELINES:
1. First, genuinely address the person's question or pain point
2. Provide actionable value they can use immediately
3. Keep the tone conversational and authentic - NOT salesy
4. Only mention LeaderReps/the webinar if genuinely relevant
5. Keep responses concise - 2-3 short paragraphs max
6. Match the platform's tone (Reddit = casual)"""

# Relevance check prompt
RELEVANCE_CHECK_PROMPT = """You are a content classifier for a leadership development platform.

WHAT WE ARE LOOKING FOR (RELEVANT):
- People asking for advice on managing/leading teams
- Questions about giving feedback, difficult conversations, coaching employees
- New managers seeking guidance on leadership skills
- People struggling with team dynamics, delegation, motivation
- Questions about leadership training or development programs
- Posts about executive presence, influence, or leadership style
- HR professionals discussing people management challenges

WHAT WE ARE NOT LOOKING FOR (IRRELEVANT):
- Generic career advice (salary negotiation, job searching, resumes)
- Technical questions about project management tools/software
- Posts about "being a leader" in gaming, sports, or competitions
- Job postings or hiring announcements
- Pure rants/venting without asking for advice
- Questions about becoming a manager (job hunting), not being a manager (skill development)
- Posts where "manager" or "leader" is used in a non-leadership context (e.g., "package manager", "project leader" as job title)

---
POST TO EVALUATE:
Title: {title}
Content: {content}
Platform: {platform}
---

Is this post genuinely about leadership development, managing people, or becoming a better leader where we could provide valuable advice?

Reply with ONLY "YES" or "NO" followed by a brief reason (10 words max).
Example: "YES - asking for feedback advice"
Example: "NO - job posting not seeking advice"
"""


class GeminiService:
    """Service for generating response drafts using Gemini HTTP API."""
    
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    
    def __init__(self, config: Dict[str, Any], api_key: str):
        self.config = config
        self.api_key = api_key
        self.model_name = config.get("model", "gemini-2.0-flash")
        self.temperature = config.get("temperature", 0.7)
        self.max_tokens = config.get("max_tokens", 600)
        self.context = config.get("context", DEFAULT_CONTEXT)
    
    def generate_response(self, post: Post) -> Optional[str]:
        """Generate a response draft for a social media post."""
        if not self.api_key:
            logger.warning("No Gemini API key configured")
            return None
        
        try:
            prompt = self._build_prompt(post)
            
            url = self.API_URL.format(model=self.model_name)
            headers = {"Content-Type": "application/json"}
            params = {"key": self.api_key}
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": self.temperature,
                    "maxOutputTokens": self.max_tokens
                }
            }
            
            response = requests.post(url, headers=headers, params=params, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if "candidates" in data and data["candidates"]:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
            
            return None
                
        except Exception as e:
            logger.error(f"Error generating response for {post.id}: {e}")
            return None
    
    def _build_prompt(self, post: Post) -> str:
        """Build the prompt for Gemini."""
        platform_context = ""
        if post.platform == "reddit":
            platform_context = f"Platform: Reddit (r/{post.subreddit}) - use casual, helpful tone, don't be promotional"
        
        return f"""{self.context}

{platform_context}

---
POST TO RESPOND TO:
Author: {post.author}
{post.display_text}
---

Generate a helpful, authentic response to this post."""
    
    def test_connection(self) -> bool:
        """Test the Gemini API connection."""
        try:
            url = self.API_URL.format(model=self.model_name)
            params = {"key": self.api_key}
            payload = {"contents": [{"parts": [{"text": "Say hi"}]}]}
            
            response = requests.post(url, params=params, json=payload, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Gemini test failed: {e}")
            return False
    
    def check_relevance(self, post: Post) -> bool:
        """
        Check if a post is genuinely about leadership development.
        
        Uses AI to filter out false positives from keyword matching.
        
        Args:
            post: The Post object to check
            
        Returns:
            True if the post is relevant to leadership development, False otherwise
        """
        if not self.api_key:
            logger.warning("No Gemini API key - skipping relevance check")
            return True  # Include by default if no API key
        
        try:
            prompt = RELEVANCE_CHECK_PROMPT.format(
                title=post.title or "",
                content=post.content[:500] if post.content else "",
                platform=f"{post.platform} (r/{post.subreddit})" if post.subreddit else post.platform
            )
            
            url = self.API_URL.format(model=self.model_name)
            headers = {"Content-Type": "application/json"}
            params = {"key": self.api_key}
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,  # Low temp for classification
                    "maxOutputTokens": 50
                }
            }
            
            response = requests.post(url, headers=headers, params=params, json=payload, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            if "candidates" in data and data["candidates"]:
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip().upper()
                is_relevant = text.startswith("YES")
                logger.info(f"Relevance check [{post.platform}]: {'✓' if is_relevant else '✗'} {post.title[:50]}... - {text}")
                return is_relevant
            
            return True  # Include on unclear response
            
        except Exception as e:
            logger.warning(f"Relevance check failed for {post.id}, including by default: {e}")
            return True  # Include on error to avoid missing content
