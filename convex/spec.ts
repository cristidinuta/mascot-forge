"use node";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { chatJSON } from "./lib/gemini";
import { specPrompt } from "./lib/prompts";
import { SPEC_VERSION } from "./lib/constants";

type SpecCore = {
  domain: string;
  noun: string;
  brandColors?: { primary?: string; secondary?: string; palette?: string[] };
  mascot: {
    name: string;
    character: string;
    personality: string[];
    greeting: string;
  };
  actions: {
    id: string;
    archetype: string;
    name: string;
    description: string;
    params: { name: string; type: string }[];
  }[];
  challenges: {
    id: string;
    name: string;
    description: string;
    durationDays: number;
  }[];
};

// Build the full MascotSpec: behavior from the model, brand + asset URLs from
// the project. This object is the single contract the runtime app reads.
export const build = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await ctx.runMutation(internal.projects.setStatus, {
      id: projectId,
      status: "working",
    });
    try {
      const project = await ctx.runQuery(internal.projects.getInternal, {
        id: projectId,
      });
      if (!project?.context) throw new Error("Missing app context.");

      const core = await chatJSON<SpecCore>(
        specPrompt(project.context, project.answers ?? {})
      );

      const assets = await ctx.runQuery(api.assets.listForProject, {
        projectId,
      });
      const poses: Record<string, string> = {};
      const videos: Record<string, string> = {};
      let hero: string | undefined;
      for (const a of assets) {
        if (a.status !== "ready" || !a.url) continue;
        if (a.kind === "pose" && a.pose) poses[a.pose] = a.url;
        if (a.kind === "video" && a.pose) videos[a.pose] = a.url;
        if (a.kind === "mascot" && a._id === project.approvedAssetId) hero = a.url;
      }

      const spec = {
        version: SPEC_VERSION,
        brand: {
          appName: project.context.appName,
          appStoreId: project.context.appStoreId,
          iconUrl: project.context.iconUrl,
          primary: core.brandColors?.primary ?? "#5B8DEF",
          secondary: core.brandColors?.secondary ?? "#15151B",
          palette: core.brandColors?.palette ?? [],
        },
        domain: core.domain,
        noun: core.noun,
        mascot: core.mascot,
        actions: core.actions,
        challenges: core.challenges,
        assets: { hero, poses, videos },
      };

      await ctx.runMutation(internal.projects.setSpec, { id: projectId, spec });
    } catch (e: any) {
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "error",
        error: e.message ?? String(e),
      });
    }
  },
});
