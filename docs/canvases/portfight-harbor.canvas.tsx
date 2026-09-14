import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type Tab = "map" | "crates" | "weapons" | "timing";
type ZoneId =
  | "north-wharf"
  | "south-slip"
  | "n-warehouse"
  | "s-warehouse"
  | "tavern"
  | "market"
  | "rope-walk"
  | "galleon"
  | "fort";

const ZONES: Record<
  ZoneId,
  {
    name: string;
    range: string;
    role: string;
    crates: string;
    extract?: string;
  }
> = {
  "north-wharf": {
    name: "North Wharf",
    range: "Long — open pier",
    role: "Extract A. Musket country. No cover except bollards and stacked crates.",
    crates: "B1 B2",
    extract: "The Gull (opens 6:00)",
  },
  "south-slip": {
    name: "South Slip",
    range: "Long — open pier",
    role: "Extract B, mirror of North. Third-parties shoot from Warehouse Row.",
    crates: "B3 B4",
    extract: "The Wren (opens 6:00)",
  },
  "n-warehouse": {
    name: "North Warehouse",
    range: "Mid alleys, long if you hold the loading door",
    role: "First guns. Interiors punish muskets. Best path onto North Wharf.",
    crates: "B5 B6 · U1 U2",
  },
  "s-warehouse": {
    name: "South Warehouse",
    range: "Same as north, mirrored",
    role: "Same loot density so south spawns are not a dead half.",
    crates: "B7 B8 · U3 U4",
  },
  tavern: {
    name: "The Grog",
    range: "Melee / blunderbuss",
    role: "Interior labyrinth. Bar is uncommon. Cellar is a rare — and a legendary roll.",
    crates: "B9 · U5 · R1",
  },
  market: {
    name: "Market Street",
    range: "Mixed. Worst place to linger",
    role: "Center killbox. Three barrels as bait. Bodies here are a second match.",
    crates: "B10 B11 B12",
  },
  "rope-walk": {
    name: "Rope Walk",
    range: "Short alleys",
    role: "Flee route between tavern, market, and fort. Two barrels. Tight corners.",
    crates: "B13 B14",
  },
  galleon: {
    name: "The Parked Galleon",
    range: "Deck = long, cabin = melee",
    role: "Rare in the cabin. Loud footsteps on wood. Legendary can roll in the hold.",
    crates: "R2",
  },
  fort: {
    name: "Inner Fort",
    range: "Yard mid, armory close, keep mixed",
    role: "Best loot. Epic in the keep. Bell extract at 8:00. Last greedy pirates die here.",
    crates: "B15 B16 · U6 · R3 · E1",
    extract: "Fort Bell (opens 8:00)",
  },
};

export default function PortFightHarbor() {
  const [tab, setTab] = useCanvasState<Tab>("portfight.harbor.tab", "map");

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>PortFight — The Harbor</H1>
        <Text tone="secondary">
          Gull Harbor (island 1). Eight pirates. Five minutes. Two dock
          extracts and a late fort bell. Later islands keep the same extract
          rules on different silhouettes — a north-south spit, an east cove,
          a lagoon ring, and a stone L. Art: Pirate Nation voxels for pirates,
          island buildings, and terrain tiles; Glitterfin ships for extracts,
          Lurker Chest for lockboxes, combat cards for weapon icons.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="~180m" label="Sprint across (about 25s)" />
        <Stat value="8" label="Players / spawn points" />
        <Stat value="26–27" label="Containers per match" />
        <Stat value="3" label="Extracts (2 early, 1 late)" />
      </Grid>

      <Row gap={8} wrap>
        {(
          [
            ["map", "Map"],
            ["crates", "Crate table"],
            ["weapons", "Weapons"],
            ["timing", "Navy clock"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <span key={id}>
            <Pill active={tab === id} onClick={() => setTab(id)}>
              {label}
            </Pill>
          </span>
        ))}
      </Row>

      {tab === "map" && <MapTab />}
      {tab === "crates" && <CrateTab />}
      {tab === "weapons" && <WeaponTab />}
      {tab === "timing" && <TimingTab />}
    </Stack>
  );
}

