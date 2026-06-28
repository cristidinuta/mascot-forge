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
          <Annot>turn an app into a mascot</Annot>
          <h1 className="font-display font-bold text-5xl lg:text-6xl leading-[0.95] mt-4">
            Point it at a store
            <br />
            link. Get a mascot
            <br />
            <span className="text-signal">model sheet.</span>
          </h1>
          <p className="text-ink70 mt-6 leading-relaxed max-w-md">
            Reads the app, asks a few direction questions, generates a character,
            poses it into a full turnaround, and animates it — exported as a
            behavioral spec any app can run.
          </p>

          <div className="mt-10 flex flex-col gap-3 max-w-md">
            <Annot>app store url</Annot>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
                placeholder="https://apps.apple.com/us/app/…/id123456789"
                className="flex-1 bg-panel border border-line px-4 py-3 font-mono text-[13px] placeholder:text-ink25 focus:border-signal outline-none"
              />
              <Button onClick={start}>Forge</Button>
            </div>
          </div>
        </section>

        <aside className="hidden lg:flex items-center justify-center border-l border-line bg-panel/40 p-12">
          <div className="reg relative sheet w-full max-w-md aspect-square shadow-sheet flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-[11px] uppercase tracking-label text-ink/40">
                model sheet
              </div>
              <div className="font-display text-ink/20 text-7xl font-bold mt-2">
                01–05
              </div>
              <div className="font-mono text-[10px] uppercase tracking-label text-ink/30 mt-2">
                wave · point · write · celebrate · think
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

  return (
    <div className="min-h-screen flex">
      <nav className="w-60 shrink-0 border-r border-line flex flex-col">
        <button
          onClick={onExit}
          className="px-6 py-5 border-b border-line text-left font-display font-bold tracking-tight"
        >
          Mascot<span className="text-signal">Forge</span>
        </button>
        <div className="p-3 flex-1">
          {STAGES.map((s, i) => {
            const reached = i <= Math.max(reachedIdx, 0);
            const active = view === s.key;
            return (
              <button
                key={s.key}
                disabled={!reached}
                onClick={() => setView(s.key)}
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
        </div>
        <div className="p-4 border-t border-line annot truncate">
          {project.context?.appName ?? "untitled"}
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
