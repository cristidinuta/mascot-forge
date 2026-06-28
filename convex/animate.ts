"use node";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { submitVideo, pollVideo } from "./lib/higgsfield";
import { motionPrompt } from "./lib/prompts";

const MAX_ATTEMPTS = 60; // ~5 min at 5s intervals
const POLL_MS = 5000;

// Kick off an image-to-video job for one pose. Returns immediately; the result
// arrives later via the scheduled poll loop (Higgsfield is async).
export const start = action({
  args: { projectId: v.id("projects"), poseAssetId: v.id("assets") },
  handler: async (ctx, { projectId, poseAssetId }) => {
    const pose = await ctx.runQuery(internal.assets.getInternal, {
      id: poseAssetId,
    });
    if (!pose?.storageId) throw new Error("Pose has no image to animate.");

    const imageUrl = await ctx.runQuery(internal.assets.getUrlInternal, {
      storageId: pose.storageId,
    });
    if (!imageUrl) throw new Error("Could not get a public URL for the pose.");

    const videoAsset = await ctx.runMutation(internal.assets.create, {
      projectId,
      kind: "video",
      pose: pose.pose,
      sourceAssetId: poseAssetId,
    });

    try {
      const { externalId, pollingUrl } = await submitVideo(
        imageUrl,
        motionPrompt(pose.pose ?? "wave")
      );
      const jobId = await ctx.runMutation(internal.animateJobs.createJob, {
        projectId,
        assetId: videoAsset,
        externalId,
        pollingUrl,
      });
      await ctx.scheduler.runAfter(POLL_MS, internal.animate.poll, { jobId });
    } catch (e: any) {
      await ctx.runMutation(internal.assets.setError, {
        id: videoAsset,
        error: e.message ?? String(e),
      });
    }
  },
});

export const poll = internalAction({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runQuery(internal.animateJobs.getJob, { id: jobId });
    if (!job || job.status === "done" || job.status === "error") return;

    if (job.attempts >= MAX_ATTEMPTS) {
      await ctx.runMutation(internal.animateJobs.setJobStatus, {
        id: jobId,
        status: "error",
      });
      await ctx.runMutation(internal.assets.setError, {
        id: job.assetId,
        error: "Video timed out.",
      });
      return;
    }

    try {
      const result = await pollVideo(job.pollingUrl!);

      if (result.status === "processing") {
        await ctx.runMutation(internal.animateJobs.setJobStatus, {
          id: jobId,
          status: "processing",
          bumpAttempt: true,
        });
        await ctx.scheduler.runAfter(POLL_MS, internal.animate.poll, { jobId });
        return;
      }

      if (result.status === "error") {
        await ctx.runMutation(internal.animateJobs.setJobStatus, {
          id: jobId,
          status: "error",
        });
        await ctx.runMutation(internal.assets.setError, {
          id: job.assetId,
          error: result.error,
        });
        return;
      }

      // Done — pull the MP4 into Convex storage so exports are self-contained.
      const res = await fetch(result.videoUrl);
      if (!res.ok) {
        throw new Error(`Video download failed: ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const storageId = await ctx.storage.store(
        new Blob([buf], { type: "video/mp4" })
      );
      await ctx.runMutation(internal.assets.setReady, {
        id: job.assetId,
        storageId,
      });
      await ctx.runMutation(internal.animateJobs.setJobStatus, {
        id: jobId,
        status: "done",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Animation polling failed.";
      await ctx.runMutation(internal.animateJobs.setJobStatus, {
        id: jobId,
        status: "error",
      });
      await ctx.runMutation(internal.assets.setError, {
        id: job.assetId,
        error: message,
      });
    }
  },
});
