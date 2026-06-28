import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { MascotSpec, POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

function downloadJSON(spec: MascotSpec) {
  const blob = new Blob([JSON.stringify(spec, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${spec.brand.appName.replace(/\s+/g, "-").toLowerCase()}-mascot.spec.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportStep({ project }: { project: Doc<"projects"> }) {
  const buildSpec = useAction(api.spec.build);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const spec = project.spec as MascotSpec | undefined;

  if (!spec) {
    return (
      <div className="p-10 max-w-2xl">
        <Annot>06 — export</Annot>
        <h2 className="font-display font-bold text-3xl mt-2 mb-6">
          Assemble the spec
        </h2>
        {project.status === "working" ? (
          <Spinner label="Building MascotSpec…" />
        ) : (
          <Button onClick={() => buildSpec({ projectId: project._id })}>
            Build MascotSpec
          </Button>
        )}
      </div>
    );
  }

  const poseAssets = (assets ?? []).filter((a) => a.kind === "pose" && a.url);
  const videoAssets = (assets ?? []).filter((a) => a.kind === "video" && a.url);

  return (
    <div className="p-10 max-w-5xl">
      <Annot>06 — export</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-1">
        {spec.mascot.name}
      </h2>
      <p className="text-ink45 text-sm mb-8">
        {spec.domain} · noun: {spec.noun} ·{" "}
        {spec.mascot.personality.join(", ")}
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Files */}
        <div className="space-y-6">
          <div>
            <Annot>behavior contract</Annot>
            <div className="mt-2">
              <Button onClick={() => downloadJSON(spec)}>
                ↓ MascotSpec.json
              </Button>
            </div>
          </div>

          <div>
            <Annot>poses — png (transparent)</Annot>
            <div className="flex flex-wrap gap-2 mt-2">
              {poseAssets.map((a) => (
                <a
                  key={a._id}
                  href={a.url!}
                  download={`${a.pose}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
                >
                  ↓ {POSE_LABEL[a.pose as Pose] ?? a.pose}
                </a>
              ))}
            </div>
          </div>

          {videoAssets.length > 0 && (
            <div>
              <Annot>motion — mp4</Annot>
              <div className="flex flex-wrap gap-2 mt-2">
                {videoAssets.map((a) => (
                  <a
                    key={a._id}
                    href={a.url!}
                    download={`${a.pose}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
                  >
                    ↓ {POSE_LABEL[a.pose as Pose] ?? a.pose}.mp4
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <Annot>brand palette (inferred)</Annot>
            <div className="flex gap-2 mt-2">
              {[spec.brand.primary, spec.brand.secondary, ...spec.brand.palette].map(
                (c, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="w-10 h-10 border border-line"
                      style={{ background: c }}
                    />
                    <div className="font-mono text-[9px] text-ink45 mt-1">{c}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Spec preview */}
        <div>
          <Annot>spec preview</Annot>
          <pre className="mt-2 bg-panel border border-line p-4 text-[11px] font-mono text-ink70 overflow-auto max-h-[520px]">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
