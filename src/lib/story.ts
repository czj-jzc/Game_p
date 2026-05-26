import storyConfigData from "../../data/config/story.json";
import type { SceneDefinition, StoryConfig } from "../types";

const sceneModules = import.meta.glob("../../data/scenes/*.json", { eager: true });

const scenes = Object.values(sceneModules).map((module) => {
  const payload = module as { default?: unknown };
  return (payload.default ?? module) as SceneDefinition;
});

const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));
const storyConfig = storyConfigData as StoryConfig;

export function getEntrySceneId() {
  return storyConfig.entrySceneId;
}

export function getScene(sceneId: string) {
  return sceneMap.get(sceneId) ?? null;
}

export function getOrderedScenes() {
  return storyConfig.sceneOrder
    .map((sceneId) => getScene(sceneId))
    .filter((scene): scene is SceneDefinition => Boolean(scene));
}

export function getTitleScreenConfig() {
  return storyConfig.titleScreen ?? {};
}
