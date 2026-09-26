const BLOG_ID = "kmd_jjs";
const RSS = `https://rss.blog.naver.com/${BLOG_ID}.xml`;

const decode = (s="") => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'");

const text = (item, tag) => {
  const m = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decode(m[1]).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() : "";
};

export default async () => {
  try {
    const r = await fetch(RSS, { headers: { "user-agent": "SooClinicCMS/1.0" } });
    if (!r.ok) throw new Error(`Naver RSS HTTP ${r.status}`);
    const xml = await r.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
    const posts = items.map(item => ({
      title: text(item,"title"),
      url: text(item,"link"),
      date: text(item,"pubDate"),
      description: text(item,"description")
    })).filter(x => x.url);
    return Response.json({ blogId: BLOG_ID, posts });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
};