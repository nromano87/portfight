# PortFight

Browser graybox of the 5-minute harbor extraction brawl. First slice: walk the port, cutlass / flintlock / musket, body loot, extract, craft Pirate Nation skins.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Controls

- **WASD** move (when down: pan the camera to watch the match)
- **Auto-attack** — gold circle is your reach; anyone inside gets hit. Guns need line of sight. Click a pirate to see their kit.
- **Q** holster gun / draw gun (cutlass stays on your belt either way)
- **1** cutlass · **2** gun
- **F** pick up loot on the ground
- **E** open barrels / crates / chests. At an opened crate with a gun: reload. **Hold E** on a green extract to leave.
- **R** when dead or after the match: restart / choose pirate

## Navy clock

Matches last **5:00**. The HUD counts down from 5:00 to 0:00:

- **2:00** — The Gull and The Wren go green on the west end of each pier. Hold E 4s, cancelled if you take damage. Standing on the green at 0:00 still gets you out.
- **1:00** — Fort Bell opens.
- **0:00** — ships leave. If you are not on a green extract, the Navy screen.

You spawn west of **The Grog**. Seven other pirates spawn on the rim. The Gull and The Wren drift in from the sea and dock at **2:00**. Every pirate gets one starter barrel ~6m away; **B5** is on the north warehouse apron and **B16** is in the fort yard. Crates, the galleon lockbox, the keep chest, and ten trophy chests (**T1–T10**) are inland. Crate **U1** in the north warehouse is a flintlock. Lockbox **R2** on the galleon is a musket. Gold chest **E1** in the fort is a ship part (Cotton Sail, Wooden Helm, Iron Sights, Iron Cannon, or Iron Armor). Trophy chests drop Pirate Nation crafting reagents only — Wood, Cotton, Iron Ore up through Spyglass / Compass / Mermaid Scale. No guns.

Guns stay in the harbor. Extract a named reagent and craft it into a Pirate Nation pirate skin (HUD PFP and in-match body). Progress stays in this browser.

There are **five islands**, each with its own map:

- **Gull Harbor** — horseshoe port, piers on the west
- **Wren Reach** — long north–south spit, jetties off the north tip
- **Copper Cay** — compact cay, cove and piers on the east
- **Oak Atoll** — ring around a lagoon, mouth to the south
- **Blackwater** — stone L, piers on the west arm

Sky, water, lighting, and loot tables change too. An island drops its own items plus everything from earlier islands. Successfully extracting from island N unlocks N+1 and puts you there next match — you can still pick any unlocked island to farm. Blackwater (5) is the only place Iron Sights, Iron Cannon, and Iron Armor drop, and those are the keys for Skeleton Limited, Ghost Limited, and Black Knight Spirit.

Each skin wants specific named items, not a generic rarity pile. Gull Harbor skins are one island-1 item. Wren Reach captains mix island 1+2. Copper Cay, Oak Atoll, then Blackwater for the three legendaries.

Not in this slice: netcode, Stripe, player shop, Navy Strongbox.

## Specs

Pitch, harbor, trophies, and art reuse live in [`docs/`](docs/).
