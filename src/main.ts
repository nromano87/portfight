import { Game } from "./game";

const root = document.getElementById("game-root");
if (!root) throw new Error("missing #game-root");
new Game(root);
