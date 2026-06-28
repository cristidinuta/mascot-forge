import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Annot, Button, ErrorNote, Spinner } from "../ui";

const ACTION_CHOICES = [
  "Wave / greet",
  "Celebrate / jump",
  "Point / lead",
  "Think / reflect",
  "Cheer / rally",
];

export function QuestionsStep({ project }: { project: Doc<"projects"> }) {
  const generate = useAction(api.questions.generate);
  const saveAnswers = useMutation(api.projects.setAnswers);
  const [answers, setAnswers] = useState<Record<string, string>>(
    project.answers ?? {}
  );
  const kicked = useRef(false);

  useEffect(() => {
    if (
      project.context &&
      !project.questions &&
      project.status !== "working" &&
      !kicked.current
    ) {
      kicked.current = true;
      void generate({ projectId: project._id });
    }
  }, [project.context, project.questions, project.status]);

  const questions = project.questions ?? [];
  const style = answers.visualStyle || "Cartoony";
  const dimension = answers.visualDimension || "2D";
  const actionOptions = useMemo(
    () => answers.mascotActions?.split(";").filter(Boolean) ?? [],
    [answers.mascotActions]
  );
  const customActions = answers.mascotActionsCustom || "";
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => answers[q.id]) &&
    style &&
    dimension;

  return (
    <div className="p-10 max-w-3xl">
      <Annot>02 — direction</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-8">
        Define the mascot's tone
      </h2>

      {project.status === "working" && questions.length === 0 && (
        <Spinner label="Thinking about what to ask…" />
      )}
      {project.status === "error" && (
        <ErrorNote message={project.error ?? "Couldn't generate questions."} />
      )}

      <div className="space-y-8">
        <div className="rounded-3xl border border-line bg-panel2 p-6">
          <div className="font-semibold text-sm text-ink">Visual direction</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-ink45">
                Style
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Cartoony', 'Realistic'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setAnswers((a) => ({ ...a, visualStyle: option }))}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      style === option
                        ? "border-signal bg-signal/10 text-paper"
                        : "border-line text-ink70 hover:bg-panel"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-ink45">
                Dimension
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['2D', '3D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setAnswers((a) => ({ ...a, visualDimension: option }))}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      dimension === option
                        ? "border-signal bg-signal/10 text-paper"
                        : "border-line text-ink70 hover:bg-panel"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-panel2 p-6">
          <div className="font-semibold text-sm text-ink">Mascot actions</div>
          <div className="mt-4 grid gap-2">
            {ACTION_CHOICES.map((choice) => {
              const active = actionOptions.includes(choice);
              return (
                <button
                  key={choice}
                  onClick={() => {
                    const next = active
                      ? actionOptions.filter((a) => a !== choice)
                      : [...actionOptions, choice];
                    setAnswers((a) => ({ ...a, mascotActions: next.join(";") }));
                  }}
                  className={`text-sm text-left rounded-2xl border px-4 py-3 transition-colors ${
                    active
                      ? "border-signal bg-signal/10 text-paper"
                      : "border-line text-ink70 hover:bg-panel"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
            <input
              value={customActions}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, mascotActionsCustom: e.target.value }))
              }
              placeholder="Other actions (e.g. slide in, point to copy, surge with energy)"
              className="w-full bg-panel border border-line px-4 py-3 text-sm text-ink70 outline-none focus:border-signal"
            />
          </div>
        </div>

        {questions.map((q) => (
          <div key={q.id}>
            <div className="text-sm mb-3 font-medium text-ink">{q.question}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {q.options.map((opt) => {
                const active = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      active
                        ? "border-signal bg-signal/10 text-paper"
                        : "border-line text-ink70 hover:bg-panel2"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
              }
              placeholder="Or tell us what you want in your own words — e.g. I want a friendly dog mascot"
              className="w-full bg-panel border border-line px-4 py-3 text-sm text-ink70 outline-none focus:border-signal"
            />
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="mt-10">
          <Button
            disabled={!allAnswered}
            onClick={() =>
              saveAnswers({
                id: project._id,
                answers: {
                  ...answers,
                  visualStyle: answers.visualStyle || "Cartoony",
                  visualDimension: answers.visualDimension || "2D",
                },
              })
            }
          >
            Lock direction → generate mascot
          </Button>
        </div>
      )}
    </div>
  );
}
