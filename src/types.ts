export type CharacterSlot = "left" | "center" | "right";

export type PortraitLayout = {
  width?: number;
  height?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  gapAdjust?: number;
};

export type CharacterSpriteDefinition =
  | string
  | {
      src: string;
      portrait?: string;
      portraitLayout?: PortraitLayout;
    };

export type CharacterDefinition = {
  id: string;
  name: string;
  accent: string;
  portrait?: string;
  portraitLayout?: PortraitLayout;
  sprites: Record<string, CharacterSpriteDefinition | undefined>;
  anchor?: {
    x?: number;
    y?: number;
    scale?: number;
  };
};

export type DialogueEvent = {
  type: "dialogue";
  id?: string;
  speaker: string;
  text: string;
  portrait?: string;
  voice?: string;
};

export type BackgroundEvent = {
  type: "background";
  id?: string;
  background: string;
};

export type BgmEvent = {
  type: "bgm";
  id?: string;
  track?: string;
};

export type ShowCharacterEvent = {
  type: "showCharacter";
  id?: string;
  characterId: string;
  sprite: string;
  position: CharacterSlot;
  expression?: string;
  transition?: "fade" | "slide";
};

export type HideCharacterEvent = {
  type: "hideCharacter";
  id?: string;
  position: CharacterSlot;
};

export type ChoiceEvent = {
  type: "choice";
  id?: string;
  prompt: string;
  options: Array<{
    label: string;
    jumpTo: string;
    setFlag?: {
      key: string;
      value: boolean | number | string;
    };
  }>;
};

export type JumpEvent = {
  type: "jump";
  id?: string;
  target: string;
};

export type SetFlagEvent = {
  type: "setFlag";
  id?: string;
  key: string;
  value: boolean | number | string;
};

export type IfEvent = {
  type: "if";
  id?: string;
  key: string;
  equals: boolean | number | string;
  then: string;
  else?: string;
};

export type EndEvent = {
  type: "end";
  id?: string;
};

export type ChangeSceneEvent = {
  type: "changeScene";
  id?: string;
  targetSceneId: string;
};

export type SceneEvent =
  | DialogueEvent
  | BackgroundEvent
  | BgmEvent
  | ShowCharacterEvent
  | HideCharacterEvent
  | ChoiceEvent
  | JumpEvent
  | SetFlagEvent
  | IfEvent
  | ChangeSceneEvent
  | EndEvent;

export type SceneDefinition = {
  id: string;
  title?: string;
  nextSceneId?: string;
  initialState: {
    background: string;
    bgm?: string;
    flags: Record<string, boolean | number | string>;
  };
  events: SceneEvent[];
};

export type ActiveCharacter = {
  characterId: string;
  sprite: string;
  position: CharacterSlot;
  expression?: string;
  transition?: "fade" | "slide";
};

export type Settings = {
  textSpeed: number;
  autoSpeed: number;
  masterVolume: number;
  voiceVolume: number;
  bgmVolume: number;
};

export type SaveSnapshot = {
  sceneId: string;
  eventIndex: number;
  background: string;
  bgm?: string;
  activeCharacters: ActiveCharacter[];
  flags: Record<string, boolean | number | string>;
  settings: Settings;
};

export type StoryConfig = {
  entrySceneId: string;
  sceneOrder: string[];
  titleScreen?: {
    background?: string;
    titleColumns?: string[];
    subtitle?: string;
  };
};
