import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

export function AnimateStep({ project }: { project: Doc<"projects"> }) {
  const start = useAction(api.animate.start);
  const buildSpec = useAction(api.spec.build);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });

  const poses = (assets ?? []).filter((a) => a.kind === "pose");
  const videoFor = (pose?: string) =>
    (assets ?? []).find((a) => a.kind === "video" && a.pose === pose);

  return (
    <div className="p-10">
      <Annot>05 — motion</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-1">
        Add subtle life
      </h2>
      <p className="text-ink45 text-sm mb-8 max-w-xl">
        Higgsfield animates each pose into a short MP4 (ambient idle motion).
        Jobs run async — they fill in as they finish. Animate just the poses you
        need for the demo; you don't have to do all five.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {poses.map((pose) => {
          const video = videoFor(pose.pose);
          return (
            <div key={pose._id} className="border border-line bg-panel">
              <div className="checker aspect-[3/4] relative">
                {video?.status === "ready" && video.url ? (
                  <video
                    src={video.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : pose.url ? (
                  <img
                    src={pose.url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : null}
                {video?.status === "working" && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/40">
                    <Spinner label="Rendering…" />
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-label text-ink45">
                  {POSE_LABEL[pose.pose as Pose] ?? pose.pose}
                </span>
                {video?.status === "ready" ? (
                  <span className="font-mono text-[10px] text-ok uppercase">
                    ✓ mp4
                  </span>
                ) : (
                  <button
                    disabled={video?.status === "working"}
                    onClick={() =>
                      start({ projectId: project._id, poseAssetId: pose._id })
                    }
                    className="font-mono text-[11px] uppercase tracking-label text-signal disabled:opacity-40"
                  >
                    Animate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <Button onClick={() => buildSpec({ projectId: project._id })}>
          Assemble spec → export
        </Button>
      </div>
    </div>
  );
}
