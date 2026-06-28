import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { MascotSpec, POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

const FFMPEG_CORE_URL =
  "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

let ffmpegPromise: Promise<
  import("@ffmpeg/ffmpeg").FFmpeg
> | null = null;

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function fetchAndDownload(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  saveBlob(await response.blob(), filename);
}

function downloadJSON(spec: MascotSpec) {
  const blob = new Blob([JSON.stringify(spec, null, 2)], {
    type: "application/json",
  });
  saveBlob(
    blob,
    `${spec.brand.appName.replace(/\s+/g, "-").toLowerCase()}-mascot.spec.json`
  );
}

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${FFMPEG_CORE_URL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_CORE_URL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

async function downloadMOV(url: string, filename: string) {
  const [{ fetchFile }, ffmpeg] = await Promise.all([
    import("@ffmpeg/util"),
    getFFmpeg(),
  ]);
  const inputName = "input.mp4";
  const outputName = "output.mov";

  await ffmpeg.writeFile(inputName, await fetchFile(url));
  try {
    await ffmpeg.exec(["-i", inputName, "-c", "copy", outputName]);
    const output = await ffmpeg.readFile(outputName);
    if (typeof output === "string") {
      throw new Error("FFmpeg returned an unexpected text result.");
    }
    saveBlob(
      new Blob([Uint8Array.from(output)], { type: "video/quicktime" }),
      filename
    );
  } finally {
    await Promise.allSettled([
      ffmpeg.deleteFile(inputName),
      ffmpeg.deleteFile(outputName),
    ]);
  }
}

export function ExportStep({ project }: { project: Doc<"projects"> }) {
  const buildSpec = useAction(api.spec.build);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const spec = project.spec as MascotSpec | undefined;
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  const latestReadyAssets = (kind: "pose" | "video") =>
    (assets ?? []).filter(
      (asset: Doc<"assets">, index, all) =>
        asset.kind === kind &&
        asset.status === "ready" &&
        Boolean(asset.url) &&
        all.findIndex(
          (candidate: Doc<"assets">) =>
            candidate.kind === kind &&
            candidate.status === "ready" &&
            Boolean(candidate.url) &&
            candidate.pose === asset.pose
        ) === index
    );
  const poseAssets = latestReadyAssets("pose");
  const videoAssets = latestReadyAssets("video");

  async function convertToMOV(asset: Doc<"assets">) {
    if (!asset.url) return;
    setConvertingId(asset._id);
    try {
      await downloadMOV(asset.url, `${asset.pose}.mov`);
    } finally {
      setConvertingId(null);
    }
  }

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

      <div className="space-y-8">
        <div>
          <Annot>poses — png (transparent)</Annot>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {poseAssets.map((a: Doc<"assets">) => (
              <div key={a._id} className="overflow-hidden border border-line bg-panel">
                <div className="checker aspect-[3/4]">
                  <img
                    src={a.url}
                    alt={POSE_LABEL[a.pose as Pose] ?? a.pose}
                    className="h-full w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void fetchAndDownload(a.url!, `${a.pose}.png`)
                  }
                  className="w-full border-t border-line px-3 py-2 font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
                >
                  ↓ {POSE_LABEL[a.pose as Pose] ?? a.pose} PNG
                </button>
              </div>
            ))}
          </div>
        </div>

        {videoAssets.length > 0 && (
          <div>
            <Annot>motion — mp4 + mov</Annot>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videoAssets.map((a: Doc<"assets">) => {
                const label = POSE_LABEL[a.pose as Pose] ?? a.pose;
                const converting = convertingId === a._id;
                return (
                  <div key={a._id} className="overflow-hidden border border-line bg-panel">
                    <video
                      src={a.url}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="aspect-[4/3] w-full bg-ink object-contain"
                    />
                    <div className="p-3">
                      <div className="mb-2 font-mono text-[11px] uppercase tracking-label text-ink70">
                        {label}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void fetchAndDownload(a.url!, `${a.pose}.mp4`)
                          }
                          className="flex-1 px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
                        >
                          ↓ MP4
                        </button>
                        <button
                          type="button"
                          disabled={convertingId !== null}
                          onClick={() => void convertToMOV(a)}
                          className="flex-1 px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {converting ? "converting…" : "↓ MOV"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <details className="border-t border-line pt-5">
          <summary className="cursor-pointer text-sm text-ink45 hover:text-ink70">
            Developer export
          </summary>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => downloadJSON(spec)}>
              Download JSON
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}
