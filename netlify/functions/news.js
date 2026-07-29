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

    const articles = newsData.results.slice(0, 9);

    // 2. 用 Claude 给每条新闻生成中文摘要
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
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `你是一个帮助在美国的中国留学生了解新闻的助手。用2-3句中文简明解释这条新闻：标题是什么，为什么对留学生重要或值得知道。不要废话，直接说。

新闻标题：${article.title}
新闻摘要：${article.description || '无'}`
            }]
          })
        });
        const claudeData = await claudeRes.json();
        article.chinese_summary = claudeData.content?.[0]?.text || '';
      } catch (e) {
        article.chinese_summary = '';
      }
      return article;
    });

    const enrichedArticles = await Promise.all(summaryPromises);
    newsData.results = enrichedArticles;

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