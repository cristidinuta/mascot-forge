import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Annot, Button, ErrorNote, Spinner } from "../ui";

export function QuestionsStep({ project }: { project: Doc<"projects"> }) {
  const generate = useAction(api.questions.generate);
  const saveAnswers = useMutation(api.projects.setAnswers);
  const [answers, setAnswers] = useState<Record<string, string>>(
    project.answers ?? {}
  );
  const kicked = useRef(false);

  // Auto-generate the questions once context exists.
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
  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id]);

  return (
    <div className="p-10 max-w-3xl">
      <Annot>02 — direction</Annot>
      <h2 className="font-display font-bold text-3xl mt-2 mb-8">
        Set the character's vibe
      </h2>

      {project.status === "working" && questions.length === 0 && (
        <Spinner label="Thinking about what to ask…" />
      )}
      {project.status === "error" && (
        <ErrorNote message={project.error ?? "Couldn't generate questions."} />
      )}

      <div className="space-y-8">
        {questions.map((q) => (
          <div key={q.id}>
            <div className="text-sm mb-3">{q.question}</div>
            <div className="flex flex-wrap gap-2">
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
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="mt-10">
          <Button
            disabled={!allAnswered}
            onClick={() => saveAnswers({ id: project._id, answers })}
          >
            Lock direction → generate mascot
          </Button>
        </div>
      )}
    </div>
  );
}
