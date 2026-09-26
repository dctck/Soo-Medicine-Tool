import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("soo-cms", { consistency: "strong" });
  if (req.method === "GET") {
    const data = await store.get("cms-data", { type: "json" });
    return Response.json(data || null);
  }
  if (req.method === "POST") {
    const data = await req.json();
    await store.setJSON("cms-data", data);
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
};