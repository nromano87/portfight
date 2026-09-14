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
} from "cursor/canvas";

type Tab = "idea" | "table" | "rules" | "skins" | "later";

export default function PortFightTrophies() {
  const [tab, setTab] = useCanvasState<Tab>("portfight.trophies.tab", "idea");

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>PortFight — Trophies</H1>
        <Text tone="secondary">
          Guns die with the match. Trophies get on the ship. Skins are what
          you craft from those trophies — your PFP, your in-match face, the
          only thing the shop ever lists. Trophies are reagents. They do
          not sell.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="1" label="Trophy slot (second drops first)" />
        <Stat value="2–4" label="Extracts per match, typical" />
        <Stat value="0 guns" label="Leave the harbor with power" tone="success" />
        <Stat value="PFP" label="Crafted skins, not trophies, list" tone="info" />
      </Grid>

      <Row gap={8} wrap>
        {(
          [
            ["idea", "What they are"],
            ["table", "The table"],
            ["rules", "Carry and extract"],
            ["skins", "Skins"],
            ["later", "Market, later"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <span key={id}>
            <Pill active={tab === id} onClick={() => setTab(id)}>
              {label}
            </Pill>
          </span>
        ))}
      </Row>

      {tab === "idea" && <Idea />}
      {tab === "table" && <RelicTable />}
      {tab === "rules" && <Rules />}
      {tab === "skins" && <Skins />}
      {tab === "later" && <Later />}
    </Stack>
  );
}

function Idea() {
  return (
    <Stack gap={16}>
      <Callout tone="info" title="Why this before TTK">
        Damage numbers need a graybox. Trophies need a rule before anyone
        writes a crate roll, or the marketplace becomes a gun shop and we
        are back at Pirate Nation’s item treadmill. Spec the prize. Tune
        the flintlock when it exists.
      </Callout>

      <H2>Three kinds, one slot</H2>
      <Grid columns={3} gap={12}>
        <Card>
          <CardHeader>Junk</CardHeader>
          <CardBody>
            <Text>
              Bent doubloons, salty rope. Barrel flavor. You can extract
              with one if you grabbed nothing else. Never lists. v1 shows
              them in stash as “harbor trash.” They exist so empty-handed
              extracts still feel like you brought something.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Relics</CardHeader>
          <CardBody>
            <Text>
              Named objects tied to Pirate Nation lore characters already
              in the CC0 dump. Spyglass, locket, tankard. Come from crates
              and lockboxes. This is the collection. Crafted into skins —
              they do not list on their own.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Seals</CardHeader>
          <CardBody>
            <Text>
              Match objectives. Keep Seal always sits in E1. Navy Seal only
              from the pinged Strongbox. Loud, glowing, everyone can see
              you holding one. Hunt the carrier. These are the Hunt
              bounties.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Text>
        A trophy is never a better cutlass. In-match it glints on your
        back so other pirates know you are worth third-partying. After
        extract it sits on the shelf until you sink it into a skin.
      </Text>

      <H3>Feel targets for combat (not a damage bible)</H3>
      <Text tone="secondary">
        Enough to graybox. If these are wrong, change HP, not the map.
      </Text>
      <Table
        headers={["Fight", "Intended feel", "If it is wrong"]}
        striped
        rows={[
          [
            "Cutlass vs cutlass, The Grog",
            "3–4 swings to kill. Lunge wins space. Both can run.",
            "If 1-shot, tavern is a coin flip. Raise HP.",
          ],
          [
            "Flintlock at 12m, warehouse",
            "3 hits to kill. 6 in the gun. You may reload from a barrel or die.",
            "If 1-shot, nobody enters interiors.",
          ],
          [
            "Musket on North Wharf",
            "2 hits to kill at 30m+. Pump between shots. Loses a 1v1 in the bar.",
            "If 1-shot, piers are unplayable. If 4-shot, musket is a flintlock.",
          ],
          [
            "Blunderbuss in a doorway",
            "1 pellet cluster kills inside 8m, does almost nothing at 20m.",
            "If it reaches the pier, delete it.",
          ],
        ]}
      />
    </Stack>
  );
}

