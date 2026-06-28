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
  const [copied, setCopied] = useState(false);

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

  const poseAssets = (assets ?? []).filter((a: Doc<"assets">) => a.kind === "pose" && a.url);
  const videoAssets = (assets ?? []).filter((a: Doc<"assets">) => a.kind === "video" && a.url);

  async function copySpec() {
    await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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
          <Annot>behavior contract</Annot>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button onClick={() => downloadJSON(spec)}>
              Download JSON
            </Button>
            <Button variant="ghost" onClick={() => void copySpec()}>
              {copied ? "Copied" : "Copy to clipboard"}
            </Button>
          </div>
          <pre className="mt-3 bg-panel border border-line p-3 text-[10px] leading-relaxed font-mono text-ink70 overflow-auto max-h-40">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>

        <div>
          <Annot>poses — png (transparent)</Annot>
          <div className="flex flex-wrap gap-2 mt-2">
            {poseAssets.map((a: Doc<"assets">) => (
              <button
                key={a._id}
                type="button"
                onClick={() =>
                  void fetchAndDownload(a.url!, `${a.pose}.png`)
                }
                className="px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
              >
                ↓ {POSE_LABEL[a.pose as Pose] ?? a.pose}
              </button>
            ))}
          </div>
        </div>

        {videoAssets.length > 0 && (
          <div>
            <Annot>motion — mp4 + mov</Annot>
            <div className="space-y-2 mt-2">
              {videoAssets.map((a: Doc<"assets">) => {
                const label = POSE_LABEL[a.pose as Pose] ?? a.pose;
                const converting = convertingId === a._id;
                return (
                  <div key={a._id} className="flex flex-wrap items-center gap-2">
                    <span className="w-24 font-mono text-[11px] uppercase tracking-label text-ink70">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void fetchAndDownload(a.url!, `${a.pose}.mp4`)
                      }
                      className="px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2"
                    >
                      ↓ MP4
                    </button>
                    <button
                      type="button"
                      disabled={convertingId !== null}
                      onClick={() => void convertToMOV(a)}
                      className="px-3 py-2 border border-line font-mono text-[11px] uppercase tracking-label hover:bg-panel2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {converting ? "converting…" : "↓ MOV"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
