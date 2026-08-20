module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const userid = String(req.query.userid || '').trim();
  if (!/^\d{1,7}$/.test(userid)) {
    return res.status(400).json({ ok: false, error: 'Invalid SimBrief Pilot ID' });
  }

  const url =
    'https://www.simbrief.com/api/xml.fetcher.php?userid=' +
    encodeURIComponent(userid) +
    '&json=v2';

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Sierra-Executive-Phenom300/1.0'
      },
      cache: 'no-store'
    });

    const body = await upstream.text();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: 'SimBrief returned HTTP ' + upstream.status,
        details: body.slice(0, 500)
      });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return res.status(502).json({
        ok: false,
        error: 'SimBrief returned an invalid JSON response',
        details: body.slice(0, 500)
      });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: e && e.message ? e.message : 'Unable to reach SimBrief'
    });
  }
};
