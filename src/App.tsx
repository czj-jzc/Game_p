import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import charactersData from "../data/characters/characters.json";
import SettingsPanel from "./components/SettingsPanel";
import TitleScreen from "./components/TitleScreen";
import TypewriterText from "./components/TypewriterText";
import { indexSceneEvents, isChoiceEvent, removeActiveCharacter, resolveEventIndex, upsertActiveCharacter } from "./lib/engine";
import {
  clearProgress,
  defaultSettings,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings
} from "./lib/storage";
import { normalizeAssetPath } from "./lib/assets";
import { getEntrySceneId, getOrderedScenes, getScene, getTitleScreenConfig } from "./lib/story";
import type {
  ActiveCharacter,
  CharacterSpriteDefinition,
  CharacterDefinition,
  ChoiceEvent,
  SaveSnapshot,
  SceneDefinition,
  Settings
} from "./types";

type ScreenMode = "title" | "story";

type DialogueState = {
  speaker?: string;
  text: string;
  portrait?: string;
};

const characters = charactersData as CharacterDefinition[];
const characterMap = new Map(characters.map((character) => [character.id, character]));
const orderedScenes = getOrderedScenes();
const entrySceneId = getEntrySceneId();
const initialDialogueState: DialogueState = { text: "" };

function requireScene(sceneId: string) {
  const scene = getScene(sceneId);
  if (!scene) {
    throw new Error(`Unknown scene id: ${sceneId}`);
  }
  return scene;
}

function resolveSpriteDefinition(
  definition: CharacterDefinition | null | undefined,
  spriteKey: string
): CharacterSpriteDefinition | undefined {
  return definition?.sprites[spriteKey];
}

function resolveSpriteSource(spriteDefinition: CharacterSpriteDefinition | undefined) {
  if (!spriteDefinition) {
    return undefined;
  }
  return typeof spriteDefinition === "string" ? spriteDefinition : spriteDefinition.src;
}

function resolveVariantPortrait(
  definition: CharacterDefinition | null | undefined,
  spriteKey: string | undefined
) {
  if (!definition || !spriteKey) {
    return undefined;
  }
  const spriteDefinition = resolveSpriteDefinition(definition, spriteKey);
  if (!spriteDefinition || typeof spriteDefinition === "string") {
    return undefined;
  }
  return spriteDefinition.portrait;
}

function resolveVariantPortraitLayout(
  definition: CharacterDefinition | null | undefined,
  spriteKey: string | undefined
) {
  if (!definition || !spriteKey) {
    return undefined;
  }
  const spriteDefinition = resolveSpriteDefinition(definition, spriteKey);
  if (!spriteDefinition || typeof spriteDefinition === "string") {
    return undefined;
  }
  return spriteDefinition.portraitLayout;
}

