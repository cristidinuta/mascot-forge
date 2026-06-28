// Shared between backend and frontend. Pure constants, no runtime deps.

export const POSES = ["wave", "point", "write", "celebrate", "think", "jump"] as const;
export type Pose = (typeof POSES)[number];

// What each pose is *for* in the running app — keeps the generator honest:
// every mascot collapses to the same three verbs (log / reflect / rally).
export const POSE_INTENT: Record<Pose, string> = {
  wave: "greeting / onboarding (idle)",
  write: "logging an action (the 'log' archetype)",
  point: "delivering an insight (the 'reflect' archetype)",
  celebrate: "streak / goal / challenge win (the 'rally' archetype)",
  think: "processing / loading",
  jump: "playful energy / momentum",
};

export const ARCHETYPES = ["log", "reflect", "rally"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const SPEC_VERSION = "1.0";
