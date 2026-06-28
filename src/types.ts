export const POSES = ["wave", "point", "write", "celebrate", "think", "jump"] as const;
export type Pose = (typeof POSES)[number];

export const POSE_LABEL: Record<Pose, string> = {
  wave: "Wave",
  point: "Point",
  write: "Write",
  celebrate: "Celebrate",
  think: "Think",
  jump: "Jump",
};

export const STAGES = [
  { key: "context", label: "App context", n: "01" },
  { key: "questions", label: "Direction", n: "02" },
  { key: "mascot", label: "Mascot", n: "03" },
  { key: "poses", label: "Model sheet", n: "04" },
  { key: "animate", label: "Motion", n: "05" },
  { key: "export", label: "Export", n: "06" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

// The contract the runtime app reads. Kept in sync with convex/spec.ts.
export type MascotSpec = {
  version: string;
  brand: {
    appName: string;
    appStoreId: string;
    iconUrl?: string;
    primary: string;
    secondary: string;
    palette: string[];
  };
  domain: string;
  noun: string;
  mascot: {
    name: string;
    character: string;
    personality: string[];
    greeting: string;
  };
  actions: {
    id: string;
    archetype: "log" | "reflect" | "rally";
    name: string;
    description: string;
    params: { name: string; type: string }[];
  }[];
  challenges: {
    id: string;
    name: string;
    description: string;
    durationDays: number;
  }[];
  assets: {
    hero?: string;
    poses: Record<string, string>;
    videos: Record<string, string>;
  };
};
