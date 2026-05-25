exports.handler = async function(event) {
  const category = event.queryStringParameters?.category;
  let url = `https://newsdata.io/api/1/news?apikey=pub_00ffcd0d92754b768fa2a89fd3b172bd&language=en&size=15`;
  if (category && category !== 'all') url += `&category=${category}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: e.message })
    };
  }
};