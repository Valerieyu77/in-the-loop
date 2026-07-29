exports.handler = async function(event) {
  const category = event.queryStringParameters?.category;
  let url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&language=en`;
  if (category && category !== 'all') url += `&category=${category}`;

  try {
    // 1. 拉新闻
    const newsRes = await fetch(url);
    const newsData = await newsRes.json();
    if (newsData.status !== 'success') {
      return { statusCode: 500, body: JSON.stringify(newsData) };
    }

    // 2. 去重 + 质量过滤，在花钱调用 Claude 之前把不值得解读的文章去掉
    const articles = dedupeArticles(newsData.results)
      .filter(isQualityArticle)
      .slice(0, 9);

    // 3. 用 Claude 给每条新闻生成结构化中文解读
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

    // 4. 解读和原始描述都没有的文章直接丢弃，不能出现空卡片；剩下的按 relevance 降序排，
    //    同分按发布时间新的在前
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

// Claude 调用失败或返回内容解析失败时，退回展示文章原始的英文 description。
// 连 description 也没有的话，headline_explained/why_it_matters 都留空，
// 上面的 filter 会把这篇文章整个丢弃，避免渲染出空卡片。
function applyFallbackSummary(article) {
  article.headline_explained = article.description || '';
  article.why_it_matters = '';
  article.relevance = null;
}

// Claude 有时会在 JSON 前后加多余文字，或用 ```json 代码块包裹。
// 直接取第一个 { 到最后一个 } 之间的内容再 parse，两种情况都能容错。
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

// 归一化标题和 URL 都是去重判据，命中任意一个就算重复（不是先后 fallback 关系）。
// 这样同一篇稿子被多个站点转载、链接不同但标题一样时也能去掉。
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

// 过滤掉标题过短、没有实质描述、或像节目表/榜单的文章 —— 这些不值得花钱调 Claude。
function isQualityArticle(article) {
  const title = (article.title || '').trim();
  const description = (article.description || '').trim();
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) return false;
  if (description.length < 100) return false;
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