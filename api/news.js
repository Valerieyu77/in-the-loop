export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { category } = req.query;
  let url = `https://newsdata.io/api/1/news?apikey=pub_00ffcd0d92754b768fa2a89fd3b172bd&language=en&size=15`;
  if (category && category !== 'all') url += `&category=${category}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
}