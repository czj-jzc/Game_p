import { useEffect, useMemo, useState, type CSSProperties } from "react";
import sceneData from "../data/scenes/prologue.json";
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
import type {
  ActiveCharacter,
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

const scene = sceneData as SceneDefinition;
const characters = charactersData as CharacterDefinition[];
const characterMap = new Map(characters.map((character) => [character.id, character]));
const sceneIndex = indexSceneEvents(scene);

const initialDialogueState: DialogueState = {
  text: ""
};

export default function App() {
  const [screenMode, setScreenMode] = useState<ScreenMode>("title");
  const [background, setBackground] = useState(scene.initialState.background);
  const [activeCharacters, setActiveCharacters] = useState<ActiveCharacter[]>([]);
  const [dialogueState, setDialogueState] = useState<DialogueState>(initialDialogueState);
  const [eventIndex, setEventIndex] = useState(0);
  const [flags, setFlags] = useState<Record<string, boolean | number | string>>(
    scene.initialState.flags
  );
  const [currentChoice, setCurrentChoice] = useState<ChoiceEvent | null>(null);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [revealAllSignal, setRevealAllSignal] = useState(0);
  const [hasSave, setHasSave] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);
  const currentEvent = scene.events[eventIndex];

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
      return;
    }
    if (!currentEvent) {
      return;
    }

    if (currentEvent.type === "background") {
      setBackground(currentEvent.background);
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
      setEventIndex(resolveEventIndex(currentEvent.target, sceneIndex));
      return;
    }

    if (currentEvent.type === "if") {
      const nextTarget =
        flags[currentEvent.key] === currentEvent.equals ? currentEvent.then : currentEvent.else;
      if (nextTarget) {
        setEventIndex(resolveEventIndex(nextTarget, sceneIndex));
      } else {
        setEventIndex((index) => index + 1);
      }
      return;
    }

    if (currentEvent.type === "choice") {
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

    if (currentEvent.type === "end") {
      setCurrentChoice(null);
      setStoryEnded(true);
      setTypewriterDone(true);
      setDialogueState({
        speaker: "系统",
        text: "垂直切片结束。你可以回到标题页继续扩展内容。"
      });
      void clearProgress();
      setHasSave(false);
    }
  }, [currentEvent, flags, screenMode]);

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
      sceneId: scene.id,
      eventIndex,
      background,
      activeCharacters,
      flags,
      settings
    };
    void saveProgress(snapshot).then(() => setHasSave(true));
  }, [activeCharacters, background, currentEvent, eventIndex, flags, screenMode, settings]);

  const speakerCharacter = useMemo(() => {
    if (!dialogueState.speaker) {
      return null;
    }
    return characters.find((character) => character.id === dialogueState.speaker) ?? null;
  }, [dialogueState.speaker]);

  const startNewStory = () => {
    setScreenMode("story");
    setStoryEnded(false);
    setBackground(scene.initialState.background);
    setActiveCharacters([]);
    setDialogueState(initialDialogueState);
    setFlags({ ...scene.initialState.flags });
    setCurrentChoice(null);
    setEventIndex(0);
    setRevealAllSignal((value) => value + 1);
  };

  const continueStory = async () => {
    const snapshot = await loadProgress();
    if (!snapshot) {
      return;
    }
    hydrateFromSave(snapshot);
    setScreenMode("story");
    setStoryEnded(false);
  };

  const hydrateFromSave = (snapshot: SaveSnapshot) => {
    setBackground(snapshot.background);
    setActiveCharacters(snapshot.activeCharacters);
    setFlags(snapshot.flags);
    setSettings(snapshot.settings);
    setCurrentChoice(null);
    setDialogueState(initialDialogueState);
    setRevealAllSignal((value) => value + 1);
    setEventIndex(snapshot.eventIndex);
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

  const handleSceneClick = () => {
    if (screenMode !== "story" || storyEnded || currentChoice) {
      return;
    }
    advanceDialogue();
  };

  const chooseOption = (option: ChoiceEvent["options"][number]) => {
    if (option.setFlag) {
      setFlags((current) => ({ ...current, [option.setFlag!.key]: option.setFlag!.value }));
    }
    setCurrentChoice(null);
    setEventIndex(resolveEventIndex(option.jumpTo, sceneIndex));
  };

  const getBackgroundStyle = () => {
    if (background.startsWith("linear-gradient")) {
      return { backgroundImage: background };
    }
    return {
      backgroundImage: `url(${background})`
    };
  };

  const getPortraitStyle = (character: ActiveCharacter) => {
    const definition = characterMap.get(character.characterId);
    const spritePath = definition?.sprites[character.sprite];
    const anchor = definition?.anchor ?? {};
    return {
      "--character-offset-x": `${anchor.x ?? 0}%`,
      "--character-offset-y": `${anchor.y ?? 0}%`,
      "--character-scale": anchor.scale ?? 1,
      backgroundImage: spritePath
        ? `url(${spritePath})`
        : `radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(69,208,228,0.18) 50%, rgba(4,18,30,0.08) 70%)`
    } as CSSProperties;
  };

  return (
    <main className="app-shell">
      <div className="background-layer" style={getBackgroundStyle()} />
      <div className="light-columns" />
      {screenMode === "title" ? (
        <TitleScreen
          canContinue={hasSave}
          onStart={startNewStory}
          onContinue={() => {
            void continueStory();
          }}
          onSettings={() => setSettingsOpen(true)}
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

          <div className="hud-row">
            <div className="portrait-chip">
              {speakerCharacter?.portrait || dialogueState.portrait ? (
                <img
                  src={dialogueState.portrait ?? speakerCharacter?.portrait}
                  alt={speakerCharacter?.name ?? "portrait"}
                />
              ) : (
                <div className="portrait-chip__fallback">
                  {speakerCharacter?.name?.slice(0, 1) ?? "旁"}
                </div>
              )}
            </div>
            <div className="system-strip">
              <button onClick={() => setScreenMode("title")}>Title</button>
              <button onClick={() => setAutoMode((value) => !value)}>
                {autoMode ? "Auto On" : "Auto Off"}
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                Config
              </button>
            </div>
          </div>

          <div className="dialogue-panel">
            <div className="dialogue-panel__header">
              <span
                className="speaker-badge"
                style={{ borderColor: speakerCharacter?.accent ?? "rgba(122, 232, 248, 0.7)" }}
              >
                {speakerCharacter?.name ?? dialogueState.speaker ?? "旁白"}
              </span>
              <span className="scene-status">{scene.id}</span>
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
                <span>{typewriterDone ? "Click to continue" : "Click to reveal text"}</span>
                <span>{storyEnded ? "End" : "Line " + (eventIndex + 1)}</span>
              </div>
            )}
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
