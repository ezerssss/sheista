export const PET_EVENTS = {
  TRAINING_FINISHED: "sheista:training-finished",
} as const;

export type TrainingFinishedDetail = {
  isAk: boolean;
  performance: number;
  levelBefore: number;
  levelAfter: number;
};

export function emitTrainingFinished(detail: TrainingFinishedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PET_EVENTS.TRAINING_FINISHED, { detail }),
  );
}

export function onTrainingFinished(
  handler: (detail: TrainingFinishedDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<TrainingFinishedDetail>;
    handler(ce.detail);
  };
  window.addEventListener(PET_EVENTS.TRAINING_FINISHED, listener);
  return () => window.removeEventListener(PET_EVENTS.TRAINING_FINISHED, listener);
}
