import { Game } from "./game";

const NARROW = "(max-width: 900px), (max-height: 560px)";

const root = document.getElementById("game-root");
if (!root) throw new Error("missing #game-root");
const mount = root;

const mq = matchMedia(NARROW);
let started = false;

function boot() {
  if (mq.matches || started) return;
  started = true;
  new Game(mount);
}

mq.addEventListener("change", boot);
boot();
