import {
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";

export const listForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    // Attach a fresh URL for anything that has stored bytes.
    return Promise.all(
      assets.map(async (a) => ({
        ...a,
        url: a.storageId ? await ctx.storage.getUrl(a.storageId) : a.url,
      }))
    );
  },
});

export const create = internalMutation({
  args: {
    projectId: v.id("projects"),
    kind: v.string(),
    pose: v.optional(v.string()),
    label: v.optional(v.string()),
    sourceAssetId: v.optional(v.id("assets")),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("assets", { ...args, status: "working" }),
});

export const setReady = internalMutation({
  args: {
    id: v.id("assets"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { id, storageId, url }) => {
    await ctx.db.patch(id, { status: "ready", storageId, url });
  },
});

export const setError = internalMutation({
  args: { id: v.id("assets"), error: v.string() },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, { status: "error", error });
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const getUrlInternal = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.storage.getUrl(storageId),
});
