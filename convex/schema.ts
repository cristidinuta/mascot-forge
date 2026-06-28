import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// One row per mascot-generation session. The whole pipeline state lives here.
export default defineSchema({
  projects: defineTable({
    appStoreUrl: v.string(),
    // "context" | "questions" | "mascot" | "poses" | "animate" | "export"
    stage: v.string(),
    status: v.string(), // "idle" | "working" | "error"
    error: v.optional(v.string()),

    // Filled by the App Store lookup.
    context: v.optional(
      v.object({
        appName: v.string(),
        appStoreId: v.string(),
        description: v.string(),
        genre: v.string(),
        iconUrl: v.optional(v.string()),
        screenshotUrls: v.optional(v.array(v.string())),
      })
    ),

    // Elicitation questions the model proposes, plus the user's answers.
    questions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          question: v.string(),
          options: v.array(v.string()),
        })
      )
    ),
    answers: v.optional(v.record(v.string(), v.string())),

    // The approved mascot the poses are derived from.
    approvedAssetId: v.optional(v.id("assets")),

    // Final assembled MascotSpec (also exportable as JSON).
    spec: v.optional(v.any()),
  }),

  // Every generated image / video.
  assets: defineTable({
    projectId: v.id("projects"),
    kind: v.string(), // "mascot" (base/iterations) | "pose" | "video"
    pose: v.optional(v.string()), // wave | point | write | celebrate | think | hero
    label: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    status: v.string(), // "working" | "ready" | "error"
    error: v.optional(v.string()),
    // For poses/videos: which mascot image they were derived from.
    sourceAssetId: v.optional(v.id("assets")),
  }).index("by_project", ["projectId"]),

  // Async video jobs (Higgsfield) we poll until complete.
  jobs: defineTable({
    projectId: v.id("projects"),
    assetId: v.id("assets"),
    provider: v.string(),
    externalId: v.optional(v.string()),
    pollingUrl: v.optional(v.string()),
    status: v.string(), // "queued" | "processing" | "done" | "error"
    attempts: v.number(),
  }).index("by_asset", ["assetId"]),
});