export default function App() {
  const entryScene = requireScene(entrySceneId);
  const titleScreenConfig = getTitleScreenConfig();
  const titleColumns =
    Array.isArray(titleScreenConfig.titleColumns) && titleScreenConfig.titleColumns.length > 0
      ? titleScreenConfig.titleColumns.filter(
          (column): column is string => typeof column === "string" && column.trim().length > 0
        )
      : [];
  const [screenMode, setScreenMode] = useState<ScreenMode>("title");
  const [currentSceneId, setCurrentSceneId] = useState(entryScene.id);
  const [background, setBackground] = useState(entryScene.initialState.background);
  const [activeCharacters, setActiveCharacters] = useState<ActiveCharacter[]>([]);
  const [dialogueState, setDialogueState] = useState<DialogueState>(initialDialogueState);
  const [eventIndex, setEventIndex] = useState(0);
  const [flags, setFlags] = useState<Record<string, boolean | number | string>>({
    ...entryScene.initialState.flags
  });
  const [currentChoice, setCurrentChoice] = useState<ChoiceEvent | null>(null);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [revealAllSignal, setRevealAllSignal] = useState(0);
  const [hasSave, setHasSave] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentBgm, setCurrentBgm] = useState(entryScene.initialState.bgm ?? "");

  const currentScene = useMemo(() => requireScene(currentSceneId), [currentSceneId]);
  const currentSceneIndex = useMemo(() => indexSceneEvents(currentScene), [currentScene]);
  const currentEvent = currentScene.events[eventIndex];

  const stopVoicePlayback = () => {
    const audio = voiceAudioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
  };

  const stopBgmPlayback = () => {
    const audio = bgmAudioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
  };

  const openScene = (
    nextSceneId: string,
    options?: {
      carryFlags?: Record<string, boolean | number | string>;
      keepScreenMode?: boolean;
      startAt?: number;
      background?: string;
      bgm?: string;
      activeCharacters?: ActiveCharacter[];
    }
  ) => {
    const nextScene = requireScene(nextSceneId);
    stopVoicePlayback();
    setCurrentSceneId(nextScene.id);
    setBackground(options?.background ?? nextScene.initialState.background);
    setCurrentBgm(options?.bgm ?? nextScene.initialState.bgm ?? "");
    setActiveCharacters(options?.activeCharacters ?? []);
    setDialogueState(initialDialogueState);
    setCurrentChoice(null);
    setTypewriterDone(false);
    setRevealAllSignal((value) => value + 1);
    setStoryEnded(false);
    setFlags({
      ...nextScene.initialState.flags,
      ...(options?.carryFlags ?? {})
    });
    setEventIndex(options?.startAt ?? 0);
    if (!options?.keepScreenMode) {
      setScreenMode("story");
    }
  };

  const completeScene = () => {
    if (currentScene.nextSceneId) {
      openScene(currentScene.nextSceneId, { carryFlags: flags });
      return;
    }
    stopVoicePlayback();
    stopBgmPlayback();
    setCurrentChoice(null);
    setStoryEnded(true);
    setTypewriterDone(true);
    setDialogueState({
      speaker: "系统",
      text: "当前章节结束。继续新增 scene 文件并接到 nextSceneId，即可无缝进入下一幕。"
    });
    void clearProgress();
    setHasSave(false);
  };

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    loadProgress().then((snapshot) => {
      setHasSave(Boolean(snapshot));
    });
  }, []);

  useEffect(() => {
    if (screenMode !== "story") {
      stopVoicePlayback();
      stopBgmPlayback();
      return;
    }
    if (!currentEvent) {
      completeScene();
      return;
    }

    if (currentEvent.type === "background") {
      setBackground(currentEvent.background);
      setEventIndex((index) => index + 1);
      return;
    }

    if (currentEvent.type === "bgm") {
      setCurrentBgm(currentEvent.track ?? "");
      setEventIndex((index) => index + 1);
      return;
    }

    if (currentEvent.type === "showCharacter") {
      setActiveCharacters((current) =>
        upsertActiveCharacter(current, {
          characterId: currentEvent.characterId,
          sprite: currentEvent.sprite,
          position: currentEvent.position,
          expression: currentEvent.expression,
          transition: currentEvent.transition
        })
      );
      setEventIndex((index) => index + 1);
      return;
    }

    if (currentEvent.type === "hideCharacter") {
      setActiveCharacters((current) => removeActiveCharacter(current, currentEvent.position));
      setEventIndex((index) => index + 1);
      return;
    }

    if (currentEvent.type === "setFlag") {
      setFlags((current) => ({ ...current, [currentEvent.key]: currentEvent.value }));
      setEventIndex((index) => index + 1);
      return;
    }

    if (currentEvent.type === "jump") {
      setEventIndex(resolveEventIndex(currentEvent.target, currentSceneIndex));
      return;
    }

    if (currentEvent.type === "if") {
      const nextTarget =
        flags[currentEvent.key] === currentEvent.equals ? currentEvent.then : currentEvent.else;
      if (nextTarget) {
        setEventIndex(resolveEventIndex(nextTarget, currentSceneIndex));
      } else {
        setEventIndex((index) => index + 1);
      }
      return;
    }

    if (currentEvent.type === "choice") {
      stopVoicePlayback();
      setCurrentChoice(currentEvent);
      setDialogueState({
        speaker: undefined,
        text: currentEvent.prompt
      });
      setTypewriterDone(true);
      return;
    }

    if (currentEvent.type === "dialogue") {
      setCurrentChoice(null);
      setTypewriterDone(false);
      setDialogueState({
        speaker: currentEvent.speaker,
        text: currentEvent.text,
        portrait: currentEvent.portrait
      });
      return;
    }

    if (currentEvent.type === "changeScene") {
      openScene(currentEvent.targetSceneId, { carryFlags: flags });
      return;
    }

    if (currentEvent.type === "end") {
      completeScene();
    }
  }, [currentEvent, currentScene, currentSceneIndex, flags, screenMode]);

  useEffect(() => {
    if (!voiceAudioRef.current) {
      voiceAudioRef.current = new Audio();
      voiceAudioRef.current.preload = "auto";
    }
    if (!bgmAudioRef.current) {
      bgmAudioRef.current = new Audio();
      bgmAudioRef.current.preload = "auto";
      bgmAudioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    const audio = voiceAudioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = (settings.masterVolume / 100) * (settings.voiceVolume / 100);
  }, [settings.masterVolume, settings.voiceVolume]);

  useEffect(() => {
    const audio = bgmAudioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = (settings.masterVolume / 100) * (settings.bgmVolume / 100);
  }, [settings.masterVolume, settings.bgmVolume]);

  useEffect(() => {
    if (screenMode !== "story" || !currentEvent || currentEvent.type !== "dialogue") {
      stopVoicePlayback();
      return;
    }
    if (!currentEvent.voice) {
      stopVoicePlayback();
      return;
    }
    const audio = voiceAudioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.src = currentEvent.voice;
    audio.currentTime = 0;
    audio.volume = (settings.masterVolume / 100) * (settings.voiceVolume / 100);
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentEvent, screenMode]);

  useEffect(() => {
    if (screenMode !== "story") {
      stopBgmPlayback();
      return;
    }
    const audio = bgmAudioRef.current;
    if (!audio) {
      return;
    }
    const trackPath = normalizeAssetPath(currentBgm);
    if (!trackPath) {
      stopBgmPlayback();
      return;
    }
    if (audio.getAttribute("src") === trackPath) {
      return;
    }
    audio.pause();
    audio.src = trackPath;
    audio.currentTime = 0;
    audio.volume = (settings.masterVolume / 100) * (settings.bgmVolume / 100);
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
    };
  }, [currentBgm, screenMode, settings.masterVolume, settings.bgmVolume]);

  useEffect(() => {
    if (screenMode !== "story" || currentChoice || !typewriterDone || !autoMode) {
      return;
    }
    if (!currentEvent || currentEvent.type !== "dialogue") {
      return;
    }
    const timer = window.setTimeout(() => {
      advanceDialogue();
    }, settings.autoSpeed);
    return () => window.clearTimeout(timer);
  }, [autoMode, currentChoice, currentEvent, screenMode, settings.autoSpeed, typewriterDone]);

  useEffect(() => {
    if (screenMode !== "story" || !currentEvent || currentEvent.type !== "dialogue") {
      return;
    }
    const snapshot: SaveSnapshot = {
      sceneId: currentScene.id,
      eventIndex,
      background,
      bgm: currentBgm,
      activeCharacters,
      flags,
      settings
    };
    void saveProgress(snapshot).then(() => setHasSave(true));
  }, [
    activeCharacters,
    background,
    currentBgm,
    currentEvent,
    currentScene.id,
    eventIndex,
    flags,
    screenMode,
    settings
  ]);

  const speakerCharacter = useMemo(() => {
    if (!dialogueState.speaker) {
      return null;
    }
    return characters.find((character) => character.id === dialogueState.speaker) ?? null;
  }, [dialogueState.speaker]);

  const activeSpeaker = useMemo(() => {
    if (!dialogueState.speaker) {
      return null;
    }
    return activeCharacters.find((character) => character.characterId === dialogueState.speaker) ?? null;
  }, [activeCharacters, dialogueState.speaker]);

  const startNewStory = () => {
    openScene(entrySceneId, { carryFlags: {}, keepScreenMode: false });
    setAutoMode(false);
  };

  const continueStory = async () => {
    const snapshot = await loadProgress();
    if (!snapshot) {
      return;
    }
    const savedScene = getScene(snapshot.sceneId);
    if (!savedScene) {
      openScene(entrySceneId, { carryFlags: {}, keepScreenMode: false });
      return;
    }
    stopVoicePlayback();
    stopBgmPlayback();
    setCurrentSceneId(savedScene.id);
    setBackground(snapshot.background);
    setCurrentBgm(snapshot.bgm ?? savedScene.initialState.bgm ?? "");
    setActiveCharacters(snapshot.activeCharacters);
    setFlags({
      ...savedScene.initialState.flags,
      ...snapshot.flags
    });
    setSettings({ ...defaultSettings, ...snapshot.settings });
    setCurrentChoice(null);
    setDialogueState(initialDialogueState);
    setTypewriterDone(false);
    setRevealAllSignal((value) => value + 1);
    setEventIndex(snapshot.eventIndex);
    setStoryEnded(false);
    setScreenMode("story");
  };

  const advanceDialogue = () => {
    if (!currentEvent || currentEvent.type !== "dialogue") {
      return;
    }
    if (!typewriterDone) {
      setRevealAllSignal((value) => value + 1);
      return;
    }
    setEventIndex((index) => index + 1);
  };

  const rewindDialogue = () => {
    if (screenMode !== "story" || eventIndex <= 0) {
      return;
    }
    stopVoicePlayback();
    setCurrentChoice(null);
    setStoryEnded(false);
    setTypewriterDone(false);
    setRevealAllSignal((value) => value + 1);
    setEventIndex((index) => Math.max(0, index - 1));
  };

  const handleSceneClick = () => {
    if (screenMode !== "story" || storyEnded || currentChoice) {
      return;
    }
    advanceDialogue();
  };

  const chooseOption = (option: ChoiceEvent["options"][number]) => {
    stopVoicePlayback();
    if (option.setFlag) {
      setFlags((current) => ({ ...current, [option.setFlag.key]: option.setFlag.value }));
    }
    setCurrentChoice(null);
    setEventIndex(resolveEventIndex(option.jumpTo, currentSceneIndex));
  };

  const getBackgroundStyle = () => {
    if (screenMode === "title" && titleScreenConfig.background) {
      const titleBackground = normalizeAssetPath(titleScreenConfig.background);
      return {
        backgroundImage: `url(${titleBackground})`
      };
    }
    if (background.startsWith("linear-gradient")) {
      return { backgroundImage: background };
    }
    return {
      backgroundImage: `url(${normalizeAssetPath(background)})`
    };
  };

  const getPortraitStyle = (character: ActiveCharacter) => {
    const definition = characterMap.get(character.characterId);
    const spritePath = resolveSpriteSource(resolveSpriteDefinition(definition, character.sprite));
    const anchor = definition?.anchor ?? {};
    return {
      "--character-offset-x": `${anchor.x ?? 0}%`,
      "--character-offset-y": `${anchor.y ?? 0}%`,
      "--character-scale": anchor.scale ?? 1,
      backgroundImage: spritePath
        ? `url(${normalizeAssetPath(spritePath)})`
        : "radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(69,208,228,0.18) 50%, rgba(4,18,30,0.08) 70%)"
    } as CSSProperties;
  };

  const portraitLayout = {
    ...(speakerCharacter?.portraitLayout ?? {}),
    ...(resolveVariantPortraitLayout(speakerCharacter, activeSpeaker?.sprite) ?? {})
  };
  const speakerPortraitSource =
    dialogueState.portrait ||
    resolveVariantPortrait(speakerCharacter, activeSpeaker?.sprite) ||
    speakerCharacter?.portrait;
  const portraitWrapperStyle = {
    "--portrait-width": `${portraitLayout.width ?? 300}px`,
    "--portrait-height": `${portraitLayout.height ?? 230}px`,
    "--portrait-gap-adjust": `${portraitLayout.gapAdjust ?? 0}px`
  } as CSSProperties;
  const portraitImageStyle = {
    "--portrait-scale": portraitLayout.scale ?? 1,
    "--portrait-offset-x": `${portraitLayout.offsetX ?? 0}px`,
    "--portrait-offset-y": `${portraitLayout.offsetY ?? 0}px`
  } as CSSProperties;

  const currentScenePosition = orderedScenes.findIndex((scene) => scene.id === currentScene.id);

  return (
    <main className="app-shell">
      <div className="background-layer" style={getBackgroundStyle()} />
      <div className="light-columns" />
      {screenMode === "title" ? (
        <TitleScreen
          key={JSON.stringify(titleColumns)}
          canContinue={hasSave}
          onStart={startNewStory}
          onContinue={() => {
            void continueStory();
          }}
          onSettings={() => setSettingsOpen(true)}
          titleColumns={titleColumns}
          subtitle={titleScreenConfig.subtitle}
        />
      ) : (
        <section className="story-screen" onClick={handleSceneClick}>
          <div className="character-stage">
            {activeCharacters.map((character) => {
              const definition = characterMap.get(character.characterId);
              return (
                <div
                  key={`${character.position}-${character.characterId}-${character.sprite}`}
                  className={`character-card character-card--${character.position} character-card--${character.transition ?? "fade"}`}
                  style={getPortraitStyle(character)}
                >
                  {!definition?.sprites[character.sprite] ? (
                    <span className="character-card__placeholder">{definition?.name ?? "?"}</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="dialogue-shell">
            <div className="dialogue-ornament dialogue-ornament--left" />
            <div className="dialogue-ornament dialogue-ornament--right" />
            <div className="portrait-chip" style={portraitWrapperStyle}>
              {speakerPortraitSource ? (
                <img
                  src={speakerPortraitSource}
                  alt={speakerCharacter?.name ?? "portrait"}
                  style={portraitImageStyle}
                />
              ) : (
                <div className="portrait-chip__fallback">
                  {speakerCharacter?.name?.slice(0, 1) ?? "旁"}
                </div>
              )}
            </div>
            <div className="dialogue-panel">
              <div className="dialogue-panel__header">
                <span
                  className="speaker-badge"
                  style={{ color: speakerCharacter?.accent ?? "#fff3fb" }}
                >
                  {speakerCharacter?.name ?? dialogueState.speaker ?? "旁白"}
                </span>
              </div>
              <div className="dialogue-panel__body">
                <TypewriterText
                  text={dialogueState.text}
                  speed={settings.textSpeed}
                  revealAllSignal={revealAllSignal}
                  onComplete={() => setTypewriterDone(true)}
                />
              </div>
              {currentChoice && isChoiceEvent(currentChoice) ? (
                <div className="choices">
                  {currentChoice.options.map((option) => (
                    <button
                      key={option.label}
                      className="choice-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseOption(option);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="dialogue-panel__footer">
                  <span>点击以继续</span>
                  <div className="dialogue-panel__actions">
                    <button
                      className="dialogue-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        rewindDialogue();
                      }}
                      disabled={eventIndex <= 0}
                    >
                      回退一条
                    </button>
                    <button
                      className="dialogue-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        setScreenMode("title");
                      }}
                    >
                      返回主页
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettings}
      />
    </main>
  );
}
