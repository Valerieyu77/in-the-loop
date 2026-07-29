const MAX_NEWS_PAGES = 3;
const MAX_CLAUDE_CALLS = 13;

exports.handler = async function(event) {
  const category = event.queryStringParameters?.category;
  let url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&language=en`;
  if (category && category !== 'all') url += `&category=${category}`;

  try {
    // 1. Fetch news — the free NewsData tier only returns ~10 articles per page, so we
    //    follow the nextPage token for a few more pages to build a bigger candidate pool.
    const newsRes = await fetch(url);
    const newsData = await newsRes.json();
    if (newsData.status !== 'success') {
      return { statusCode: 500, body: JSON.stringify(newsData) };
    }

    let allResults = Array.isArray(newsData.results) ? newsData.results.slice() : [];
    let nextPageToken = newsData.nextPage;

    for (let page = 2; page <= MAX_NEWS_PAGES && nextPageToken; page++) {
      try {
        const pageRes = await fetch(`${url}&page=${nextPageToken}`);
        const pageData = await pageRes.json();
        if (pageData.status !== 'success' || !Array.isArray(pageData.results)) break;
        allResults = allResults.concat(pageData.results);
        nextPageToken = pageData.nextPage;
      } catch (e) {
        break; // a later page failing shouldn't fail the whole request — use what we have
      }
    }

    // 2. Dedupe + quality filter, before we spend money calling Claude. Capped at
    //    MAX_CLAUDE_CALLS so the Claude bill stays bounded regardless of pool size.
    const articles = dedupeArticles(allResults)
      .filter(isQualityArticle)
      .slice(0, MAX_CLAUDE_CALLS);

    // 3. Ask Claude to generate a structured Chinese explanation for each article
    const summaryPromises = articles.map(async (article) => {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: `你是一个帮助在美国的中国留学生了解新闻的助手。阅读下面的新闻标题和摘要，只返回一个 JSON 对象，不要用 markdown 代码块包裹，不要输出 JSON 以外的任何文字：

{"headline_explained": "一句话说明这条新闻讲了什么", "why_it_matters": "为什么对在美中国留学生重要或值得了解", "relevance": 1-5 的整数，5=直接影响留学生（签证/学费/校园/移民政策），1=基本无关}

新闻标题：${article.title}
新闻摘要：${article.description || '无'}`
            }]
          })
        });
        const claudeData = await claudeRes.json();
        const parsed = parseClaudeJson(claudeData.content?.[0]?.text);
        if (parsed) {
          article.headline_explained = parsed.headline_explained || '';
          article.why_it_matters = parsed.why_it_matters || '';
          article.relevance = Number.isInteger(parsed.relevance) ? parsed.relevance : null;
        } else {
          applyFallbackSummary(article);
        }
      } catch (e) {
        applyFallbackSummary(article);
      }
      return article;
    });

    const enrichedArticles = await Promise.all(summaryPromises);

    // 4. Drop any article with neither an explanation nor a description — never render an
    //    empty card. Sort what's left by relevance descending, newest pubDate breaks ties.
    newsData.results = enrichedArticles
      .filter(a => a.headline_explained || a.why_it_matters)
      .sort(byRelevanceThenRecency);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      },
      body: JSON.stringify(newsData)
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: e.message })
    };
  }
};

// When the Claude call fails or the response can't be parsed, fall back to the
// article's original English description. If there's no description either,
// headline_explained/why_it_matters both stay empty and the filter above drops
// the article entirely, so we never render an empty card.
function applyFallbackSummary(article) {
  article.headline_explained = article.description || '';
  article.why_it_matters = '';
  article.relevance = null;
}

// Claude sometimes wraps the JSON in a ```json code block or adds stray text
// before/after it. Grabbing everything from the first { to the last } and
// parsing that handles both cases.
function parseClaudeJson(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch (e) {
    return null;
  }
}

function normalizeTitle(title) {
  return (title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Normalized title and URL are both dedup criteria — matching either one counts
// as a duplicate (not a fallback from one to the other). This catches the same
// story reprinted on multiple sites with different links but the same title.
function dedupeArticles(articles) {
  const seenTitles = new Set();
  const seenLinks = new Set();
  const result = [];
  for (const a of articles) {
    const titleKey = normalizeTitle(a.title);
    const linkKey = a.link || '';
    const isDup = (titleKey && seenTitles.has(titleKey)) || (linkKey && seenLinks.has(linkKey));
    if (isDup) continue;
    if (titleKey) seenTitles.add(titleKey);
    if (linkKey) seenLinks.add(linkKey);
    result.push(a);
  }
  return result;
}

// Filter out articles with a too-short title, no substantial description, or a
// TV-listing/schedule-style title — these aren't worth paying to have Claude explain.
function isQualityArticle(article) {
  const title = (article.title || '').trim();
  const description = (article.description || '').trim();
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) return false;
  if (description.length < 60) return false;
  if (/\bon tv\b/i.test(title) || /\btv\s+(schedule|listings?)\b/i.test(title)) return false;
  return true;
}

function byRelevanceThenRecency(a, b) {
  const relA = Number.isInteger(a.relevance) ? a.relevance : 0;
  const relB = Number.isInteger(b.relevance) ? b.relevance : 0;
  if (relB !== relA) return relB - relA;
  const timeA = Date.parse(a.pubDate) || 0;
  const timeB = Date.parse(b.pubDate) || 0;
  return timeB - timeA;
}