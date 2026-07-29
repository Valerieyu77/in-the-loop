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

    const articles = dedupeArticles(newsData.results).slice(0, 9);

    // 2. 用 Claude 给每条新闻生成结构化中文解读
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

    // 3. 解读和原始描述都没有的文章直接丢弃，不能出现空卡片
    newsData.results = enrichedArticles.filter(a => a.headline_explained || a.why_it_matters);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
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

// 按 URL 去重；URL 缺失时按标题归一化后去重。
function dedupeArticles(articles) {
  const seen = new Set();
  const result = [];
  for (const a of articles) {
    const key = a.link ? `link:${a.link}` : `title:${normalizeTitle(a.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(a);
  }
  return result;
}