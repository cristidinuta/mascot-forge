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
  args: {
    projectId: v.id("projects"),
    mascotAssetId: v.id("assets"),
    poses: v.array(v.string()),
  },
  handler: async (ctx, { projectId, mascotAssetId, poses }) => {
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
      poses.map(async (poseName: string) => {
        const pose = poseName as Pose;
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
      stage: "poses",
    });
  },
});

// Refine one generated pose while leaving every other model-sheet asset intact.
export const refine = action({
  args: {
    projectId: v.id("projects"),
    sourceAssetId: v.id("assets"),
    instruction: v.string(),
  },
  handler: async (ctx, { projectId, sourceAssetId, instruction }) => {
    const source = await ctx.runQuery(internal.assets.getInternal, {
      id: sourceAssetId,
    });
    if (
      !source?.storageId ||
      source.projectId !== projectId ||
      source.kind !== "pose" ||
      !source.pose
    ) {
      throw new Error("Source pose is unavailable.");
    }

    const assetId = await ctx.runMutation(internal.assets.create, {
      projectId,
      kind: "pose",
      pose: source.pose,
      label: instruction.slice(0, 40),
      sourceAssetId,
    });

    try {
      const blob = await ctx.storage.get(source.storageId);
      if (!blob) throw new Error("Source pose image is missing.");
      const reference = Buffer.from(await blob.arrayBuffer());
      const png = await editPose(
        reference,
        `Keep this exact same character and retain the existing ${source.pose} pose. ` +
          `Apply only this requested change: ${instruction}. ` +
          `Keep the design, colors, proportions, illustration style, and all unmentioned details unchanged. ` +
          `Centered, full body, transparent background, no scene, no text, no shadow.`
      );
      const storageId = await ctx.storage.store(
        new Blob([png], { type: "image/png" })
      );
      await ctx.runMutation(internal.assets.setReady, {
        id: assetId,
        storageId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.assets.setError, {
        id: assetId,
        error: message,
      });
    }

    return null;
  },
});
