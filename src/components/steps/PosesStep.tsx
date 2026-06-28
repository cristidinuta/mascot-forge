import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { POSES, POSE_LABEL, Pose } from "../../types";
import { Annot, Button, Spinner } from "../ui";

export function PosesStep({ project }: { project: Doc<"projects"> }) {
  const generateAll = useAction(api.poses.generateAll);
  const refine = useAction(api.poses.refine);
  const setStage = useMutation(api.projects.setStage);
  const assets = useQuery(api.assets.listForProject, { projectId: project._id });
  const kicked = useRef(false);
  const [editingPose, setEditingPose] = useState<Doc<"assets"> | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const selectedPoses = [
    ...(project.answers?.selectedPoses?.split(";").filter(Boolean) ?? []),
    ...(project.answers?.customPoses?.split(";").filter(Boolean) ?? []),
  ].filter(Boolean);
  const requestedPoses = selectedPoses.length > 0 ? selectedPoses : POSES;
  const poses = (assets ?? []).filter((a: Doc<"assets">) => a.kind === "pose");
  const byPose = (p: string) => poses.find((a: Doc<"assets">) => a.pose === p);

  useEffect(() => {
    if (
      project.approvedAssetId &&
      project.stage === "poses" &&
      assets &&
      poses.length === 0 &&
      project.status !== "working" &&
      !kicked.current &&
      requestedPoses.length > 0
    ) {
      kicked.current = true;
      void generateAll({
        projectId: project._id,
        mascotAssetId: project.approvedAssetId,
        poses: requestedPoses,
      });
    }
  }, [project.approvedAssetId, project.stage, assets, poses.length, project.status, requestedPoses]);

  const allReady =
    requestedPoses.length > 0 &&
    requestedPoses.every((pose) =>
      poses.some((p) => p.pose === pose && p.status === "ready")
    );

  async function submitPoseEdit() {
    const instruction = editInstruction.trim();
    if (!editingPose || !instruction || submittingEdit) return;
    setSubmittingEdit(true);
    try {
      await refine({
        projectId: project._id,
        sourceAssetId: editingPose._id,
        instruction,
      });
      setEditingPose(null);
      setEditInstruction("");
    } finally {
      setSubmittingEdit(false);
    }
  }

  return (
    <div className="p-10">
      <Annot>04 — model sheet</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-1">
        {project.context?.appName} — turnaround
      </h2>
      <p className="text-ink45 text-sm mb-8 max-w-xl">
        Each pose is the same approved character, re-posed via reference-image
        edits so the identity holds. The turnaround follows the actions you picked
        on the mascot page.
      </p>

      <div className="reg relative sheet shadow-sheet p-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {requestedPoses.map((p: string) => {
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
                    {POSE_LABEL[p as Pose] ?? p}
                  </span>
                  <span className="font-mono text-[10px] text-ink/30">
                    {String(requestedPoses.indexOf(p) + 1).padStart(2, "0")}
                  </span>
                </figcaption>
                {a?.status === "ready" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPose(a);
                      setEditInstruction("");
                    }}
                    className="mt-2 self-start rounded-full border border-line px-3 py-1.5 text-xs text-ink70 transition-colors hover:bg-panel2"
                  >
                    Edit pose
                  </button>
                )}
              </figure>
            );
          })}
        </div>
      </div>

      {requestedPoses.length === 0 && (
        <div className="mt-6 text-sm text-ink45">
          Pick at least one action on the mascot step to build the model sheet.
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button
          disabled={!allReady}
          onClick={() => setStage({ id: project._id, stage: "animate" })}
        >
          Next: add motion
        </Button>
        {!allReady && (
          <Button
            variant="ghost"
            onClick={() =>
              generateAll({
                projectId: project._id,
                mascotAssetId: project.approvedAssetId as any,
                poses: requestedPoses,
              })
            }
          >
            Generate model sheet
          </Button>
        )}
        {!allReady && <Spinner label="Posing the character…" />}
      </div>

      {editingPose && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pose-edit-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submittingEdit) {
              setEditingPose(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-[28px] border border-line bg-paper p-6 shadow-sheet">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Annot>edit one pose</Annot>
                <h3
                  id="pose-edit-title"
                  className="mt-2 font-display text-xl font-bold"
                >
                  {POSE_LABEL[editingPose.pose as Pose] ?? editingPose.pose}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPose(null)}
                disabled={submittingEdit}
                className="rounded-full px-2 py-1 text-ink45 disabled:opacity-40"
                aria-label="Close pose editor"
              >
                ×
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-panel2 px-4 py-3 text-sm text-ink70">
              Describe what you want changed in this pose. The other poses will
              stay unchanged.
            </div>
            <form
              className="mt-3 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void submitPoseEdit();
              }}
            >
              <input
                autoFocus
                value={editInstruction}
                onChange={(event) => setEditInstruction(event.target.value)}
                placeholder="Raise the hand higher, make the expression happier…"
                disabled={submittingEdit}
                className="flex-1 rounded-full border border-line bg-panel px-4 py-3 text-sm text-ink70 outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              />
              <Button
                type="submit"
                disabled={!editInstruction.trim() || submittingEdit}
              >
                {submittingEdit ? "Regenerating…" : "Regenerate"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