function RelicTable() {
  return (
    <Stack gap={16}>
      <H2>Named relics</H2>
      <Text tone="secondary">
        Names from piratenation-art lore characters. Use their voxel busts
        or combat-card stills as the inspect view. Rolls are “among relics
        of this tier,” not a unique-per-match guarantee — duplicates are
        fine in v1. Seals are unique per match.
      </Text>
      <Table
        headers={["Item", "Kind", "Tier", "Source", "Look"]}
        rowTone={[
          "neutral",
          "neutral",
          "info",
          "info",
          "info",
          "info",
          "warning",
          "warning",
          "warning",
          "success",
          "danger",
        ]}
        striped
        rows={[
          [
            "Bent doubloon / salty rope / cracked bottle",
            "Junk",
            "Trash",
            "Barrel 5%",
            "Pocket lint. No glow.",
          ],
          [
            "Banana Bill’s peel",
            "Relic",
            "Uncommon",
            "Crate relic roll",
            "Joke. Still a relic. People will chase it anyway.",
          ],
          [
            "Trader’s scale",
            "Relic",
            "Uncommon",
            "Crate relic roll",
            "Resource Trader bust.",
          ],
          [
            "Heitzman’s ledger",
            "Relic",
            "Uncommon",
            "Crate relic roll",
            "A book. Quiet.",
          ],
          [
            "Chompington’s tankard",
            "Relic",
            "Uncommon",
            "Crate / tavern U5 weighted +10%",
            "Belongs in The Grog. Extra roll weight on U5.",
          ],
          [
            "High Tide’s compass",
            "Relic",
            "Rare",
            "Lockbox relic roll",
            "Captain High Tide.",
          ],
          [
            "Banshee’s locket",
            "Relic",
            "Rare",
            "Lockbox relic roll",
            "Captain Banshee.",
          ],
          [
            "Rustbeard’s hook",
            "Relic",
            "Rare",
            "Lockbox relic roll",
            "Ugly, obvious on the back.",
          ],
          [
            "Ironsides’ spyglass",
            "Relic",
            "Rare",
            "Lockbox, +10% on galleon R2",
            "Admiral Ironsides. Looks right on the ship.",
          ],
          [
            "Keep Seal",
            "Seal",
            "Epic",
            "Always in E1 with the chest",
            "Gold disc. Glow. Everyone sees it.",
          ],
          [
            "Navy Seal",
            "Seal",
            "Legendary",
            "Navy Strongbox only",
            "Horn at 0:30. Map ping. The match’s TV.",
          ],
        ]}
      />

      <H3>How often relics appear</H3>
      <Table
        headers={["Container", "Trophy chance", "What you usually get"]}
        rows={[
          ["Barrel (16)", "5% junk", "Almost never a named relic."],
          ["Crate (6)", "5% uncommon relic", "Maybe one named relic on the whole island."],
          ["Lockbox (3)", "10% rare relic", "Often zero, sometimes one. Do not raise this."],
          ["Captain’s Chest", "Keep Seal, always", "The reason to go east."],
          ["Navy Strongbox", "Navy Seal, always, 35% of matches", "The reason to third-party."],
        ]}
      />
      <Callout tone="warning" title="Starvation is the point">
        Most matches, two or three people extract with junk or nothing
        named, and one person has a seal. If crates start spitting relics,
        the shelf and the future market both die. Keep the 5% / 10%.
      </Callout>
    </Stack>
  );
}

