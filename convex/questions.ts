"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

type QResp = { questions: { id: string; question: string; options: string[] }[] };

function inferPaletteHint(context: { appName: string; description: string; genre: string }) {
  const text = `${context.appName} ${context.description} ${context.genre}`.toLowerCase();
  if (/(fitness|health|wellness|sport|medical|workout)/i.test(text)) {
    return ["#2E8B57", "#4CAF50", "#A3E635"];
  }
  if (/(finance|bank|wallet|pay|money|crypto)/i.test(text)) {
    return ["#1E3A8A", "#2563EB", "#60A5FA"];
  }
  if (/(travel|map|weather|navigation|tour|food|restaurant|coffee)/i.test(text)) {
    return ["#F59E0B", "#FB923C", "#FDE68A"];
  }
  if (/(music|audio|video|stream|podcast|movie)/i.test(text)) {
    return ["#7C3AED", "#8B5CF6", "#C4B5FD"];
  }
  return ["#0F172A", "#F59E0B", "#F8FAFC"];
}

export const generate = action({
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
      if (!project?.context) throw new Error("Run the App Store lookup first.");

      const palette = inferPaletteHint(project.context);
      const questions: QResp["questions"] = [
        {
          id: "coreNature",
          question: "What is the core nature of the mascot?",
          options: ["Human", "Animal", "Object"],
        },
        {
          id: "shapeLanguage",
          question: "What shape language should guide the mascot silhouette?",
          options: ["Rounded", "Angular", "Playful", "Minimal"],
        },
        {
          id: "colorPalette",
          question: "What color direction should guide the mascot?",
          options: [
            `Use same palette as app (${palette[0]}, ${palette[1]})`,
            "Warm neutrals",
            "Bold contrast",
            "Soft pastels",
          ],
        },
      ];

      await ctx.runMutation(internal.projects.setQuestions, {
        id: projectId,
        questions,
      });
    } catch (e: any) {
      await ctx.runMutation(internal.projects.setStatus, {
        id: projectId,
        status: "error",
        error: e.message ?? String(e),
      });
    }
  },
});