function MapTab() {
  const [zone, setZone] = useCanvasState<ZoneId>("portfight.harbor.zone", "market");
  const z = ZONES[zone];

  return (
    <Stack gap={16}>
      <Text tone="secondary">
        Horseshoe harbor, water to the west, fort on the east rise. Click a
        label on the schematic.
      </Text>
      <HarborSvg active={zone} onSelect={setZone} />
      <Card>
        <CardHeader trailing={z.extract ?? "No extract"}>{z.name}</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>
              {z.role} {z.range}.
            </Text>
            <Text size="small" tone="secondary">
              Crates: {z.crates}
            </Text>
          </Stack>
        </CardBody>
      </Card>

      <H2>Spawn rules</H2>
      <Table
        headers={["#", "Where", "First crate", "Do not"]}
        striped
        rows={[
          ["1", "North pier finger", "B1, then warehouse U1", "On The Gull’s gangplank"],
          ["2", "North warehouse seaward wall", "U1 / U2", "Inside the fort"],
          ["3", "West beach behind The Grog", "B9 or tavern U5", "In the cellar"],
          ["4", "South warehouse seaward wall", "U3 / U4", "Inside the fort"],
          ["5", "South pier finger", "B3, then warehouse U3", "On The Wren’s gangplank"],
          ["6", "East cliff under the fort", "Fort yard B15 or Rope Walk", "In the keep"],
          ["7", "Rope Walk north mouth", "B13, rotate to market or tavern", "Market center"],
          ["8", "Rope Walk south mouth", "B14, same", "Market center"],
        ]}
      />
      <Callout tone="info" title="Fair halves">
        North and South Warehouse are loot-mirrored. The Fort is richer and
        farther from every spawn except #6 — that player gets a worse first
        crate and a shorter run to E1. That is the only spawn with a real
        bias, and it is the greedy spawn.
      </Callout>
    </Stack>
  );
}

