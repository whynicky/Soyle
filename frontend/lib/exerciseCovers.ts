import type { Exercise } from "./api";

const coverTargets = new Set([
  "animals", "food", "toys", "request", "observation", "feelings", "routine", "help",
  "refusal", "choice", "answer", "question", "past_event", "sort-familiar-groups",
  "order-familiar-actions", "match-object-action", "explore-bedroom", "explore-kitchen",
  "explore-living-room", "explore-playground", "scene-words-bedroom", "scene-words-kitchen",
  "scene-words-living-room", "scene-words-playground",
]);

// Cover art belongs to the catalogue only; learning stimuli stay unchanged.
export function exerciseCover(exercise: Exercise) {
  const versionCover = exercise.engine?.content.cover_media_ref;
  if (versionCover) return versionCover;
  if (coverTargets.has(exercise.target)) return `/app-illustrations/exercise-covers/${exercise.target}.webp`;
  return exercise.engine?.content.exploration?.image.media_ref || "/app-illustrations/exercise-covers/toys.webp";
}
