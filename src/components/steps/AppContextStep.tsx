import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Annot, Button, ErrorNote, Spinner } from "../ui";

export function AppContextStep({ project }: { project: Doc<"projects"> }) {
  const lookup = useAction(api.appContext.lookupAppStore);
  const ctx = project.context;

  return (
    <div className="p-10 max-w-3xl">
      <Annot>01 — app context</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-8">
        What we're designing for
      </h2>

      {project.status === "working" && !ctx && (
        <Spinner label="Reading the App Store…" />
      )}
      {project.status === "error" && (
        <div className="space-y-4">
          <ErrorNote message={project.error ?? "Lookup failed."} />
          <Button
            variant="ghost"
            onClick={() => lookup({ projectId: project._id })}
          >
            Retry lookup
          </Button>
        </div>
      )}

      {ctx && (
        <div className="develop">
          <div className="flex gap-5 items-start">
            {ctx.iconUrl && (
              <img
                src={ctx.iconUrl}
                alt=""
                className="w-20 h-20 rounded-2xl border border-line"
              />
            )}
            <div>
              <div className="font-display font-bold text-2xl">{ctx.appName}</div>
              <Annot>{ctx.genre}</Annot>
            </div>
          </div>
          <p className="text-ink70 leading-relaxed mt-6 text-sm whitespace-pre-line">
            {ctx.description.slice(0, 700)}
            {ctx.description.length > 700 ? "…" : ""}
          </p>
          {ctx.screenshotUrls && ctx.screenshotUrls.length > 0 && (
            <div className="flex gap-3 mt-6 overflow-x-auto">
              {ctx.screenshotUrls.map((s) => (
                <img
                  key={s}
                  src={s}
                  alt=""
                  className="h-44 border border-line rounded-lg"
                />
              ))}
            </div>
          )}
          <p className="annot mt-8">
            Direction questions are next — pick the character's vibe.
          </p>
        </div>
      )}
    </div>
  );
}
