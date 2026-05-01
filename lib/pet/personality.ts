import type { ActiveTraining } from "@/lib/themecp/active-training";
import type { AuthedPetState, MoodId } from "@/lib/pet/types";
import type { TrainingFinishedDetail } from "@/lib/pet/events";

export type MoodContext = {
  state: AuthedPetState;
  activeTraining: ActiveTraining | null;
  recentlyFinished: TrainingFinishedDetail | null;
  hoursUntilLocalMidnight: number;
  localHour: number;
};

export function getMood(ctx: MoodContext): MoodId {
  const { state, activeTraining, recentlyFinished, hoursUntilLocalMidnight, localHour } = ctx;

  if (recentlyFinished) {
    if (recentlyFinished.levelAfter < recentlyFinished.levelBefore) return "disappointed";
    return "celebrating";
  }
  if (activeTraining) return "focused";

  if (
    !state.streak.todayDone &&
    state.streak.current >= 1 &&
    hoursUntilLocalMidnight <= 4
  ) {
    return "urgent";
  }

  if (state.gateBlocked) return "worried";
  if (!state.streak.todayDone) return "nudging";

  if (state.akRate >= 60 && state.avgRecentPerf >= 80) return "proud";

  if (
    state.lastFinishedAt &&
    Date.now() - new Date(state.lastFinishedAt).getTime() > 48 * 3600_000
  ) {
    return "sleepy";
  }
  if (localHour >= 23 || localHour < 6) return "sleepy";

  return "chilling";
}

// ---------- Message bank ----------

type MessageVariant =
  | { kind: "text"; text: string }
  | { kind: "share"; text: string; template: "daily" | "streak" | "level" };

const MESSAGES: Record<MoodId, ReadonlyArray<MessageVariant>> = {
  nudging: [
    { kind: "text", text: "no round yet today? skill issue." },
    { kind: "text", text: "dust me off and let's go." },
    { kind: "text", text: "the queue awaits." },
    { kind: "text", text: "imagine skipping today." },
    { kind: "text", text: "one round. four problems. easy day." },
    { kind: "text", text: "i didn't level up for nothing." },
    { kind: "text", text: "your streak isn't going to defend itself." },
    { kind: "text", text: "feed me a round, would you?" },
  ],
  urgent: [
    { kind: "text", text: "midnight's close. streak's on the line." },
    { kind: "text", text: "speedrun it. gogogo." },
    { kind: "text", text: "don't let the streak die on my watch." },
    { kind: "text", text: "we have minutes, not hours." },
    { kind: "text", text: "one round between you and a reset. clutch up." },
  ],
  focused: [
    { kind: "text", text: "lock in." },
    { kind: "text", text: "you got this. probably." },
    { kind: "text", text: "no ragequit." },
    { kind: "text", text: "tunnel vision time." },
    { kind: "text", text: "i'm watching. no pressure." },
  ],
  celebrating: [
    { kind: "text", text: "AK?! gg ez confirmed." },
    { kind: "text", text: "frame perfect." },
    { kind: "text", text: "+1 level. earned." },
    { kind: "share", text: "screenshot energy:", template: "daily" },
  ],
  disappointed: [
    { kind: "text", text: "ouch. -1." },
    { kind: "text", text: "we'll get 'em next round." },
    { kind: "text", text: "into the upsolve pile it goes." },
    { kind: "text", text: "noted. we adapt." },
    { kind: "text", text: "shake it off. one round at a time." },
  ],
  proud: [
    { kind: "text", text: "stats lookin' clean." },
    { kind: "text", text: "this is the way." },
    { kind: "text", text: "casual greatness." },
    { kind: "text", text: "no notes. carry on." },
    { kind: "share", text: "flex it:", template: "streak" },
  ],
  chilling: [
    { kind: "text", text: "today: handled." },
    { kind: "text", text: "rest. but only a little." },
    { kind: "text", text: "tomorrow we run it back." },
    { kind: "text", text: "ladder: respected." },
    { kind: "text", text: "go touch grass. for like, 20 min." },
  ],
  sleepy: [
    { kind: "text", text: "zzz... wake me when you're ready." },
    { kind: "text", text: "i'll be here." },
    { kind: "text", text: "even legends rest." },
    { kind: "text", text: "miss me yet?" },
  ],
  worried: [
    { kind: "text", text: "that one problem is haunting us." },
    { kind: "text", text: "let's clean up the gate first." },
    { kind: "text", text: "upsolve, then forward." },
  ],
};

