import { getStore } from "@netlify/blobs";

const STORE = "soo-media";
const INDEX_KEY = "_media-index";

function safeName(name = "image") {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120);
}

export default async (req) => {
  const store = getStore(STORE, { consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const index = await store.get(INDEX_KEY, { type: "json" }) || [];
    return Response.json({ media: index });
  }

  if (req.method === "POST") {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "파일이 없습니다." }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "현재는 이미지만 업로드할 수 있습니다." }, { status: 415 });
    if (file.size > 12 * 1024 * 1024) return Response.json({ error: "이미지는 12MB 이하로 업로드해 주세요." }, { status: 413 });

    const id = crypto.randomUUID();
    const name = safeName(file.name);
    const key = `file-${id}`;
    await store.set(key, file, { metadata: { name, type: file.type, size: file.size } });

    const item = {
      id, name, type: file.type, size: file.size,
      url: `/.netlify/functions/media-file?id=${encodeURIComponent(id)}`,
      createdAt: new Date().toISOString()
    };
    const index = await store.get(INDEX_KEY, { type: "json" }) || [];
    index.unshift(item);
    await store.setJSON(INDEX_KEY, index);
    return Response.json(item);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id가 필요합니다." }, { status: 400 });
    await store.delete(`file-${id}`);
    const index = await store.get(INDEX_KEY, { type: "json" }) || [];
    await store.setJSON(INDEX_KEY, index.filter(x => x.id !== id));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};