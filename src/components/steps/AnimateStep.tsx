import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

export function AnimateStep({ project }: { project: Doc<"projects"> }) {
  const start = useAction(api.animate.start);
  const buildSpec = useAction(api.spec.build);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const [startingPoseId, setStartingPoseId] = useState<string | null>(null);

  const poses = (assets ?? []).filter((a: Doc<"assets">) => a.kind === "pose");
  const videoFor = (pose?: string): Doc<"assets"> | undefined =>
    (assets ?? [])
      .filter(
        (asset: Doc<"assets">) =>
          asset.kind === "video" && asset.pose === pose
      )
      .sort((a: Doc<"assets">, b: Doc<"assets">) => b._creationTime - a._creationTime)[0];

  async function startAnimation(pose: Doc<"assets">) {
    setStartingPoseId(pose._id);
    try {
      await start({ projectId: project._id, poseAssetId: pose._id });
    } finally {
      setStartingPoseId(null);
    }
  }

  return (
    <div className="p-10">
      <Annot>05 — motion</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-1">
        Add subtle life
      </h2>
      <p className="text-ink45 text-sm mb-8 max-w-xl">
        Higgsfield animates each pose into a short MP4 with a tailored gesture.
        Jobs run async — they fill in as they finish. Animate just the poses you
        need for the demo; you don't have to do all five.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {poses.map((pose: Doc<"assets">) => {
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
                {video?.status === "error" && (
                  <div className="absolute inset-x-3 bottom-3 border border-signal/40 bg-paper/95 px-3 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-label text-signal">
                      Animation failed
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-ink70 break-words">
                      {video.error ?? "The video provider returned an error."}
                    </div>
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
                    disabled={
                      video?.status === "working" ||
                      startingPoseId === pose._id
                    }
                    onClick={() => void startAnimation(pose)}
                    className="font-mono text-[11px] uppercase tracking-label text-signal disabled:opacity-40"
                  >
                    {startingPoseId === pose._id
                      ? "Starting…"
                      : video?.status === "error"
                        ? "Retry"
                        : "Animate"}
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
