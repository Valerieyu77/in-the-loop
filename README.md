# In the Loop

A daily briefing app for international students in the U.S. — helps you 
keep up with the news and understand the cultural references people 
around you casually drop into conversation.

**Live Demo:** *(coming soon)*

---

## Why I'm Building This

I came to the U.S. for college and ran into a specific kind of gap that 
existing apps don't really address.

It's not a language problem — my English is fine. It's not a news 
problem — I can read the NYT if I sit down and force myself. The gap is 
the everyday cultural context that everyone around me shares and I 
don't. Someone mentions "bracket busted" at lunch and everyone laughs. 
A classmate references a TikTok I've never seen. My roommate asks if I 
watched "the game" and I don't even know which sport.

These moments are small, but they pile up. After a while you start 
nodding along instead of joining in.

The existing tools don't quite fit:

- NYT and BBC cover world news but not the cultural background that 
  makes a joke land or a reference click.
- TikTok and Instagram show you what's trending, but you're just seeing 
  stuff go by — you don't get the context for why it matters or how 
  people actually talk about it.
- Language apps teach vocabulary, not the kind of references and 
  phrases that come up in real conversations.

In the Loop is my attempt to build the thing I wish existed when I got 
here.

---

## What It Does

The app has two sections.

### News Brief

A short daily feed of important stories from around the world, pulled 
from neutral wire services (AP, Reuters). Each item has an English 
headline, a Chinese summary of the background and why it matters, and 
a link to the original article if you want to read more. The point is 
to let you get the gist fast without having to push through a full page 
of English text.

### Culture Decode

This is the part I'm more excited about. Every day the app surfaces a 
few things that are currently being talked about in American culture — 
a sports moment, a pop culture event, a meme, a campus story — and for 
each one it gives you:

- **The background**, in Chinese. What happened, who's involved, why 
  people care. Enough context to actually understand the reference.
- **Relevant knowledge**, also in Chinese. If it's about March Madness, 
  this is where you'd get the basics of how the tournament works, which 
  teams are good this year, what "bracket" means. You can go as deep as 
  you want — short overview if you just need to follow a conversation, 
  more detail if you're actually interested.
- **A few English phrases** native speakers would use when talking 
  about it. Not textbook English — the actual casual expressions you'd 
  hear in a dorm.

Some topics will take 1 minute to read. Some will take 10. It depends 
on the topic and how deep you want to go. The app doesn't pretend 
everything fits in a 30-second card.

Content is pulled from Reddit (r/OutOfTheLoop, r/popculturechat, 
r/UIUC) and Google Trends, then processed by Claude to generate the 
Chinese explanations and English phrases.

---

## Tech Stack (MVP)

- **Data pipeline:** Python (feedparser, PRAW, pytrends)
- **LLM:** Anthropic Claude API
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Hosting:** Vercel
- **Update method:** A Python script I run manually each morning. It 
  pulls the latest content, generates the cards, and commits the 
  updated JSON to GitHub. Vercel redeploys automatically.

This is deliberately a simple setup. Full automation (GitHub Actions, 
a real database) is something I'll add later if the project actually 
gets used.

---

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| 1 | MVP with manual daily updates | In progress |
| 2 | Use it myself for a few weeks, improve content quality | Planned |
| 3 | Automate updates with GitHub Actions | Planned |
| 4 | Add user preferences / interest tags | Planned |
| 5 | Mobile app | Maybe |

---

## About the Development Process

I'm using AI tools (Claude Code mostly) to help write the code. I'm not 
a trained software engineer — my background is in data science, so I 
can write Python for analysis but I haven't built a full web app 
before. AI helps fill in the gaps. I still make all the product 
decisions, figure out what to build next, and debug things when they 
break. The commit history shows how the project actually got built.

---

## About Me

I'm a student at UIUC. This is my first full independent project. 
I'm mainly building it because I want to use it — I'm the target user, 
and the first test for any feature is whether I'd actually open the app 
to use it.

If you have feedback or ideas, feel free to open an issue.
