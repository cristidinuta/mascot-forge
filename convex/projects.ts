import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { appStoreUrl: v.string() },
  handler: async (ctx, { appStoreUrl }) => {
    return await ctx.db.insert("projects", {
      appStoreUrl,
      stage: "context",
      status: "idle",
    });
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const getInternal = internalQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("projects").order("desc").take(20),
});

// ---- internal state writers (called from actions) ----

export const setStatus = internalMutation({
  args: {
    id: v.id("projects"),
    status: v.string(),
    error: v.optional(v.string()),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, error, stage }) => {
    const patch: Record<string, unknown> = { status, error };
    if (stage) patch.stage = stage;
    await ctx.db.patch(id, patch);
  },
});

export const setContext = internalMutation({
  args: { id: v.id("projects"), context: v.any() },
  handler: async (ctx, { id, context }) => {
    await ctx.db.patch(id, { context, stage: "questions", status: "idle" });
  },
});

export const setQuestions = internalMutation({
  args: { id: v.id("projects"), questions: v.any() },
  handler: async (ctx, { id, questions }) => {
    await ctx.db.patch(id, { questions, status: "idle" });
  },
});

export const setAnswers = mutation({
  args: { id: v.id("projects"), answers: v.record(v.string(), v.string()) },
  handler: async (ctx, { id, answers }) => {
    await ctx.db.patch(id, { answers, stage: "mascot" });
  },
});

export const setApproved = mutation({
  args: { id: v.id("projects"), assetId: v.id("assets") },
  handler: async (ctx, { id, assetId }) => {
    await ctx.db.patch(id, { approvedAssetId: assetId, stage: "poses" });
  },
});

export const setStage = mutation({
  args: { id: v.id("projects"), stage: v.string() },
  handler: async (ctx, { id, stage }) => {
    await ctx.db.patch(id, { stage });
  },
});

export const setSpec = internalMutation({
  args: { id: v.id("projects"), spec: v.any() },
  handler: async (ctx, { id, spec }) => {
    await ctx.db.patch(id, { spec, stage: "export", status: "idle" });
  },
});
