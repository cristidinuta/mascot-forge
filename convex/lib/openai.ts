"use node";
import OpenAI, { toFile } from "openai";

// Swap these as newer models ship — they're isolated here on purpose.
export const TEXT_MODEL = "gpt-4o";
export const IMAGE_MODEL = "gpt-image-1.5"; // GPT Image 1.5 (Dec 2025). Requires org verification.

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Run: npx convex env set OPENAI_API_KEY sk-..."
    );
  }
  return new OpenAI({ apiKey });
}

// Strict-JSON chat completion. Used for elicitation questions and spec extraction.
export async function chatJSON<T>(
  messages: { role: "system" | "user"; content: string }[]
): Promise<T> {
  const res = await client().chat.completions.create({
    model: TEXT_MODEL,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as T;
}

// Generate a fresh mascot on a transparent background. Returns PNG bytes.
export async function generateMascot(prompt: string): Promise<Buffer> {
  const res = await client().images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: "1024x1024",
    background: "transparent",
    output_format: "png",
    n: 1,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data.");
  return Buffer.from(b64, "base64");
}

// Edit an existing mascot into a new pose. Passing the approved mascot as the
// reference image is what holds the character consistent across poses.
export async function editPose(
  referencePng: Buffer,
  prompt: string
): Promise<Buffer> {
  const image = await toFile(referencePng, "mascot.png", { type: "image/png" });
  const res = await client().images.edit({
    model: IMAGE_MODEL,
    image,
    prompt,
    size: "1024x1024",
    background: "transparent",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image edit returned no data.");
  return Buffer.from(b64, "base64");
}
