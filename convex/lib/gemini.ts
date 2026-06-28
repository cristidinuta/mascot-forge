"use node";
import { GoogleGenAI } from "@google/genai";

// Swap to gemini-3.x variants if you want newer models — isolated here on purpose.
export const TEXT_MODEL = "gemini-2.5-flash";
export const IMAGE_MODEL = "gemini-2.5-flash-image"; // "Nano Banana"

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Run: npx convex env set GEMINI_API_KEY AIza..."
    );
  }
  return new GoogleGenAI({ apiKey });
}

// Strict-JSON text completion. Used for elicitation questions and spec extraction.
export async function chatJSON<T>(
  messages: { role: "system" | "user"; content: string }[]
): Promise<T> {
  const system = messages.find((m) => m.role === "system")?.content;
  const user = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n\n");

  const res = await client().models.generateContent({
    model: TEXT_MODEL,
    contents: user,
    config: {
      ...(system ? { systemInstruction: system } : {}),
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
  const text = res.text ?? "{}";
  return JSON.parse(text) as T;
}

// Pull the first inline image out of a Gemini response.
function extractImage(res: any): Buffer {
  const parts = res?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p?.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
  }
  const said = res?.text ? ` Model returned text instead: ${res.text.slice(0, 200)}` : "";
  throw new Error("Gemini returned no image." + said);
}

// Generate a fresh mascot. Gemini has no transparent-bg flag like GPT Image, so
// we ask for it in the prompt; results are usually a clean isolated character.
export async function generateMascot(prompt: string): Promise<Buffer> {
  const res = await client().models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
  });
  return extractImage(res);
}

// Edit an existing mascot into a new pose. Passing the approved mascot inline as
// the reference is what holds the character consistent — Nano Banana is built
// for exactly this reference-driven editing.
export async function editPose(
  referencePng: Buffer,
  prompt: string
): Promise<Buffer> {
  const res = await client().models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        inlineData: {
          mimeType: "image/png",
          data: referencePng.toString("base64"),
        },
      },
      { text: prompt },
    ],
  });
  return extractImage(res);
}
