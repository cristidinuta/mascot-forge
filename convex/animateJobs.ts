import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createJob = internalMutation({
  args: {
    projectId: v.id("projects"),
    assetId: v.id("assets"),
    externalId: v.string(),
    pollingUrl: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("jobs", {
      ...args,
      provider: "higgsfield",
      status: "processing",
      attempts: 0,
    }),
});

export const getJob = internalQuery({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const setJobStatus = internalMutation({
  args: {
    id: v.id("jobs"),
    status: v.string(),
    bumpAttempt: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, status, bumpAttempt }) => {
    const job = await ctx.db.get(id);
    await ctx.db.patch(id, {
      status,
      attempts: (job?.attempts ?? 0) + (bumpAttempt ? 1 : 0),
    });
  },
});
