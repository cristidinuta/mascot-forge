import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { STAGES, StageKey } from "./types";
import { Button, Annot } from "./components/ui";
import { AppContextStep } from "./components/steps/AppContextStep";
import { QuestionsStep } from "./components/steps/QuestionsStep";
import { MascotStep } from "./components/steps/MascotStep";
import { PosesStep } from "./components/steps/PosesStep";
import { AnimateStep } from "./components/steps/AnimateStep";
import { ExportStep } from "./components/steps/ExportStep";

export default function App() {
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  if (!projectId) return <Landing onStart={setProjectId} />;
  return <Workspace projectId={projectId} onExit={() => setProjectId(null)} />;
}

function Landing({ onStart }: { onStart: (id: Id<"projects">) => void }) {
  const [url, setUrl] = useState("");
  const create = useMutation(api.projects.create);
  const lookup = useAction(api.appContext.lookupAppStore);

  async function start() {
    if (!url.trim()) return;
    const id = await create({ appStoreUrl: url.trim() });
    onStart(id);
    void lookup({ projectId: id });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-5 border-b border-line flex items-center justify-between">
        <div className="font-display font-bold tracking-tight text-lg">
          Mascot<span className="text-signal">Forge</span>
        </div>
        <Annot>brand → character · generator</Annot>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="px-8 lg:px-16 py-16 flex flex-col justify-center max-w-2xl">
          <Annot>bring an app to life</Annot>
          <h1 className="font-display font-bold text-5xl lg:text-6xl leading-[0.95] mt-4 text-ink text-left">
            Bring your app to life through a
            <br />
            <span className="text-signal">premium</span> mascot concept
          </h1>
          <p className="text-ink70 mt-6 leading-relaxed max-w-md text-left">
            We read the app, capture the vibe, shape the character, and help you
            turn a product into something people remember.
          </p>

          <div className="mt-10 flex flex-col gap-3 max-w-md">
            <Annot>app store url</Annot>
            <div className="flex gap-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
                placeholder="https://apps.apple.com/us/app/…/id123456789"
                className="flex-1 rounded-full bg-panel border border-line px-5 py-4 text-sm text-ink70 placeholder:text-ink45 focus:border-signal focus:ring-2 focus:ring-signal/20 outline-none"
              />
              <Button onClick={start}>Bring it to life</Button>
            </div>
          </div>
        </section>

        <aside className="hidden lg:flex items-start justify-center p-12">
          <div className="rounded-[32px] bg-panel2 p-10 shadow-sheet w-full max-w-md">
            <div className="font-display text-[11px] uppercase tracking-[0.28em] text-ink45">
              premium flow
            </div>
            <div className="font-display text-5xl font-bold text-ink mt-4">
              Refine the mascot journey
            </div>
            <div className="mt-8 space-y-4 text-left">
              <div className="rounded-3xl bg-paper p-5">
                <div className="font-semibold text-sm text-ink">01 · Identify the app</div>
                <p className="text-ink70 text-sm mt-2">We pull the app store context and shape the brief.</p>
              </div>
              <div className="flex justify-center text-ink45">↓</div>
              <div className="rounded-3xl bg-paper p-5">
                <div className="font-semibold text-sm text-ink">02 · Answer the right questions</div>
                <p className="text-ink70 text-sm mt-2">Choose the form, personality, and palette direction.</p>
              </div>
              <div className="flex justify-center text-ink45">↓</div>
              <div className="rounded-3xl bg-paper p-5">
                <div className="font-semibold text-sm text-ink">03 · Approve the hero</div>
                <p className="text-ink70 text-sm mt-2">Select the strongest mascot and build the model sheet.</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Workspace({
  projectId,
  onExit,
}: {
  projectId: Id<"projects">;
  onExit: () => void;
}) {
  const project = useQuery(api.projects.get, { id: projectId });
  const setStage = useMutation(api.projects.setStage);
  const [view, setView] = useState<StageKey>("context");

  // Follow the pipeline forward as the backend advances the stage.
  useEffect(() => {
    if (project?.stage) setView(project.stage as StageKey);
  }, [project?.stage]);

  if (project === undefined)
    return <div className="p-8 font-mono text-ink45">Loading…</div>;
  if (project === null)
    return <div className="p-8 font-mono text-ink45">Project not found.</div>;

  const reachedIdx = STAGES.findIndex((s) => s.key === project.stage);
  const currentIndex = Math.max(0, STAGES.findIndex((s) => s.key === view));

  function handleStepSelect(key: StageKey) {
    setView(key);
    void setStage({ id: project._id, stage: key });
  }

  function handleStepShift(offset: number) {
    const nextIndex = Math.max(0, Math.min(STAGES.length - 1, currentIndex + offset));
    const nextKey = STAGES[nextIndex].key;
    handleStepSelect(nextKey);
  }

  return (
    <div className="min-h-screen flex">
      <nav className="w-60 shrink-0 border-r border-line flex flex-col">
        <button
          onClick={onExit}
          className="px-6 py-5 border-b border-line text-left font-display font-bold tracking-tight"
        >
          Mascot<span className="text-signal">Forge</span>
        </button>
        <div className="px-6 py-4 text-sm text-ink70">
          {project.context?.appName ?? "Loading app…"}
        </div>
        <div className="p-3 flex-1">
          {STAGES.map((s, i) => {
            const reached = i <= Math.max(reachedIdx, 0);
            const active = view === s.key;
            return (
              <button
                key={s.key}
                disabled={!reached}
                onClick={() => handleStepSelect(s.key)}
                className={`w-full text-left px-3 py-3 flex items-baseline gap-3 transition-colors ${
                  active ? "bg-panel2" : "hover:bg-panel"
                } ${reached ? "" : "opacity-30 cursor-not-allowed"}`}
              >
                <span
                  className={`font-mono text-[11px] ${active ? "text-signal" : "text-ink25"}`}
                >
                  {s.n}
                </span>
                <span className="text-sm">{s.label}</span>
              </button>
            );
          })}
          <div className="mt-auto border-t border-line p-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleStepShift(-1)}
              disabled={currentIndex === 0}
              className="rounded-full px-3 py-2 text-sm text-ink70 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleStepShift(1)}
              disabled={currentIndex >= STAGES.length - 1}
              className="rounded-full px-3 py-2 text-sm text-ink70 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        {view === "context" && <AppContextStep project={project} />}
        {view === "questions" && <QuestionsStep project={project} />}
        {view === "mascot" && <MascotStep project={project} />}
        {view === "poses" && <PosesStep project={project} />}
        {view === "animate" && <AnimateStep project={project} />}
        {view === "export" && <ExportStep project={project} />}
      </main>
    </div>
  );
}
