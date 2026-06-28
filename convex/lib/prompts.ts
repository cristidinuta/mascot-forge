import { Pose, POSE_INTENT } from "./constants";

type Ctx = {
  appName: string;
  description: string;
  genre: string;
};

// 1) Elicitation — the model proposes the few questions worth asking before
//    it commits to a character. Returns strict JSON.
export function questionsPrompt(ctx: Ctx) {
  return [
    {
      role: "system" as const,
      content:
        "You are an art director scoping a brand mascot for a consumer app. " +
        "Given the app, propose exactly 3 multiple-choice questions that matter most for mascot design. " +
        "Each question must have 3-4 concise options, each option no longer than 4 words. " +
        'Reply with ONLY JSON: {"questions":[{"id","question","options":[...]}]} ' +
        "No prose, no markdown.",
    },
    {
      role: "user" as const,
      content: `App: ${ctx.appName}\nCategory: ${ctx.genre}\nDescription: ${ctx.description.slice(0, 1200)}`,
    },
  ];
}

// 2) Base mascot generation — one transparent character on no background.
export function mascotPrompt(ctx: Ctx, answers: Record<string, string>) {
  const dir = Object.values(answers).filter(Boolean).join("; ");
  return (
    `A single original mascot character for "${ctx.appName}", a ${ctx.genre} app. ` +
    `${ctx.description.slice(0, 300)}. ` +
    `Art direction: ${dir || "friendly, modern, approachable"}. ` +
    `Full body, centered, facing forward, neutral friendly idle pose, expressive face. ` +
    `Clean flat vector-style illustration with simple shapes and a limited palette. ` +
    `IMPORTANT: transparent background, no scene, no text, no logo, no drop shadow, ` +
    `no ground plane — just the isolated character.`
  );
}

// 3) Pose edits — feed the APPROVED mascot back as a reference image so the
//    character stays identical; only the pose changes. This is the consistency trick.
export function posePrompt(pose: Pose) {
  return (
    `Keep this exact same character — identical design, colors, proportions and style. ` +
    `Redraw it in a new pose: ${poseDescription(pose)}. ` +
    `Same flat illustration style, centered, full body, transparent background, ` +
    `no scene, no text, no shadow. Intended use: ${POSE_INTENT[pose]}.`
  );
}

function poseDescription(pose: Pose): string {
  switch (pose) {
    case "wave":
      return "waving hello with one hand raised, warm welcoming expression";
    case "point":
      return "pointing toward the viewer with a knowing, helpful expression";
    case "write":
      return "writing or noting something down, focused expression";
    case "celebrate":
      return "celebrating with arms up, joyful expression, mid-cheer";
    case "think":
      return "thinking, hand near chin, curious thoughtful expression";
  }
}

// 4) Higgsfield motion prompt — ambient life, not a hard gesture.
export function motionPrompt(pose: Pose) {
  return `Subtle idle motion for a character mascot: gentle breathing, slight bob, soft blink. Keep the ${pose} pose. Minimal camera movement.`;
}

// 5) Spec extraction — turn app context into the behavioral MascotSpec the
//    runtime reads. The action set is constrained to log / reflect / rally.
export function specPrompt(ctx: Ctx, answers: Record<string, string>) {
  return [
    {
      role: "system" as const,
      content:
        "You define the behavior of an in-app mascot agent. Map the app to a fixed " +
        "loop: every mascot can LOG an action, REFLECT it back as an insight, and " +
        "RALLY friends into a group challenge. Pick the app's core 'noun' (e.g. " +
        "expense, workout, lesson, habit). Reply with ONLY JSON of shape: " +
        '{"domain","noun","brandColors":{"primary":"#hex","secondary":"#hex","palette":["#hex",...]},' +
        '"mascot":{"name","character","personality":[..],"greeting"},' +
        '"actions":[{"id","archetype":"log|reflect|rally","name","description","params":[{"name","type"}]}],' +
        '"challenges":[{"id","name","description","durationDays"}]}. ' +
        "Exactly 3 actions (one per archetype) and 2 challenge templates. No markdown.",
    },
    {
      role: "user" as const,
      content:
        `App: ${ctx.appName}\nCategory: ${ctx.genre}\n` +
        `Description: ${ctx.description.slice(0, 800)}\n` +
        `Art/personality direction chosen: ${Object.values(answers).join("; ")}`,
    },
  ];
}
