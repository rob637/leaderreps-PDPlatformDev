"""Email service using Gmail SMTP (nodemailer-compatible)."""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from datetime import datetime

from adapters.base import Post

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service for sending notification emails via Gmail SMTP.
    Compatible with existing LeaderReps nodemailer setup.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the email service.
        
        Args:
            config: Email configuration
        """
        self.config = config
        self.smtp_user = config.get("smtp_user", "")
        self.smtp_pass = config.get("smtp_pass", "")
        self.from_name = config.get("from_name", "Social Monitor")
        self.from_address = config.get("from_address", self.smtp_user)
        self.to_address = config.get("to_address", "")
        self.subject_prefix = config.get("subject_prefix", "[Social Monitor]")
        
        # Gmail SMTP settings
        self.smtp_host = config.get("smtp_host", "smtp.gmail.com")
        self.smtp_port = config.get("smtp_port", 587)
    
    def _create_connection(self):
        """Create SMTP connection to Gmail."""
        server = smtplib.SMTP(self.smtp_host, self.smtp_port)
        server.starttls()
        server.login(self.smtp_user, self.smtp_pass)
        return server
    
    def send_notification(
        self, 
        post: Post, 
        suggested_response: Optional[str] = None
    ) -> bool:
        if not self.smtp_user or not self.smtp_pass:
            logger.warning("No SMTP credentials configured, skipping email")
            return False
        
        if not self.to_address:
            logger.warning("No recipient email configured, skipping")
            return False
        
        try:
            subject = self._build_subject(post)
            html_body = self._build_html_body(post, suggested_response)
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_address}>"
            msg['To'] = self.to_address
            
            msg.attach(MIMEText(html_body, 'html'))
            
            server = self._create_connection()
            server.sendmail(self.from_address, [self.to_address], msg.as_string())
            server.quit()
            
            logger.info(f"Email sent successfully to {self.to_address}")
            return True
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def send_batch_notification(
        self, 
        posts: List[Post], 
        responses: Dict[str, Optional[str]],
        recipient: Optional[str] = None
    ) -> bool:
        to_address = recipient or self.to_address
        if not self.smtp_user or not self.smtp_pass or not to_address:
            return False
        
        if not posts:
            return False
        
        try:
            subject = f"{self.subject_prefix} {len(posts)} new matches found"
            html_body = self._build_batch_html_body(posts, responses)
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_address}>"
            msg['To'] = to_address
            
            msg.attach(MIMEText(html_body, 'html'))
            
            server = self._create_connection()
            server.sendmail(self.from_address, [to_address], msg.as_string())
            server.quit()
            
            logger.info(f"Batch email sent: {len(posts)} posts to {to_address}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending batch email: {e}")
            return False
    
    def _build_subject(self, post: Post) -> str:
        platform = post.platform.title()
        location = ""
        if post.subreddit:
            location = f" in r/{post.subreddit}"
        elif post.channel:
            location = f" in #{post.channel}"
        
        title = post.title[:50] if post.title else "New match"
        if post.title and len(post.title) > 50:
            title += "..."
        
        return f"{self.subject_prefix} [{platform}]{location}: {title}"
    
    def _build_html_body(self, post: Post, suggested_response: Optional[str] = None) -> str:
        timestamp = ""
        if post.created_at:
            timestamp = post.created_at.strftime("%Y-%m-%d %H:%M UTC")
        
        platform_colors = {"reddit": "#FF4500", "twitter": "#1DA1F2", "discord": "#5865F2"}
        badge_color = platform_colors.get(post.platform, "#666666")
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #002E47; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .header h1 {{ margin: 0; font-size: 20px; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: {badge_color}; }}
        .post-meta {{ color: #666; font-size: 14px; margin: 10px 0; }}
        .post-title {{ font-size: 18px; font-weight: bold; margin: 15px 0 10px; }}
        .post-content {{ background: white; padding: 15px; border-radius: 8px; border-left: 4px solid {badge_color}; margin: 15px 0; }}
        .keywords {{ margin: 10px 0; }}
        .keyword {{ display: inline-block; background: #E04E1B; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }}
        .response-section {{ background: #E8F5E9; padding: 15px; border-radius: 8px; margin-top: 20px; }}
        .response-section h3 {{ color: #2E7D32; margin-top: 0; }}
        .response-text {{ background: white; padding: 15px; border-radius: 8px; white-space: pre-wrap; }}
        .cta {{ text-align: center; margin: 20px 0; }}
        .cta a {{ display: inline-block; background: #47A88D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }}
        .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }}
    </style>
</head>
<body>
    <div class="header"><h1>🎯 Social Media Match Found</h1></div>
    <div class="content">
        <p><span class="badge">{post.platform.upper()}</span>
        {f'<span style="margin-left: 10px; color: #666;">r/{post.subreddit}</span>' if post.subreddit else ''}</p>
        <div class="post-meta">
            <strong>Author:</strong> {post.author}<br>
            <strong>Posted:</strong> {timestamp}<br>
            <strong>URL:</strong> <a href="{post.url}">{post.url}</a>
        </div>
        <div class="keywords"><strong>Matched keywords:</strong><br>
            {''.join(f'<span class="keyword">{kw}</span>' for kw in post.matched_keywords)}
        </div>
        {f'<div class="post-title">{post.title}</div>' if post.title else ''}
        <div class="post-content">{post.content[:1000]}{'...' if len(post.content) > 1000 else ''}</div>
        <div class="cta"><a href="{post.url}">View Original Post →</a></div>
        {self._format_response_section(suggested_response) if suggested_response else ''}
    </div>
    <div class="footer"><p>Social Media Monitor for LeaderReps<br><a href="https://www.leaderreps.com">www.leaderreps.com</a></p></div>
</body>
</html>"""
        return html
    
    def _format_response_section(self, response: str) -> str:
        return f"""<div class="response-section">
            <h3>💡 Suggested Response</h3>
            <div class="response-text">{response}</div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;"><em>Generated by Gemini. Review and personalize before posting.</em></p>
        </div>"""
    
    def _build_batch_html_body(self, posts: List[Post], responses: Dict[str, Optional[str]]) -> str:
        by_platform: Dict[str, List[Post]] = {}
        for post in posts:
            if post.platform not in by_platform:
                by_platform[post.platform] = []
            by_platform[post.platform].append(post)
        
        platform_colors = {"reddit": "#FF4500", "twitter": "#1DA1F2", "discord": "#5865F2"}
        
        posts_html = ""
        for platform, platform_posts in by_platform.items():
            badge_color = platform_colors.get(platform, "#666666")
            posts_html += f'<h2 style="color: {badge_color}; border-bottom: 2px solid {badge_color}; padding-bottom: 5px;">{platform.title()} ({len(platform_posts)})</h2>'
            
            for post in platform_posts:
                response = responses.get(post.id)
                resp_html = f'<div style="margin-top: 15px; padding: 12px; background: #E8F5E9; border-radius: 4px; border-left: 3px solid #47A88D;"><strong style="color: #2E7D32;">💡 Suggested Response:</strong><br><div style="font-size: 14px; margin-top: 8px; white-space: pre-wrap;">{response}</div></div>' if response else ''
                posts_html += f"""<div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid {badge_color};">
                    <div style="font-weight: bold; margin-bottom: 5px;">{f'r/{post.subreddit} • ' if post.subreddit else ''}{post.author}</div>
                    {f'<div style="font-size: 16px; font-weight: bold; margin: 10px 0;">{post.title}</div>' if post.title else ''}
                    <div style="color: #666; font-size: 14px; margin: 10px 0;">{post.content[:500]}{'...' if len(post.content) > 500 else ''}</div>
                    <div style="margin: 10px 0;">{''.join(f'<span style="display: inline-block; background: #E04E1B; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin: 2px;">{kw}</span>' for kw in post.matched_keywords)}</div>
                    <a href="{post.url}" style="color: {badge_color};">View Post →</a>
                    {resp_html}
                </div>"""
        
        return f"""<!DOCTYPE html>
<html>
<head><style>body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }} .header {{ background: #002E47; color: white; padding: 20px; border-radius: 8px 8px 0 0; }} .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }} .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}</style></head>
<body>
    <div class="header"><h1>🎯 {len(posts)} Social Media Matches Found</h1><p style="margin: 0; opacity: 0.8;">{datetime.now().strftime('%Y-%m-%d %H:%M')}</p></div>
    <div class="content">{posts_html}</div>
    <div class="footer"><p>Social Media Monitor for LeaderReps<br><a href="https://www.leaderreps.com">www.leaderreps.com</a></p></div>
</body>
</html>"""
    
    def test_connection(self) -> bool:
        try:
            server = self._create_connection()
            server.quit()
            return True
        except Exception as e:
            logger.error(f"SMTP connection test failed: {e}")
            return False
