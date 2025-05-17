import {GameState} from "src/types";
import "./App.css";
import GameView from "./pages/GameView";
import * as automerge from "@automerge/automerge/next";

function App() {
  const someGame: GameState = automerge.from({
      gameId: "testGame",
      players: {},
      seatOrder: [],
      board: {},
      chatLog: [],
    } satisfies GameState
  );

  return <GameView gameState={someGame}/>;
}

export default App;
