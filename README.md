# In the Loop

A daily briefing app for Chinese international students in the U.S. — helps you 
keep up with the news and understand the cultural references people 
around you casually drop into conversation.

**Live Demo:** [shiny-choux-ebf0e1.netlify.app](https://shiny-choux-ebf0e1.netlify.app)

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

### News Brief ✅

A live feed of important stories pulled from NewsData.io. Each item has 
an English headline and a Claude-generated Chinese summary explaining 
the background and why it matters. The point is to let you get the gist 
fast without having to push through a full page of English text.

### Culture Decode (coming soon)

Every day the app will surface a few things currently being talked about 
in American culture — a sports moment, a pop culture event, a meme, a 
campus story — and for each one give you:

- **The background**, in Chinese.
- **Relevant knowledge**, also in Chinese.
- **A few English phrases** native speakers would actually use.

Content will be pulled from Reddit (r/OutOfTheLoop, r/popculturechat, 
r/UIUC) and Google Trends, then processed by Claude.

---

## Tech Stack

- **News API:** NewsData.io
- **LLM:** Anthropic Claude API (claude-haiku, for Chinese summaries)
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Netlify serverless functions (API proxy + Claude calls)
- **Hosting:** Netlify

---

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| 1 | Live news feed with Chinese summaries | ✅ Done |
| 2 | Culture Decode section | In progress |
| 3 | Content quality filtering (relevant to students) | Planned |
| 4 | Automate daily updates | Planned |
| 5 | User preferences / interest tags | Planned |
| 6 | Mobile app | Maybe |

---

## About the Development Process

I'm using AI tools (Claude mostly) to help write the code. I'm not 
a trained software engineer — my background is in data science, so I 
can write Python for analysis but I haven't built a full web app 
before. AI helps fill in the gaps. I still make all the product 
decisions, figure out what to build next, and debug things when they 
break. The commit history shows how the project actually got built.

---

## About Me

I'm a first-year student at UIUC. This is my first full independent 
project. I'm mainly building it because I want to use it — I'm the 
target user, and the first test for any feature is whether I'd actually 
open the app to use it.

If you have feedback or ideas, feel free to open an issue.
