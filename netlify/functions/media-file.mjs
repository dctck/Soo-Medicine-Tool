import { getStore } from "@netlify/blobs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const store = getStore("soo-media");
  const entry = await store.getWithMetadata(`file-${id}`, { type: "blob" });
  if (!entry) return new Response("Not found", { status: 404 });

  return new Response(entry.data, {
    headers: {
      "content-type": entry.metadata?.type || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
};