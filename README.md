# PortFight

Browser graybox of the 10-minute harbor extraction brawl. First slice: walk the port, cutlass / flintlock / musket, body loot, extract, one PFP craft.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Controls

- **WASD** move (when down: pan the camera to watch the match)
- **Mouse** aim — gold pie is yours; other pirates show a dimmer pie in their color
- **Click** a pirate to see their gun (and still attack that way)
- **Q** holster gun / draw gun (cutlass stays on your belt either way)
- **1** cutlass · **2** gun
- **E** open barrels, pick up loot, hold to extract
- **R** restart (bots, loot, and the clock reset)

## Graybox clock

Real matches are 10 minutes. This build compresses that into **3:00** so you can test extracts:

- **1:48** (Navy 6:00) — The Gull and The Wren go green on the west end of each pier. Hold E 4s, cancelled if you take damage. Standing on the green at 3:00 still gets you out.
- **2:24** (Navy 8:00) — Fort Bell opens.
- **3:00** (Navy 10:00) — ships leave. If you are not on a green extract, the Navy screen.

You spawn west of **The Grog**. Seven other pirates spawn on the rim. The Gull and The Wren drift in from the sea and dock at **1:48**. Every pirate gets one starter barrel ~6m away; crates, the galleon lockbox, and the keep chest are inland. Crate **U1** in the north warehouse is a flintlock. Lockbox **R2** on the galleon is a musket. Gold chest **E1** in the fort is the Keep Seal.

Guns stay in the harbor. Extract with a bent doubloon; five junk crafts a **Dockhand colorway** PFP.

Not in this slice: netcode, Stripe, player shop, the other recipes.

## Specs

Pitch, harbor, trophies, and art reuse live in [`docs/`](docs/).
