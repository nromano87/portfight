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

type Tab = "pitch" | "loop" | "economy" | "mvp";

export default function PortFightVision() {
  const [tab, setTab] = useCanvasState<Tab>("portfight.tab", "pitch");

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>PortFight</H1>
        <Text tone="secondary">
          A 10-minute pirate extraction brawl in the browser. First play free.
          See other people. Fight or run. Loot hits the dock. Sell what you
          get out with. No chain. Optional Pirate Nation NFT as a skin, later.
        </Text>
        <Text size="small" tone="tertiary">
          Working name. Not legal advice. Economy numbers below are design
          recommendations, not a promise the original math is stable.
        </Text>
      </Stack>

      <Row gap={8} wrap>
        {(
          [
            ["pitch", "The pitch"],
            ["loop", "10-minute loop"],
            ["economy", "Coins and cash"],
            ["mvp", "Cheap MVP"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <span key={id}>
            <Pill active={tab === id} onClick={() => setTab(id)}>
              {label}
            </Pill>
          </span>
        ))}
      </Row>

      {tab === "pitch" && <Pitch />}
      {tab === "loop" && <Loop />}
      {tab === "economy" && <Economy />}
      {tab === "mvp" && <Mvp />}
    </Stack>
  );
}

function Pitch() {
  return (
    <Stack gap={16}>
      <Grid columns={4} gap={12}>
        <Stat value="~10m" label="One match" />
        <Stat value="$0.25" label="Replay (or 1 coin / 3 plays)" />
        <Stat value="8–16" label="Pirates in a port" />
        <Stat value="CC0" label="Pirate Nation voxels" tone="success" />
      </Grid>

      <Callout tone="info" title="Name the genre correctly">
        This is not Slay the Spire. It is Hunt: Showdown + Fortnite loot,
        shrunk to a harbor and a kitchen timer. Die and your stuff is on the
        planks. That is an extraction arena. Call it that in the UI so
        players know death is expensive.
      </Callout>

      <H2>What is already strong</H2>
      <Table
        headers={["Choice", "Why it works"]}
        striped
        rows={[
          [
            "Ten minutes, browser",
            "The whole complaint about Pirate Nation was getting to the fun. This is the fun.",
          ],
          [
            "First play free",
            "You learn the gun-feel and the greed before you pay a quarter.",
          ],
          [
            "See people, fight or run",
            "Readable PvP. No Discord flowchart. Range vs melee is a real decision.",
          ],
          [
            "Starter sword only",
            "You are never empty-handed. Everything else is a story you earned this run.",
          ],
          [
            "Body loot on the dock",
            "The best spectator sport in the genre. Also the start of every argument.",
          ],
          [
            "No crypto, optional NFT attach",
            "Uses the CC0 portraits as a cosmetic/benefit later without wallets in onboarding.",
          ],
        ]}
      />

      <H2>Two forks to decide before you write code</H2>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader trailing={<Pill size="sm" active>Recommend</Pill>}>
            Run gear vs stash
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                Weapons you pick up are for this match. What you sell is what
                you extract: trophies, cosmetics, named loot. That keeps the
                run feeling like a roguelike and the marketplace from becoming
                pay-to-win loadouts.
              </Text>
              <Text size="small" tone="secondary">
                Alternate: persistent guns in a stash (Tarkov). Higher stakes,
                more bots, more support mail.
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill size="sm" active>Recommend</Pill>}>
            Coins are tickets, not cash
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                Play coins buy plays. They never list on the cash marketplace.
                Items do. Then the secret first-round 1–5 coins is a generous
                tutorial, not a money faucet.
              </Text>
              <Text size="small" tone="secondary">
                If coins sell for dollars, kill farming and first-run dumping
                become the game.
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function Loop() {
  return (
    <Stack gap={16}>
      <H2>The Navy arrives in ten minutes</H2>
      <Text tone="secondary">
        A circle is abstract. A harbor under cannon fire is a story, and you
        already have ships. When the timer hits zero, the docks are gone.
        You leave on a boat with what you are carrying, or you are loot.
      </Text>

      <Table
        headers={["Time", "What happens", "Player feeling"]}
        striped
        rows={[
          ["0:00", "Drop on the pier with a common sword. Chests in warehouses, tavern, fort.", "Free, obvious, armed."],
          ["0:30", "First gunshot. You see silhouettes. Fight or cut down an alley.", "Fortnite brain, pirate map."],
          ["2:00", "Uncommon / rare weapons from crates. Long guns win streets; cutlasses win taverns.", "Loadout is a place, not a shop."],
          ["5:00", "First death. Sword, coins, and a rare pistol spray on the planks.", "Greed vs third-parties."],
          ["8:00", "Navy smoke on the horizon. Extract ships start boarding at two docks.", "Leave rich or stay greedy."],
          ["10:00", "Docks close. Anyone still in the fort is scored. Dead loot despawns.", "Match over. Marketplace later."],
        ]}
      />

      <H3>Combat, cheap Fortnite</H3>
      <Text>
        Do not build a browser Fortnite. Build a 3/4 or top-down port where
        distance is obvious. Hitscan or fast projectiles. Damage falls off
        with the wrong range. Melee has windup and a lunge. No building.
        8–16 players on one small map is enough to see people without a battle
        bus.
      </Text>
      <Table
        headers={["Tier", "Example", "Where it wins"]}
        rows={[
          ["Common", "Starter cutlass", "Always. Never dropped as the only option."],
          ["Uncommon", "Flintlock, boarding axe", "Alleys, interiors, panic fights."],
          ["Rare", "Musket, blunderbuss", "Streets vs doorways — opposite strengths."],
          ["Epic", "Named captain’s pistol", "Run-defining. Maybe extract-only as a trophy."],
          ["Legendary", "One per match, announced", "Everyone hunts the holder. Good TV."],
        ]}
      />

      <Callout tone="warning" title="Win condition has to be on screen">
        If “sell items for cash” is the only win, campers sit on bodies. Put
        extract on the HUD: get to a marked ship with loot, or last pirates
        in the inner fort. Kills are a means. Leaving is the score.
      </Callout>
    </Stack>
  );
}

function Economy() {
  return (
    <Stack gap={16}>
      <H2>Your numbers, then the patched version</H2>
      <Text tone="secondary">
        $0.25 a play and a three-play coin is a good casual price. The kill
        bounty and “0 to infinite” later coins are where the game gets eaten
        by bots.
      </Text>

      <Table
        headers={["Rule", "As written", "Problem", "Patch"]}
        columnAlign={["left", "left", "left", "left"]}
        rowTone={["info", "danger", "danger", "warning", "success"]}
        striped
        rows={[
          [
            "First play",
            "Free",
            "None",
            "Keep. Always.",
          ],
          [
            "Replay",
            "$0.25 or 1 play coin = 3 plays",
            "Coin vs quarter needs a fixed rate so the market cannot arbitrage tickets.",
            "1 coin = 3 plays. $0.75 buys 1 coin in the official shop. Marketplace does not list coins.",
          ],
          [
            "First round coins",
            "Secretly 1–5, then 0–infinite",
            "If coins are cash, this is a faucet. Infinite has no ceiling for farmers.",
            "First run: 1–2 unsellable coins, shown as “harbor luck” after extract. Later: rare 0–1, only if you extract. Hard cap per day.",
          ],
          [
            "Kill reward",
            "3 play coins",
            "3 coins = 9 plays ≈ $2.25 at $0.25/play. Spawn-kill meta. Bots.",
            "Killer gets the scatter loot, not tickets. Optional: +1 coin only if you extract after the kill.",
          ],
          [
            "Cash market",
            "Earned items sell for cash",
            "RNG rarity + buy-in + cash-out looks like a loot box in many places.",
            "Sell extracted cosmetics / trophies / named items. Power stays in-run. You take a rake.",
          ],
        ]}
      />

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>Healthy loop</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">Pay a quarter or spend a ticket.</Text>
              <Text size="small">Play 10 minutes. Extract or die.</Text>
              <Text size="small">Tickets refill a little if you extract.</Text>
              <Text size="small">Trophies list on the market for real money.</Text>
              <Text size="small">House takes 10–15%. No coin listings.</Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>What will happen if you do not patch</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">Accounts play the free match, dump 1–5 coins, sell them.</Text>
              <Text size="small">Kill squads farm 3 coins per body.</Text>
              <Text size="small">New players never pick up loot; they get third-partied.</Text>
              <Text size="small">Weapon rarity becomes the slot machine.</Text>
              <Text size="small">You spend the year on chargebacks and bots.</Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="warning" title="Real-money PvP is a legal design, not a feature flag">
        Paying to play and winning cash via item rarity is the shape of
        gambling law in a lot of places. Safer shapes: skill-based pots
        (entry fees, published rake, winners paid), or cosmetics-only
        trading with no randomized cash items. Get a lawyer before the
        first dollar of payout. Age-gate. KYC on cash-out. Freeze new
        accounts from listing.
      </Callout>

      <H3>Pirate Nation NFT</H3>
      <Text>
        Attach after the first match, never before. Benefit should not buy
        wins: portrait as your pirate, a title, a dock flag, maybe one extra
        free play per week. If Founder Pirates are CC0, anyone can use the
        art — so the benefit has to check the actual token, not the picture.
        That is the only crypto in the product, and it stays off the first
        screen.
      </Text>
    </Stack>
  );
}

function Mvp() {
  return (
    <Stack gap={16}>
      <H2>Cheap enough to actually ship</H2>
      <Text tone="secondary">
        Browser Fortnite is a studio. A top-down port with 8 people, Pirate
        Nation voxels as billboards or chunky 3D, and a single warehouse map
        is a small team with agents. That is the point of the CC0 drop.
      </Text>

      <Table
        headers={["Slice", "Ship it", "Do not build yet"]}
        rowTone={["success", "success", "success", "warning", "danger"]}
        striped
        rows={[
          [
            "Client",
            "Browser, 3/4 view, one map: docks + tavern + fort",
            "Building, vehicles, storm building, mobile native",
          ],
          [
            "Netcode",
            "8 players, 10-minute room, server-authoritative hits",
            "128-player BR, replays, anti-cheat beyond basics",
          ],
          [
            "Loadout",
            "Sword + 4 gun tiers from crates",
            "Crafting trees, shipyards, skill trees",
          ],
          [
            "Progression",
            "Extract = keep trophies. Die = scatter this run.",
            "Persistent stash of meta weapons",
          ],
          [
            "Money",
            "Stripe $0.25 plays. Ticket inventory. No cash-out in v1.",
            "Open marketplace, coin trading, NFT gating of power",
          ],
        ]}
      />

      <Divider />
      <H3>v1 does not cash people out</H3>
      <Text>
        First playable: free match, paid replay, scatter loot, extract,
        trophy collection that looks sellable. Marketplace and NFT attach
        are v2 after you see whether people third-party bodies for fun or
        for profit. If the 10 minutes is not fun with fake gold, real gold
        will not save it — that was Pirate Nation’s lesson.
      </Text>

      <Callout tone="success" title="Next build, if you want it">
        One dock map, 8 dummy players or friends, starter sword, two
        weapons, body loot, a 10-minute navy timer, extract flag. Art from
        piratenation-art voxels. No payments. That answers whether PortFight
        is a game.
      </Callout>
    </Stack>
  );
}
