import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Annot, Button, ErrorNote, Spinner } from "../ui";

export function MascotStep({ project }: { project: Doc<"projects"> }) {
  const generate = useAction(api.mascot.generate);
  const iterate = useAction(api.mascot.iterate);
  const approve = useMutation(api.projects.setApproved);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const [instruction, setInstruction] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [hideOldVersions, setHideOldVersions] = useState(false);
  const kicked = useRef(false);

  const mascots = (assets ?? []).filter((a) => a.kind === "mascot");

  // Auto-generate the first mascot once the direction is locked.
  useEffect(() => {
    if (
      project.answers &&
      assets &&
      mascots.length === 0 &&
      project.status !== "working" &&
      !kicked.current
    ) {
      kicked.current = true;
      void generate({ projectId: project._id });
    }
  }, [project.answers, assets, mascots.length, project.status]);

  // Default selection to the newest ready mascot.
  useEffect(() => {
    const ready = mascots.filter((m) => m.status === "ready");
    if (ready.length && !selected) setSelected(ready[ready.length - 1]._id);
  }, [mascots, selected]);

  useEffect(() => {
    if (mascots.length > 1 && selected) {
      const ready = mascots.filter((m) => m.status === "ready");
      if (ready.length) {
        setSelected(ready[ready.length - 1]._id);
        setHideOldVersions(true);
      }
    }
  }, [mascots, selected]);

  const displayedMascots =
    hideOldVersions && selected
      ? mascots.filter((m) => m._id === selected)
      : mascots;

  return (
    <div className="p-10 max-w-4xl">
      <Annot>03 — mascot</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-8">
        Generate & refine the character
      </h2>

      {project.status === "error" && (
        <div className="mb-6">
          <ErrorNote message={project.error ?? "Generation failed."} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {displayedMascots.map((m: Doc<"assets">) => (
          <button
            key={m._id}
            onClick={() => m.status === "ready" && setSelected(m._id)}
            className={`relative aspect-square checker border-2 transition-colors ${
              selected === m._id ? "border-signal" : "border-line"
            }`}
          >
            {m.status === "ready" && m.url && (
              <img src={m.url} alt="" className="w-full h-full object-contain develop" />
            )}
            {m.status === "working" && (
              <div className="absolute inset-0 grid place-items-center">
                <Spinner />
              </div>
            )}
            {m.status === "error" && (
              <div className="absolute inset-0 grid place-items-center p-2 text-center font-mono text-[10px] text-signal">
                {m.error}
              </div>
            )}
            {m.label && (
              <span className="absolute bottom-1 left-1 right-1 annot truncate text-ink/50">
                {m.label}
              </span>
            )}
          </button>
        ))}
        {mascots.length === 0 && project.status === "working" && (
          <div className="aspect-square checker border border-line grid place-items-center">
            <Spinner label="Drawing…" />
          </div>
        )}
      </div>

      <div className="mt-8 max-w-xl">
        <Annot>iterate on the selected version</Annot>
        <div className="flex gap-2 mt-2">
          <input
            value={instruction}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstruction(e.target.value)}
            placeholder="rounder body, friendlier eyes, swap to navy blue…"
            className="flex-1 bg-panel border border-line px-4 py-3 font-mono text-[13px] placeholder:text-ink25 focus:border-signal outline-none"
          />
          <Button
            variant="ghost"
            disabled={!selected || !instruction.trim() || project.status === "working"}
            onClick={() => {
              if (!selected) return;
              iterate({
                projectId: project._id,
                sourceAssetId: selected as any,
                instruction: instruction.trim(),
              });
              setInstruction("");
            }}
          >
            Apply edit
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <Button
          disabled={!selected}
          onClick={() =>
            selected && approve({ id: project._id, assetId: selected as any })
          }
        >
          Approve → build model sheet
        </Button>
        {hideOldVersions && (
          <div className="mt-3 text-sm text-ink45">
            The previous version is hidden after refinement.
          </div>
        )}
      </div>
    </div>
  );
}
