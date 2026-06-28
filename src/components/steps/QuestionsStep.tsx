import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Annot, Button, ErrorNote, Spinner } from "../ui";

const DIRECTION_STYLE = ["Cartoony", "Realistic"] as const;
const DIMENSION_OPTIONS = ["2D", "3D"] as const;

export function QuestionsStep({ project }: { project: Doc<"projects"> }) {
  const generate = useAction(api.questions.generate);
  const saveAnswers = useMutation(api.projects.setAnswers);
  const [answers, setAnswers] = useState<Record<string, string>>(
    project.answers ?? {}
  );
  const [inspiroUrls, setInspoUrls] = useState<string[]>([]);
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

  useEffect(() => {
    return () => {
      inspiroUrls.forEach(URL.revokeObjectURL);
    };
  }, [inspiroUrls]);

  const questions = project.questions ?? [];
  const style = answers.visualStyle || "Cartoony";
  const dimension = answers.visualDimension || "2D";
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => answers[q.id]) &&
    Boolean(style) &&
    Boolean(dimension);

  function handleInspoFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .slice(0, 3)
      .map((file) => URL.createObjectURL(file));
    setInspoUrls(next);
  }

  return (
    <div className="p-10 max-w-3xl">
      <Annot>02 — direction</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-8 text-left">
        Define the mascot direction
      </h2>

      {project.status === "working" && questions.length === 0 && (
        <Spinner label="Thinking about what to ask…" />
      )}
      {project.status === "error" && (
        <ErrorNote message={project.error ?? "Couldn't generate questions."} />
      )}

      {questions.length > 0 && (
        <div className="space-y-8">
          <div className="rounded-[32px] border border-line bg-panel2 p-6 text-left">
            <div className="font-semibold text-sm text-ink">Questions</div>
            <div className="mt-4 space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <div className="text-base font-medium text-ink">{q.question}</div>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const active = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={`rounded-full px-4 py-2 text-sm transition-colors border ${
                            active
                              ? "border-signal bg-signal/10 text-ink"
                              : "border-line text-ink70 hover:bg-panel"
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
                    placeholder="Or type a short custom direction"
                    className="w-full rounded-full bg-panel border border-line px-4 py-3 text-sm text-ink70 outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-line bg-panel2 p-6 text-left">
            <div className="font-semibold text-sm text-ink">Visual direction</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-ink45">
                  Style
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DIRECTION_STYLE.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswers((a) => ({ ...a, visualStyle: option }))}
                      className={`rounded-full px-4 py-2 text-sm transition-colors border ${
                        style === option
                          ? "border-signal bg-signal/10 text-ink"
                          : "border-line text-ink70 hover:bg-panel"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-ink45">
                  Dimension
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DIMENSION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswers((a) => ({ ...a, visualDimension: option }))}
                      className={`rounded-full px-4 py-2 text-sm transition-colors border ${
                        dimension === option
                          ? "border-signal bg-signal/10 text-ink"
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

          <div className="rounded-[32px] border border-line bg-panel2 p-6 text-left">
            <div className="font-semibold text-sm text-ink">Upload visual inspo</div>
            <p className="text-ink70 text-sm mt-2">
              Add reference images to anchor the mascot mood.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-paper px-4 py-3 text-sm text-ink70 transition-colors hover:border-signal hover:text-ink">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleInspoFiles(e.target.files)}
                  className="sr-only"
                />
                Upload images
              </label>
              {inspiroUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {inspiroUrls.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt="Inspiration"
                      className="h-24 w-full rounded-3xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
