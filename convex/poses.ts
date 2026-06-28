"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { editPose } from "./lib/gemini";
import { posePrompt } from "./lib/prompts";
import { POSES, Pose } from "./lib/constants";

// Generate the full turnaround. Each pose is an edit of the SAME approved
// mascot (passed as the reference image) so the character stays consistent.
// All five fire in parallel to cut wall-clock.
export const generateAll = action({
  args: { projectId: v.id("projects"), mascotAssetId: v.id("assets") },
  handler: async (ctx, { projectId, mascotAssetId }) => {
    const source = await ctx.runQuery(internal.assets.getInternal, {
      id: mascotAssetId,
    });
    if (!source?.storageId) throw new Error("Approved mascot has no image.");

    const blob = await ctx.storage.get(source.storageId);
    if (!blob) throw new Error("Mascot image missing from storage.");
    const reference = Buffer.from(await blob.arrayBuffer());

    await ctx.runMutation(internal.projects.setStatus, {
      id: projectId,
      status: "working",
    });

    await Promise.all(
      POSES.map(async (pose: Pose) => {
        const assetId = await ctx.runMutation(internal.assets.create, {
          projectId,
          kind: "pose",
          pose,
          sourceAssetId: mascotAssetId,
        });
        try {
          const png = await editPose(reference, posePrompt(pose));
          const storageId = await ctx.storage.store(
            new Blob([png], { type: "image/png" })
          );
          await ctx.runMutation(internal.assets.setReady, {
            id: assetId,
            storageId,
          });
        } catch (e: any) {
          await ctx.runMutation(internal.assets.setError, {
            id: assetId,
            error: e.message ?? String(e),
          });
        }
      })
    );

    await ctx.runMutation(internal.projects.setStatus, {
      id: projectId,
      status: "idle",
      stage: "animate",
    });
  },
});
