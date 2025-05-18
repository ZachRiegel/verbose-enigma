export type GameState = {
  gameId: string;
  players: {
    [id: string]: Player;
  };
  seatOrder?: string[];
  board: {
    [id: string]: GameObject;
  };
  chatLog: Message[];
};

export type CardIdentifier = {
  set: string;
  collectorNumber: string;
}

export type GameObjectPosition<width extends number, height extends number> = {
  x: number;
  y: number;
  width: width;
  height: height;
}

export type Rotation = 0 | 1 | 2 | 3;

export type GameCard = CardIdentifier & GameObjectPosition<5, 5> & {
  rotation: Rotation;
  transformed: boolean;
  flipped: boolean;
};

export type CardInfo = {
  image_uris: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
};

export type Player = {};
export type GameObject = {};
export type Message = {
  sender: string;
  contents: string;
};
