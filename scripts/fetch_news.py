import feedparser              # library for reading RSS feeds
import json                    # built-in library for reading/writing JSON files
from datetime import datetime  # built-in library for getting the current date and time

# The URL of the BBC World News RSS feed
RSS_URL = "https://feeds.bbci.co.uk/news/world/rss.xml"

# Fetch and parse the feed — feedparser downloads it and turns it into a Python object
feed = feedparser.parse(RSS_URL)

# Get the current date-time once, so all 15 items share the same "fetched_at" value
fetched_at = datetime.now().isoformat()

# Loop through the first 15 entries (stories) in the feed and print each one
for entry in feed.entries[:15]:
    print("Title:", entry.title)         # the headline
    print("Link:", entry.link)           # the URL to the full article
    print("Published:", entry.published) # the date/time it was published
    print("---")  # separator to make the output easier to read

# --- Save the same 15 items to a JSON file ---
# Build a list of dictionaries, one per story, then write it to data/news.json.
# indent=2 makes the file human-readable (nicely indented).
# ensure_ascii=False means Chinese characters will be saved as-is, not escaped.

news_items = []  # start with an empty list
for entry in feed.entries[:15]:
    news_items.append({
        "title":      entry.title,
        "link":       entry.link,
        "published":  entry.published,
        "fetched_at": fetched_at,
    })

# Open the file for writing and dump the list as formatted JSON
with open("data/news.json", "w", encoding="utf-8") as f:
    json.dump(news_items, f, indent=2, ensure_ascii=False)

print("Saved 15 items to data/news.json")
