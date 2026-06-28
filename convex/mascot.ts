"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateMascot, editPose } from "./lib/gemini";
import { mascotPrompt } from "./lib/prompts";

// Generate a fresh base mascot from context + answers.
export const generate = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.runQuery(internal.projects.getInternal, {
      id: projectId,
    });
    if (!project?.context) throw new Error("Missing app context.");

    const assetId = await ctx.runMutation(internal.assets.create, {
      projectId,
      kind: "mascot",
      pose: "hero",
      label: "Base mascot",
    });
    await ctx.runMutation(internal.projects.setStatus, {
      id: projectId,
      status: "working",
    });

    try {
      const png = await generateMascot(
        mascotPrompt(project.context, project.answers ?? {})
      );
      const storageId = await ctx.storage.store(
        new Blob([png], { type: "image/png" })
      );
      await ctx.runMutation(internal.assets.setReady, { id: assetId, storageId });
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "idle",
      });
    } catch (e: any) {
      await ctx.runMutation(internal.assets.setError, {
        id: assetId,
        error: e.message ?? String(e),
      });
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "error",
        error: e.message ?? String(e),
      });
    }
  },
});

// Iterate: edit an existing mascot image with a free-text instruction. Produces
// a new asset so the user can compare versions and pick the one to approve.
export const iterate = action({
  args: {
    projectId: v.id("projects"),
    sourceAssetId: v.id("assets"),
    instruction: v.string(),
  },
  handler: async (ctx, { projectId, sourceAssetId, instruction }) => {
    const source = await ctx.runQuery(internal.assets.getInternal, {
      id: sourceAssetId,
    });
    if (!source?.storageId) throw new Error("Source mascot has no image.");

    const assetId = await ctx.runMutation(internal.assets.create, {
      projectId,
      kind: "mascot",
      pose: "hero",
      label: instruction.slice(0, 40),
      sourceAssetId,
    });
    await ctx.runMutation(internal.projects.setStatus, {
      id: projectId,
      status: "working",
    });

    try {
      const blob = await ctx.storage.get(source.storageId);
      if (!blob) throw new Error("Source image missing from storage.");
      const buf = Buffer.from(await blob.arrayBuffer());

      const png = await editPose(
        buf,
        `Keep this exact same character. Apply this change: ${instruction}. ` +
          `Same flat style, centered, full body, transparent background, no scene, no text.`
      );
      const storageId = await ctx.storage.store(
        new Blob([png], { type: "image/png" })
      );
      await ctx.runMutation(internal.assets.setReady, { id: assetId, storageId });
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "idle",
      });
    } catch (e: any) {
      await ctx.runMutation(internal.assets.setError, {
        id: assetId,
        error: e.message ?? String(e),
      });
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "error",
        error: e.message ?? String(e),
      });
    }
  },
});