// ---------- Anti-repeat picker ----------

export type MessagePicker = {
  pick(mood: MoodId): MessageVariant;
};

export function createMessagePicker(): MessagePicker {
  const recent: string[] = [];
  const RECENT_KEEP = 3;

  return {
    pick(mood) {
      const pool = MESSAGES[mood];
      if (pool.length === 0) return { kind: "text", text: "..." };
      const fresh = pool.filter((m) => !recent.includes(m.text));
      const candidates = fresh.length > 0 ? fresh : pool;
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      recent.push(choice.text);
      while (recent.length > RECENT_KEEP) recent.shift();
      return choice;
    },
  };
}

// ---------- Milestone share suggestions ----------

const STREAK_MILESTONES = new Set([7, 14, 30, 50, 100, 200, 365]);

export function detectMilestone(
  streak: number,
  detail: TrainingFinishedDetail,
): { template: "daily" | "streak" | "level"; text: string } | null {
  if (detail.levelAfter > detail.levelBefore) {
    return {
      template: "level",
      text: `level ${detail.levelAfter}?? brag time:`,
    };
  }
  if (STREAK_MILESTONES.has(streak)) {
    return {
      template: "streak",
      text: `${streak} days. flex it:`,
    };
  }
  if (detail.isAk) {
    return {
      template: "daily",
      text: "AK locked in. screenshot energy:",
    };
  }
  return null;
}

// ---------- Mood -> sprite variant pieces ----------

export type EyeShape =
  | "open"
  | "closed-smile"
  | "wide"
  | "squint"
  | "concentrate"
  | "smug"
  | "half"
  | "shut";
export type MouthShape = "neutral" | "smile" | "open-smile" | "exclaim" | "flat" | "yawn";
export type Particle = "none" | "zzz" | "sparkle" | "sweat";

export function moodVisuals(mood: MoodId): {
  eyes: EyeShape;
  mouth: MouthShape;
  particle: Particle;
  bodyTint: "default" | "bright" | "muted";
  overlay: "none" | "idle-bob" | "celebrate" | "urgent";
} {
  switch (mood) {
    case "nudging":
      return { eyes: "open", mouth: "neutral", particle: "none", bodyTint: "default", overlay: "idle-bob" };
    case "urgent":
      return { eyes: "wide", mouth: "exclaim", particle: "none", bodyTint: "default", overlay: "urgent" };
    case "focused":
      return { eyes: "concentrate", mouth: "flat", particle: "none", bodyTint: "default", overlay: "none" };
    case "celebrating":
      return { eyes: "closed-smile", mouth: "open-smile", particle: "sparkle", bodyTint: "bright", overlay: "celebrate" };
    case "disappointed":
      return { eyes: "shut", mouth: "flat", particle: "sweat", bodyTint: "muted", overlay: "none" };
    case "proud":
      return { eyes: "smug", mouth: "smile", particle: "none", bodyTint: "default", overlay: "idle-bob" };
    case "chilling":
      return { eyes: "half", mouth: "smile", particle: "none", bodyTint: "default", overlay: "idle-bob" };
    case "sleepy":
      return { eyes: "shut", mouth: "yawn", particle: "zzz", bodyTint: "muted", overlay: "none" };
    case "worried":
      return { eyes: "squint", mouth: "flat", particle: "sweat", bodyTint: "default", overlay: "idle-bob" };
  }
}