function HarborSvg({
  active,
  onSelect,
}: {
  active: ZoneId;
  onSelect: (id: ZoneId) => void;
}) {
  const theme = useHostTheme();
  const water = theme.fill.tertiary;
  const land = theme.fill.secondary;
  const ink = theme.stroke.primary;
  const muted = theme.text.secondary;
  const accent = theme.accent.primary;
  const label = theme.text.primary;

  const hit = (id: ZoneId) => (active === id ? accent : "transparent");
  const stroke = (id: ZoneId) => (active === id ? accent : ink);

  return (
    <svg
      viewBox="0 0 640 420"
      width="100%"
      role="img"
      aria-label="Harbor schematic"
      style={{ display: "block", border: `1px solid ${theme.stroke.tertiary}` }}
    >
      <rect x="0" y="0" width="640" height="420" fill={theme.bg.editor} />
      {/* Water */}
      <rect x="0" y="0" width="280" height="420" fill={water} />
      <text x="16" y="24" fill={muted} fontSize="11">
        SEA
      </text>

      {/* Land mass */}
      <path
        d="M200,20 L620,20 L620,400 L200,400 L200,300 L260,300 L260,120 L200,120 Z"
        fill={land}
        stroke={ink}
        strokeWidth="1"
      />

      {/* North pier */}
      <g
        onClick={() => onSelect("north-wharf")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="40"
          y="70"
          width="220"
          height="36"
          fill={hit("north-wharf")}
          stroke={stroke("north-wharf")}
          strokeWidth="1.5"
        />
        <text x="48" y="92" fill={label} fontSize="12">
          North Wharf · The Gull
        </text>
      </g>

      {/* South pier */}
      <g
        onClick={() => onSelect("south-slip")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="40"
          y="314"
          width="220"
          height="36"
          fill={hit("south-slip")}
          stroke={stroke("south-slip")}
          strokeWidth="1.5"
        />
        <text x="48" y="336" fill={label} fontSize="12">
          South Slip · The Wren
        </text>
      </g>

      {/* Warehouses */}
      <g
        onClick={() => onSelect("n-warehouse")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="270"
          y="48"
          width="130"
          height="70"
          fill={hit("n-warehouse")}
          stroke={stroke("n-warehouse")}
          strokeWidth="1.5"
        />
        <text x="284" y="88" fill={label} fontSize="12">
          N Warehouse
        </text>
      </g>
      <g
        onClick={() => onSelect("s-warehouse")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="270"
          y="302"
          width="130"
          height="70"
          fill={hit("s-warehouse")}
          stroke={stroke("s-warehouse")}
          strokeWidth="1.5"
        />
        <text x="284" y="342" fill={label} fontSize="12">
          S Warehouse
        </text>
      </g>

      {/* Tavern */}
      <g onClick={() => onSelect("tavern")} style={{ cursor: "pointer" }}>
        <rect
          x="200"
          y="150"
          width="90"
          height="120"
          fill={hit("tavern")}
          stroke={stroke("tavern")}
          strokeWidth="1.5"
        />
        <text x="214" y="214" fill={label} fontSize="12">
          The Grog
        </text>
      </g>

      {/* Market */}
      <g onClick={() => onSelect("market")} style={{ cursor: "pointer" }}>
        <rect
          x="310"
          y="160"
          width="120"
          height="100"
          fill={hit("market")}
          stroke={stroke("market")}
          strokeWidth="1.5"
        />
        <text x="330" y="214" fill={label} fontSize="12">
          Market St
        </text>
      </g>

      {/* Rope walk */}
      <g
        onClick={() => onSelect("rope-walk")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="440"
          y="150"
          width="44"
          height="120"
          fill={hit("rope-walk")}
          stroke={stroke("rope-walk")}
          strokeWidth="1.5"
        />
        <text
          x="462"
          y="210"
          fill={label}
          fontSize="11"
          textAnchor="middle"
          transform="rotate(-90 462 210)"
        >
          Rope Walk
        </text>
      </g>

      {/* Galleon in the basin */}
      <g onClick={() => onSelect("galleon")} style={{ cursor: "pointer" }}>
        <ellipse
          cx="150"
          cy="210"
          rx="70"
          ry="28"
          fill={hit("galleon")}
          stroke={stroke("galleon")}
          strokeWidth="1.5"
        />
        <text x="118" y="214" fill={label} fontSize="11">
          Galleon
        </text>
      </g>

      {/* Fort */}
      <g onClick={() => onSelect("fort")} style={{ cursor: "pointer" }}>
        <rect
          x="500"
          y="110"
          width="110"
          height="200"
          fill={hit("fort")}
          stroke={stroke("fort")}
          strokeWidth="1.5"
        />
        <text x="528" y="214" fill={label} fontSize="12">
          Inner Fort
        </text>
      </g>

      <text x="16" y="408" fill={muted} fontSize="10">
        Click a zone · extracts on the two piers and the fort bell
      </text>
    </svg>
  );
}

function CrateTab() {
  return (
    <Stack gap={16}>
      <H2>Container roster</H2>
      <Text tone="secondary">
        One cutlass is already in your hand. Barrels mostly feed ammo, rum,
        and uncommon guns. Named boxes are where the match is decided. IDs
        match the map.
      </Text>
      <Table
        headers={["ID", "Type", "Zone", "Cover", "Why it is there"]}
        striped
        rows={[
          ["B1 B2", "Barrel", "North Wharf", "None", "Panic loot if you rotate to The Gull late."],
          ["B3 B4", "Barrel", "South Slip", "None", "Mirror."],
          ["B5 B6", "Barrel", "N Warehouse exterior", "Low", "Spawn food."],
          ["B7 B8", "Barrel", "S Warehouse exterior", "Low", "Spawn food."],
          ["B9", "Barrel", "Tavern door", "Doorframe", "Lure people onto the porch."],
          ["B10–12", "Barrel", "Market Street", "Stalls", "Bait. Third-party central."],
          ["B13 B14", "Barrel", "Rope Walk", "Corners", "Flee-route crumbs."],
          ["B15 B16", "Barrel", "Fort yard", "Sandbags", "Pay the approach tax."],
          ["U1 U2", "Crate", "N Warehouse interior", "Full", "First real guns, north."],
          ["U3 U4", "Crate", "S Warehouse interior", "Full", "First real guns, south."],
          ["U5", "Crate", "Tavern bar", "Full", "Interior power for The Grog."],
          ["U6", "Crate", "Fort shed", "Full", "One uncommon so the fort is not rares-only."],
          ["R1", "Lockbox", "Tavern cellar", "Full, stairs", "Melee players get a rare too."],
          ["R2", "Lockbox", "Galleon cabin", "Cabin", "Contest the water."],
          ["R3", "Lockbox", "Fort armory", "Full", "Expected rare."],
          ["E1", "Captain’s Chest", "Fort keep", "Keep door", "Always. The greedy objective."],
          ["L?", "Navy Strongbox", "One of R1 / R2 / keep roof", "Varies", "35% of matches. Announced at 0:30."],
        ]}
      />

      <H2>What comes out</H2>
      <Text size="small" tone="tertiary">
        Independent rolls. Empty is allowed. Weapons never replace the
        cutlass slot — they go in the one primary slot, swapping whatever is
        there.
      </Text>
      <Table
        headers={["Container", "Count", "Weapon", "Rum (heal)", "Ammo", "Trophy", "Empty"]}
        columnAlign={["left", "right", "left", "left", "left", "left", "left"]}
        striped
        rows={[
          [
            "Barrel",
            "16",
            "40% Uncommon",
            "25%",
            "20%",
            "5% junk (sold for coins? no — flavor only in v1)",
            "10%",
          ],
          [
            "Crate",
            "6",
            "50% Uncommon · 30% Rare",
            "10%",
            "5%",
            "5% common trophy",
            "0%",
          ],
          [
            "Lockbox",
            "3",
            "55% Rare · 25% Epic",
            "5%",
            "5%",
            "10% named trophy",
            "0%",
          ],
          [
            "Captain’s Chest",
            "1",
            "70% Epic · 30% Rare",
            "—",
            "—",
            "Always a keep-seal trophy if you extract",
            "0%",
          ],
          [
            "Navy Strongbox",
            "0 or 1",
            "100% Legendary",
            "—",
            "—",
            "Always the Navy seal",
            "0%",
          ],
        ]}
      />

      <Callout tone="warning" title="Expected guns on the island">
        About 6–8 uncommons, 3–5 rares, 1–2 epics, legendary less than half
        the time. Eight players. Most people die with a barrel flintlock.
        That is correct. If everyone has a musket by 3:00, shrink uncommon
        weapon odds, do not add crates.
      </Callout>

      <H3>Body piles</H3>
      <Text>
        On death: primary weapon, unused ammo, rum, and trophies drop in a
        2m scatter. Cutlass does not drop. A player can hold one primary, two
        rum, one trophy. Picking up a second trophy drops the first — so
        greedy stacks become a trail. First to interact (0.4s) takes the
        piece. No auto-loot.
      </Text>
    </Stack>
  );
}

function WeaponTab() {
  return (
    <Stack gap={16}>
      <H2>One sword, one primary</H2>
      <Text tone="secondary">
        Cutlass is glued. Everything else is a swap. Range is a damage curve,
        not a flag. Combat-card art already exists for musket, double-barrel,
        harpoon, cannon, deadeye — use those as HUD icons even if the 3D is
        a gray stick at first.
      </Text>
      <Table
        headers={["Weapon", "Tier", "Best", "Worst", "Notes"]}
        rowTone={[
          "neutral",
          "info",
          "info",
          "warning",
          "warning",
          "success",
          "success",
          "danger",
          "danger",
        ]}
        striped
        rows={[
          [
            "Starter cutlass",
            "Common",
            "0–8m",
            "Piers, market",
            "Always. Lunge. You cannot drop it. The Grog’s king.",
          ],
          [
            "Boarding axe",
            "Uncommon",
            "0–10m",
            "Open pier",
            "Slower than the sword, hits harder. Warehouse interiors.",
          ],
          [
            "Flintlock",
            "Uncommon",
            "8–22m",
            "0–6m and 35m+",
            "Six shots. Default barrel gun. Loses to musket on the pier, loses to sword in the bar.",
          ],
          [
            "Blunderbuss",
            "Rare",
            "0–12m cone",
            "Streets",
            "Three shots. Tavern / armory / cabin. Loud.",
          ],
          [
            "Musket",
            "Rare",
            "25–50m",
            "Interiors",
            "Four shots. Owns both piers and the galleon deck. Pump after each shot.",
          ],
          [
            "Harpoon gun",
            "Epic",
            "10–25m",
            "Tight rooms",
            "Slows / tugs. Makes extract gangplanks terrifying. Card art: Harpoon the Hull.",
          ],
          [
            "Twin barrel",
            "Epic",
            "8–18m",
            "50m+",
            "Two-cap burst. Market Street duels. Card art: Twin Barrel / Double Barrel.",
          ],
          [
            "Deadeye",
            "Legendary",
            "30–60m",
            "The Grog",
            "Announced if someone loots it. Everyone hunts the holder. Card art: DeadEye.",
          ],
          [
            "Carronade",
            "Legendary",
            "15–35m",
            "After you fire",
            "One slow heavy shot, huge tell. Card art: Carronade / Cannon Blast. Do not add both legendaries in one match.",
          ],
        ]}
      />

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Range bands (design, not final numbers)</H3>
          <Table
            headers={["Band", "Where", "King"]}
            rows={[
              ["0–8m", "Tavern, cellar, cabin, armory", "Cutlass / axe / blunderbuss"],
              ["8–20m", "Warehouses, Rope Walk, market stalls", "Flintlock / twin barrel"],
              ["20–50m", "Piers, fort yard, galleon deck", "Musket / Deadeye"],
            ]}
          />
        </Stack>
        <Stack gap={8}>
          <H3>Ammo is the other crate</H3>
          <Text>
            No ammo regen. A musket with zero shots is a slow club. Barrels
            exist so a pier camper has to rotate. If Deadeye is in play,
            barrels near both extracts get a hidden +10% ammo roll so the
            holder cannot starve the map by camping one crate.
          </Text>
        </Stack>
      </Grid>

      <Callout tone="success" title="Legendary rule">
        At most one legendary per match, and only from the Navy Strongbox.
        Deadeye vs Carronade is a coin flip when L? spawns. Never crate-drop
        a legendary as a surprise in a barrel.
      </Callout>
    </Stack>
  );
}

function TimingTab() {
  return (
    <Stack gap={16}>
      <H2>The Navy clock</H2>
      <Table
        headers={["Time", "Map", "Loot", "Extract"]}
        striped
        rows={[
          [
            "0:00",
            "Spawns on the rim. Fort doors unlocked.",
            "All containers live.",
            "Gangplanks up. You can stand on the pier and get shot.",
          ],
          [
            "0:30",
            "—",
            "If L? exists: horn + map ping on cellar / hold / keep roof.",
            "—",
          ],
          [
            "6:00",
            "Outer pier takes stray fire (cosmetic, then real at 8:00).",
            "—",
            "The Gull and The Wren drop gangplanks. 4s channel, cancelled by damage.",
          ],
          [
            "8:00",
            "North/South pier barrels despawn or explode. Warehouses still safe.",
            "No new barrels.",
            "Fort Bell opens (inner keep). Same 4s channel.",
          ],
          [
            "10:00",
            "Ships leave. Anyone not channel-complete is eliminated. Loot despawns.",
            "—",
            "Match over. Extracted load is yours.",
          ],
        ]}
      />
      <Text>
        Early extract is the musket player’s out. Late extract is the
        blunderbuss player’s out — they live in The Grog until 8:00 and run
        the Rope Walk to the bell. If both dock ships are camped, the fort is
        the pressure valve, not a third pier.
      </Text>
      <Divider />
      <H3>v1 build order</H3>
      <Table
        headers={["Slice", "Done when"]}
        rows={[
          [
            "Graybox harbor",
            "8 dummies can run spawn → warehouse → market → fort in under 40s, and pier sightlines are actually long.",
          ],
          [
            "Barrels + crates",
            "IDs spawn as placed. Rolls match the table. Swap-primary works.",
          ],
          [
            "Cutlass + flintlock + musket",
            "Tavern fights feel close. Pier fights feel long. That is the whole game.",
          ],
          [
            "Death scatter",
            "A third player can steal a flintlock off a body in Market Street.",
          ],
          [
            "6:00 / 8:00 / 10:00",
            "Friends scream at the gangplank. Then we add axe, blunderbuss, trophies.",
          ],
        ]}
      />
    </Stack>
  );
}
