export type CharacterSlot = "left" | "center" | "right";

export type CharacterDefinition = {
  id: string;
  name: string;
  accent: string;
  portrait?: string;
  sprites: Record<string, string | undefined>;
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

export type SceneEvent =
  | DialogueEvent
  | BackgroundEvent
  | ShowCharacterEvent
  | HideCharacterEvent
  | ChoiceEvent
  | JumpEvent
  | SetFlagEvent
  | IfEvent
  | EndEvent;

export type SceneDefinition = {
  id: string;
  initialState: {
    background: string;
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
};

export type SaveSnapshot = {
  sceneId: string;
  eventIndex: number;
  background: string;
  activeCharacters: ActiveCharacter[];
  flags: Record<string, boolean | number | string>;
  settings: Settings;
};
