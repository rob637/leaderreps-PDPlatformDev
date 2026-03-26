# Social Media Monitor

A Python script that monitors social media platforms for posts matching leadership development keywords. When found, it uses Gemini to generate helpful response drafts and emails notifications via Resend.

## Features

- **Platform Adapter Pattern**: Modular design with one class per platform
- **Reddit via RSS**: No API key needed for Reddit monitoring
- **Discord Webhook Integration**: Monitor Discord channels
- **Twitter API**: Full Twitter/X API support
- **Deduplication**: `seen_posts.json` prevents re-notifying on the same post
- **Test Mode**: `--test` prints instead of emailing
- **Daemon Mode**: `--daemon` for continuous monitoring

## Installation

```bash
cd scripts/social-monitor
pip install -r requirements.txt
```

## Configuration

1. Copy the example config:
   ```bash
   cp config.example.yaml config.yaml
   ```

2. Edit `config.yaml` with your:
   - Keywords and subreddits to monitor
   - API keys (Gemini, Resend, Twitter if needed)
   - Email settings

## Usage

### Single run (test mode - no emails)
```bash
python monitor.py --test
```

### Single run (with emails)
```bash
python monitor.py
```

### Continuous monitoring (daemon mode)
```bash
python monitor.py --daemon
```

### Specify custom config
```bash
python monitor.py --config my-config.yaml
```

## Platform Support

| Platform | Method | API Key Required |
|----------|--------|------------------|
| Reddit | RSS Feed | No |
| Discord | Webhook/Bot | Optional |
| Twitter/X | API v2 | Yes |

## Keywords (Default)

The default config monitors for leadership development topics relevant to LeaderReps:
- Leadership development, executive coaching
- Team leadership, management training
- Cohort-based learning, leadership programs
- Professional development, leadership skills

## File Structure

```
social-monitor/
├── monitor.py           # Main entry point
├── config.yaml          # Your configuration (gitignored)
├── config.example.yaml  # Example configuration
├── requirements.txt     # Python dependencies
├── seen_posts.json      # Deduplication store (gitignored)
├── adapters/            # Platform adapters
│   ├── __init__.py
│   ├── base.py          # Base adapter class
│   ├── reddit.py        # Reddit RSS adapter
│   ├── discord.py       # Discord adapter
│   └── twitter.py       # Twitter API adapter
└── services/
    ├── __init__.py
    ├── gemini.py        # Gemini response generation
    └── email.py         # Resend email service
```
