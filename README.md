# In the Loop

A news pipeline that reads the day's stories, explains them in Chinese, and scores how much a Chinese student in the US would actually care. There's a reading interface on top of it.

**Live:** [shiny-choux-ebf0e1.netlify.app](https://shiny-choux-ebf0e1.netlify.app)

**Stack:** Python · JavaScript · Claude API · Netlify Functions · NewsData.io

---

## Why I built this

I came to the U.S. for college and ran into a specific kind of gap that existing apps don't really address.

It's not a language problem — my English is fine. It's not a news problem — I can read the NYT if I sit down and force myself. The gap is the everyday cultural context that everyone around me shares and I don't. Someone mentions "bracket busted" at lunch and everyone laughs. A classmate references a TikTok I've never seen. My roommate asks if I watched "the game" and I don't even know which sport.

These moments are small, but they pile up. After a while you start nodding along instead of joining in.

The existing tools don't quite fit. NYT and BBC cover world news but not the background that makes a joke land. TikTok and Instagram show you what's trending, but you're just watching things go past — no context for why it matters or how people actually talk about it. Language apps teach vocabulary, not references.

So I built the thing I wanted when I got here.

---

## What it does right now

Pulls news, cleans it, and hands each article to Claude with instructions to come back with three things: what happened, why a Chinese student here might care, and a 1–5 relevance score. The score decides what goes on the front page.

That's the whole product today. It runs every day and it works.

---

## How it works

```
NewsData.io REST API                     scripts/fetch_news.py
  /api/1/latest, paginated                 BBC World RSS → data/news.json
        │                                    (standalone — see below)
        ▼
  ┌──────────────────────────────────────────────────┐
  │  netlify/functions/news.js                       │
  │                                                  │
  │  1. Ingest    up to 3 pages via nextPage         │
  │  2. Dedupe    normalized title + link            │
  │  3. Filter    drop the junk                      │
  │  4. Enrich    Claude → structured JSON           │
  │  5. Order     by relevance score                 │
  │  6. Shape     normalize to internal schema       │
  │  7. Cache     s-maxage=3600 at the CDN           │
  └──────────────────────────────────────────────────┘
        │
        ▼
  public/index.html    hero + side rail + grid, category tabs
```

### 1 · Ingest

One request to NewsData's `latest` endpoint gives you about ten articles, which isn't enough once filtering starts eating them. So the function follows the `nextPage` token up to three times and merges everything. If page two or three fails, it breaks the loop and works with what it got — one flaky request shouldn't take down the whole response.

### 2 · Dedupe

Normalized title and link are checked as two **independent** conditions, and there's a reason for that. Wire copy gets republished by a dozen outlets under a dozen different URLs with the identical headline. Keying on URL alone, I had the same story about a bank's quarterly results show up **three times on one page**. Titles now get lowercased, stripped of punctuation, and whitespace-collapsed before comparison.

### 3 · Filter

Out go titles under five words, missing or very short descriptions, and anything that looks like a TV schedule. The first version had no filter at all, which meant I was paying Claude to write thoughtful bilingual analysis of a page listing what's on television tonight.

### 4 · Enrich

Each surviving article goes to Claude Haiku, which is told to return JSON and nothing else:

```json
{
  "headline_explained": "what the story says",
  "why_it_matters":     "why it matters to a Chinese student in the US",
  "relevance":          1
}
```

Before this, the prompt just asked for a summary in prose. Two problems: raw markdown asterisks leaked onto the page, and every article came back in a slightly different shape — some with a heading, some with bold labels, some with neither. Structured output fixed the rendering and gave me the relevance score for free, since I was already making the call.

Parsing is deliberately forgiving. The response gets narrowed to the span between the first `{` and the last `}` before `JSON.parse`, which handles code fences and any stray "Sure, here's the analysis:" in one move. If parsing fails anyway, the article falls back to its English description. If even that's missing, the article gets dropped instead of rendering as an empty card — which it used to do, and it looked broken.

Enrichment is capped at 13 calls per request. The cap lives in exactly one `slice()`, so it can't quietly drift.

### 5 · Order

Sorted by relevance, ties broken by publish time. Before this the front page was just whatever order the API happened to return, which is how I ended up with a hero story about an insurance executive's promotion — with a Claude summary underneath politely explaining that it had nothing to do with students.

Crime-category articles are also kept out of the hero slot and never render their images. This rule exists because the front page briefly featured a mugshot.

### 6 · Shape

The upstream response carries about thirty fields, a bunch of which are just the string `ONLY AVAILABLE IN PAID PLANS`. The function returns the eleven the client actually uses:

| Field | Source |
|---|---|
| `article_id`, `title`, `link`, `description` | upstream |
| `image_url`, `pubDate`, `category`, `source_name` | upstream |
| `headline_explained`, `why_it_matters`, `relevance` | Claude |

Someone else's schema shouldn't leak into my API contract.

### 7 · Cache

`Cache-Control: public, s-maxage=3600, stale-while-revalidate=600`. Repeat visits inside the hour come from the CDN without waking the function or the LLM. The free data tier is already twelve hours behind real time, so an hour of caching costs nothing in freshness and removes nearly all of the redundant spend.

---

## What it doesn't do yet

**The relevance score is measuring the wrong thing.** The prompt asks why a story *matters*, so Claude scores against visas, tuition, and policy. But the gap I described at the top is cultural context — what people around me are actually talking about. Those aren't the same question, and entertainment and pop culture get penalized by the criterion I'm using. The system is reliably deprioritizing the exact content the whole idea depends on. This is a specification problem, not a bug, and it's the most interesting thing wrong with the project.

**Source quality caps everything downstream.** The free tier's candidate pool is mostly press releases, small-town local news, and earnings notices. Ordering works fine — there's just not much student-relevant material in the pool to promote. Some days the top-scoring article is a local scholarship announcement, because that honestly is the most relevant thing available.

**Degradation is silent.** When later pages fail, the pipeline continues with fewer articles by design. But the layout assumes a roughly full set, so a short result renders as big empty regions and a missing section — it looks broken rather than sparse. Nothing errors, which is what makes it easy to miss. It should drop to a compact layout below a threshold and tell the caller it degraded.

**It's a stream, not a dataset.** Articles are enriched in flight and returned as JSON. Nothing is persisted, so nothing can be queried, joined, or looked at historically.

---

## Roadmap

1. Redefine relevance around what peers are currently discussing rather than institutional importance, and evaluate it against a hand-labeled set instead of by squinting at the page
2. Wire the RSS ingester into the serving path so there are genuinely two sources normalized into one schema
3. Persist enriched records somewhere queryable, so this produces a dataset with history
4. Compact-layout fallback plus an explicit degradation flag in the response
5. Build the `ALL` view by composing per-category queries instead of using the undifferentiated feed
6. Cache summaries per article URL, so any given article is enriched once ever instead of once per hour
7. Source allowlist and denylist, based on which domains actually resolve and which are paywalled
8. **Culture Decode** — the part I actually started this for. Pull what's being discussed from Reddit and Google Trends, and for each one give the background, the context, and a few phrases people would really use

---

## Security

Credentials are injected as environment variables (`NEWSDATA_API_KEY`, `ANTHROPIC_KEY`) and aren't in the repo. The client never calls a third-party API directly — its only network request goes to this project's own function — so no key ever reaches the browser.

An earlier revision had the NewsData key hardcoded in source and pushed to a public repo. That key is revoked and replaced; the fix is in [PR #1](https://github.com/Valerieyu77/in-the-loop/pull/1).

---

I'm a student at UIUC and this is my first project built end to end. I'm also the target user, so the first test for any feature is whether I'd open the app myself. Feedback and issues welcome.
