import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function extractAppId(url: string): string | null {
  const m = url.match(/id(\d+)/);
  return m ? m[1] : null;
}

// Apple's iTunes Lookup API returns clean JSON with no auth and no CORS pain
// (we call it server-side). Far more reliable than scraping the store page.
export const lookupAppStore = action({
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
      if (!project) throw new Error("Project not found.");

      const appId = extractAppId(project.appStoreUrl);
      if (!appId) {
        throw new Error(
          "Couldn't find an app id in that link. Paste a full App Store URL (it contains /id1234567890)."
        );
      }

      const res = await fetch(`https://itunes.apple.com/lookup?id=${appId}`);
      const data = await res.json();
      const app = data?.results?.[0];
      if (!app) throw new Error("No app found for that id.");

      await ctx.runMutation(internal.projects.setContext, {
        id: projectId,
        context: {
          appName: app.trackName ?? "Unknown app",
          appStoreId: appId,
          description: app.description ?? "",
          genre: app.primaryGenreName ?? "",
          iconUrl: app.artworkUrl512 ?? app.artworkUrl100,
          screenshotUrls: (app.screenshotUrls ?? []).slice(0, 4),
        },
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
