import type {
  ActiveCharacter,
  ChoiceEvent,
  SceneDefinition,
  SceneEvent
} from "../types";

export function indexSceneEvents(scene: SceneDefinition) {
  const indexMap = new Map<string, number>();
  scene.events.forEach((event, index) => {
    if (event.id) {
      indexMap.set(event.id, index);
    }
  });
  return indexMap;
}

export function resolveEventIndex(target: string, indexMap: Map<string, number>) {
  const index = indexMap.get(target);
  if (index === undefined) {
    throw new Error(`Unknown scene target: ${target}`);
  }
  return index;
}

export function upsertActiveCharacter(
  activeCharacters: ActiveCharacter[],
  nextCharacter: ActiveCharacter
) {
  const next = activeCharacters.filter((character) => character.position !== nextCharacter.position);
  next.push(nextCharacter);
  return next.sort((a, b) => slotWeight(a.position) - slotWeight(b.position));
}

export function removeActiveCharacter(activeCharacters: ActiveCharacter[], position: string) {
  return activeCharacters.filter((character) => character.position !== position);
}

export function isChoiceEvent(event: SceneEvent): event is ChoiceEvent {
  return event.type === "choice";
}

function slotWeight(position: string) {
  if (position === "left") return 0;
  if (position === "center") return 1;
  return 2;
}
