"use node";

// Higgsfield has no simple first-party developer API — access runs through a
// gateway (WaveSpeed / Segmind / Pixazo). This file is written against the
// WaveSpeed DoP (image-to-video) shape and isolates every provider-specific
// detail so you can swap gateways by editing only this file.
//
//   npx convex env set HIGGSFIELD_API_KEY   <your gateway key>
//   npx convex env set HIGGSFIELD_BASE_URL  https://api.wavespeed.ai/api/v3
//
// NOTE: the gateway fetches the input image by URL, so pass a public Convex
// storage URL (ctx.storage.getUrl(...)), not raw bytes.

function base() {
  const url = process.env.HIGGSFIELD_BASE_URL;
  if (!url) throw new Error("HIGGSFIELD_BASE_URL is not set.");
  return url.replace(/\/$/, "");
}
function key() {
  const k = process.env.HIGGSFIELD_API_KEY;
  if (!k) throw new Error("HIGGSFIELD_API_KEY is not set.");
  return k;
}

export type SubmitResult = { externalId: string; pollingUrl: string };

// Submit an image-to-video job. Returns an id + a URL to poll.
export async function submitVideo(
  imageUrl: string,
  prompt: string
): Promise<SubmitResult> {
  const res = await fetch(`${base()}/higgsfield/dop/image-to-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({
      input_images: [imageUrl],
      prompt,
      model: "dop-turbo",
      motions: [{ motion: "Subtle Idle", strength: 0.4 }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Higgsfield submit failed: ${res.status} ${await res.text()}`);
  }
  const data: any = await res.json();
  // WaveSpeed returns { data: { id } }; other gateways return request_id/polling_url.
  const externalId = data?.data?.id ?? data?.request_id ?? data?.id;
  const pollingUrl =
    data?.polling_url ??
    data?.data?.urls?.get ??
    `${base()}/predictions/${externalId}/result`;
  if (!externalId) throw new Error(`Unexpected submit response: ${JSON.stringify(data)}`);
  return { externalId, pollingUrl };
}

export type PollResult =
  | { status: "processing" }
  | { status: "done"; videoUrl: string }
  | { status: "error"; error: string };

// Check a job. Normalizes the various gateway status vocabularies.
export async function pollVideo(pollingUrl: string): Promise<PollResult> {
  const res = await fetch(pollingUrl, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  if (!res.ok) {
    return { status: "error", error: `poll ${res.status}` };
  }
  const data: any = await res.json();
  const raw = (data?.status ?? data?.data?.status ?? "").toString().toLowerCase();

  if (["completed", "succeeded", "done", "success"].includes(raw)) {
    const videoUrl =
      data?.data?.outputs?.[0] ??
      data?.output?.[0] ??
      data?.video_url ??
      data?.data?.video_url;
    if (!videoUrl) return { status: "error", error: "completed but no video url" };
    return { status: "done", videoUrl };
  }
  if (["failed", "error", "canceled"].includes(raw)) {
    return { status: "error", error: raw };
  }
  return { status: "processing" };
}
