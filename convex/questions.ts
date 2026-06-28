"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { chatJSON } from "./lib/gemini";
import { questionsPrompt } from "./lib/prompts";

type QResp = { questions: { id: string; question: string; options: string[] }[] };

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

      const out = await chatJSON<QResp>(questionsPrompt(project.context));
      const questions = (out.questions ?? []).slice(0, 3).map((q, i) => ({
        id: q.id || `q${i + 1}`,
        question: q.question,
        options: (q.options ?? []).slice(0, 4),
      }));

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
