import { useEffect, useRef } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { POSES, POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

export function PosesStep({ project }: { project: Doc<"projects"> }) {
  const generateAll = useAction(api.poses.generateAll);
  const setStage = useMutation(api.projects.setStage);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const kicked = useRef(false);

  const poses = (assets ?? []).filter((a: Doc<"assets">) => a.kind === "pose");
  const byPose = (p: Pose) => poses.find((a: Doc<"assets">) => a.pose === p);

  useEffect(() => {
    if (
      project.approvedAssetId &&
      assets &&
      poses.length === 0 &&
      project.status !== "working" &&
      !kicked.current
    ) {
      kicked.current = true;
      void generateAll({
        projectId: project._id,
        mascotAssetId: project.approvedAssetId,
      });
    }
  }, [project.approvedAssetId, assets, poses.length, project.status]);

  const allReady =
    poses.length === POSES.length && poses.every((p) => p.status === "ready");

  return (
    <div className="p-10">
      <Annot>04 — model sheet</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-1">
        {project.context?.appName} — turnaround
      </h2>
      <p className="text-ink45 text-sm mb-8 max-w-xl">
        Each pose is the same approved character, re-posed via reference-image
        edits so the identity holds. Same loop every app needs: log · reflect ·
        rally · greet · process.
      </p>

      <div className="reg relative sheet shadow-sheet p-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {POSES.map((p: Pose) => {
            const a = byPose(p);
            return (
              <figure key={p} className="flex flex-col">
                <div className="checker border border-paperline aspect-[3/4] relative">
                  {a?.status === "ready" && a.url && (
                    <img
                      src={a.url}
                      alt={p}
                      className="w-full h-full object-contain develop"
                    />
                  )}
                  {(!a || a.status === "working") && (
                    <div className="absolute inset-0 grid place-items-center">
                      <Spinner />
                    </div>
                  )}
                  {a?.status === "error" && (
                    <div className="absolute inset-0 grid place-items-center p-2 text-center font-mono text-[10px] text-signal">
                      {a.error}
                    </div>
                  )}
                </div>
                <figcaption className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-label text-ink/60">
                    {POSE_LABEL[p]}
                  </span>
                  <span className="font-mono text-[10px] text-ink/30">
                    {String(POSES.indexOf(p) + 1).padStart(2, "0")}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <Button
          disabled={!allReady}
          onClick={() => setStage({ id: project._id, stage: "animate" })}
        >
          Next: add motion
        </Button>
        {!allReady && <Spinner label="Posing the character…" />}
      </div>
    </div>
  );
}
