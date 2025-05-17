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

export type Player = {};
export type GameObject = {};
export type Message = {
  sender: string;
  contents: string;
};