function Rules() {
  return (
    <Stack gap={16}>
      <H2>The slot</H2>
      <Table
        headers={["Rule", "Detail"]}
        striped
        rows={[
          ["One slot", "Primary gun is separate. Trophy is a back-slot. HUD pip."],
          [
            "Pick up",
            "0.4s interact, same as guns. Seal interact is 0.8s so you can be shot off it.",
          ],
          [
            "Second trophy",
            "The one in the slot drops at your feet. Greedy trails are intentional.",
          ],
          [
            "Visibility",
            "Junk: nothing. Relic: small glint. Seal: obvious glow + silhouette object.",
          ],
          [
            "Death",
            "Trophy scatters with the gun. Cutlass stays gone. First hand on it owns it.",
          ],
          [
            "Extract",
            "Slot goes to stash. Guns stay. A successful extract unlocks the next island and puts you there. You can still pick any unlocked island.",
          ],
          [
            "Die on the gangplank",
            "Channel cancelled, loot on the pier. The ship does not catch a corpse’s seal.",
          ],
          [
            "Kills",
            "Do not upgrade trophy rarity. A “bloodied” inspect line is fine. Value is not.",
          ],
        ]}
      />

      <H3>Stash</H3>
      <Text>
        After the match: a shelf of reagents. Equip nothing from here
        except while deciding a recipe. Your face is a skin, on the Skins
        tab. First play still free; first-match luck is 1–2 unsellable
        play coins, never a free relic and never a free crafted PFP.
      </Text>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>First-match luck, revised</CardHeader>
          <CardBody>
            <Text>
              Keep 1–2 unsellable play coins after the first extract (or
              after the first death, so a wipe still teaches). Do not also
              seed a relic. If the tutorial hands you Ironsides’ spyglass,
              the table means nothing.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>NFT attach, later</CardHeader>
          <CardBody>
            <Text>
              Founder Pirate as an optional PFP / lobby body if you attach
              the token. Not a recipe ingredient, not a crate key, not a
              seal. Check the token, not the CC0 picture.
            </Text>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function Skins() {
  return (
    <Stack gap={16}>
      <Callout tone="success" title="This is the right sink">
        Trophies sitting on a shelf are a stamp collection. Consuming them
        into a PFP gives the 10 minutes a reason, gives junk a job, and
        gives the shop something to sell that is not a musket. Do it.
        Guard the recipes so barrel trash cannot print legendary faces.
      </Callout>

      <H2>What a skin is</H2>
      <Text>
        One finished Pirate Nation pirate skin — Sir Clankalot, Stargazer,
        Barrel, Anubis — not a hat SKU. That square is your lobby face,
        kill-feed picture, and shareable PFP. In the match it tints you
        and sits on your chest so the 3D reads as the portrait.
      </Text>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>Everyone owns Dockhand</CardHeader>
          <CardBody>
            <Text>
              Soulbound default PFP after first play. Plain silhouette.
              Cannot list. You can sell every crafted skin and still look
              like a dockhand. That is on-theme.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Crafted skins list</CardHeader>
          <CardBody>
            <Text>
              Output of a recipe is a tradeable skin. Equip one at a time.
              Selling the one you are wearing reverts you to Dockhand (or
              the next skin you pick). House never sells these.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>Five islands, named recipes</H2>
      <Text tone="secondary">
        Extracting from island N unlocks N+1 and sails you there. Each
        island has its own map. You can still pick any unlocked island to
        farm. An island drops its own items plus every earlier island’s
        table. Blackwater is the only source of Iron Sights, Iron Cannon, and
        Iron Armor — the last pieces for Skeleton Limited, Ghost Limited,
        and Black Knight Spirit.
      </Text>
      <Table
        headers={["Island", "First drops here", "Skins that need this island"]}
        rowTone={["info", "info", "warning", "success", "danger"]}
        striped
        rows={[
          [
            "1 Gull Harbor",
            "Wood, Cotton, Flax, Wooden Oar, Cotton Net",
            "Barrel, Cat Pajama, Hot Dog, Scarecrow",
          ],
          [
            "2 Wren Reach",
            "Iron Ore, Hemp Rope, Spyglass",
            "Sir Clankalot, Stargazer, Skeleton, Samurai, Deep Diver, Ice Queen",
          ],
          [
            "3 Copper Cay",
            "Copper Ore, Iron Anchor, Compass",
            "Squidly, Anubis",
          ],
          [
            "4 Oak Atoll",
            "Oak Wood, Mermaid Scale, Cotton Sail, Wooden Helm",
            "Anubis Gold",
          ],
          [
            "5 Blackwater",
            "Iron Sights, Iron Cannon, Iron Armor",
            "Skeleton Limited, Ghost Limited, Black Knight Spirit",
          ],
        ]}
      />
      <Table
        headers={["Skin", "Tier", "Consume"]}
        rowTone={["info", "info", "info", "info", "warning", "warning", "warning", "warning", "warning", "warning", "success", "success", "success", "danger", "danger", "danger"]}
        striped
        rows={[
          ["Barrel", "Uncommon", "Wooden Oar"],
          ["Cat Pajama", "Uncommon", "Cotton Net"],
          ["Hot Dog", "Uncommon", "Cotton"],
          ["Scarecrow", "Uncommon", "Wood"],
          ["Sir Clankalot", "Rare", "Spyglass + Wood"],
          ["Stargazer", "Rare", "Hemp Rope + Cotton"],
          ["Skeleton", "Rare", "Iron Ore + Flax"],
          ["Samurai", "Rare", "Spyglass + Wooden Oar"],
          ["Deep Diver", "Rare", "Hemp Rope + Cotton Net"],
          ["Ice Queen", "Rare", "Iron Ore + Wooden Oar"],
          ["Squidly", "Epic", "Compass + Hemp Rope"],
          ["Anubis", "Legendary", "Iron Anchor + Spyglass"],
          ["Anubis Gold", "Legendary", "Mermaid Scale + Wooden Helm"],
          ["Skeleton Limited", "Legendary", "Iron Sights + Compass"],
          ["Ghost Limited", "Legendary", "Iron Cannon + Mermaid Scale"],
          ["Black Knight Spirit", "Legendary", "Iron Armor + Cotton Sail + Spyglass"],
        ]}
      />

      <Callout tone="warning" title="What we will not do">
        Five junk cannot make a captain. The house cannot sell Clankalot.
        Reagents and ship parts cannot list — only the skin they become. Founder
        Pirate NFTs are an optional lobby body, not a recipe ingredient,
        or you have just gated cosmetics behind a wallet.
      </Callout>

      <H3>Shop split</H3>
      <Table
        headers={["Place", "Sells", "Does not sell"]}
        rows={[
          [
            "Official counter",
            "Play coins at a fixed $0.75 = 3 plays. Maybe a mug / emote later.",
            "Crafted PFPs. Relics. Guns.",
          ],
          [
            "Player shop",
            "Crafted skins, after an age gate and N extracts.",
            "Play coins. Trophies. Accounts.",
          ],
        ]}
      />
      <Text>
        Rake 10–15% on player listings. KYC on cash-out. New accounts
        cannot list. Inspect on a Navy Commission must show the match
        stamp so buyers know it is not a colorway.
      </Text>
    </Stack>
  );
}

function Later() {
  return (
    <Stack gap={16}>
      <H2>When money exists</H2>
      <Text tone="secondary">
        Do not build this until the 10 minutes is fun with a shelf. The
        rules below are so v1 data still works when you turn the shop on.
      </Text>
      <Table
        headers={["Can list", "Cannot list", "Why"]}
        rowTone={["success", "danger", "danger", "warning"]}
        rows={[
          [
            "Crafted skins",
            "Play coins, guns, rum, accounts, raw trophies",
            "Tickets stay tickets. Power stays in-run. Trophies are fuel.",
          ],
          [
            "After N extracts and an age gate",
            "Brand-new accounts",
            "Faucet protection. KYC on cash-out, not on play.",
          ],
          [
            "House rake 10–15% on skins",
            "House-sold Named Captains / Commissions",
            "If the counter sells Ironsides, nobody runs the galleon.",
          ],
          [
            "Gull Harbor skins (cheap)",
            "Barrel junk as a listing",
            "One island-1 item → a costume is the sink. Wood itself never lists.",
          ],
        ]}
      />
      <Text>
        Supply: most matches still produce almost no named relics. Gull
        Harbor skins will be cheap. Black Knight Spirit stays the listing
        you actually want — Iron Armor only drops on Blackwater, plus a
        Cotton Sail from Oak Atoll and a Spyglass from Wren Reach on.
      </Text>
      <Divider />
      <H3>What we still do not spec</H3>
      <Text>
        Exact HP, fire rate, and pellet counts wait for a graybox of The
        Grog vs North Wharf. Next build step is that graybox plus the
        trophy slot and a Dockhand PFP — not Stripe, not a marketplace.
      </Text>
    </Stack>
  );
}
