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
  Link,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

export default function PirateNationReuse() {
  const theme = useHostTheme();

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>Can you build a simpler pirate farm game from this, cheaply?</H1>
        <Text tone="secondary">
          Yes — if you treat the art as a gift and the Unity/on-chain stack as
          a museum. Proof of Play shut down in August 2026 and released four
          public repos. The cheap product is a new, tiny game loop that uses
          their CC0 voxels and cards. The expensive product is turning Pirate
          Nation back on.
        </Text>
        <Text size="small" tone="tertiary">
          Sources: Proof of Play GitHub (piratenation-game, piratenation-contracts,
          piratenation-art, popbot-tool) and studio shutdown coverage, August 2026.
          Not legal advice.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="Yes" label="Art / logos / IP (CC0)" tone="success" />
        <Stat value="Yes*" label="Code reuse (MIT)" />
        <Stat value="No" label="Flip original game on" tone="danger" />
        <Stat value="$0–5k" label="Fun prototype, no crypto" tone="info" />
      </Grid>

      <Callout tone="success" title="The cheap path">
        Keep the pirate look, throw away the chain, and ship a 10-minute
        onboarding loop: plant, wait, harvest, sell, upgrade. Use the CC0
        voxel assets and combat-card art. Build in Godot, Phaser, or a
        stripped Unity project. Do not revive Apex/Boss, the 300+ contracts,
        or the archival Unity client.
      </Callout>

      <H2>What they actually released</H2>
      <Table
        headers={["Repo", "License", "What you get", "Cheap to use?"]}
        columnAlign={["left", "left", "left", "left"]}
        rowTone={["success", "warning", "warning", "info"]}
        striped
        rows={[
          [
            <Link href="https://github.com/proofofplay/piratenation-art">
              piratenation-art
            </Link>,
            "CC0-1.0",
            "Combat cards, Founder Pirate NFTs, logos, voxel 3D models",
            "Yes. This is the gold.",
          ],
          [
            <Link href="https://github.com/proofofplay/piratenation-game">
              piratenation-game
            </Link>,
            "MIT (PoP code only)",
            "Archival Unity 2022.3.51f1 client. Does not build. No backend.",
            "As reference, yes. As a product, no.",
          ],
          [
            <Link href="https://github.com/proofofplay/piratenation-contracts">
              piratenation-contracts
            </Link>,
            "MIT",
            "On-chain game logic: ships, islands, energy, loot, gacha, marketplace…",
            "As a design doc. Redeploying it is the hard way.",
          ],
          [
            <Link href="https://github.com/proofofplay/popbot-tool">
              popbot-tool
            </Link>,
            "MIT",
            "Internal multi-agent coding cockpit (Claude/Codex + Unity slots)",
            "Useful if you are already building. Not game content.",
          ],
        ]}
      />

      <H2>What to steal vs skip</H2>
      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Reuse</H3>
          <Table
            headers={["Asset", "Why"]}
            rows={[
              [
                "Voxel Game Assets",
                "Characters, ships, islands, creatures. Biggest cost-saver.",
              ],
              [
                "Combat Cards",
                "Readable 2D art for a casual/mobile UI without 3D work.",
              ],
              [
                "Founder Pirate portraits",
                "Hero/NPC faces. CC0; you do not own the original NFTs.",
              ],
              [
                "ARCHITECTURE.md",
                "Currencies and loops (energy, gold, gems, island crafting).",
              ],
              [
                "Island + ship recipes",
                "Inspiration for a much simpler upgrade tree.",
              ],
            ]}
          />
        </Stack>
        <Stack gap={8}>
          <H3>Leave on the shelf</H3>
          <Table
            headers={["Piece", "Why it is expensive"]}
            rows={[
              [
                "Unity client as-is",
                "Paid Asset Store packages stripped; compile errors until you buy or stub them.",
              ],
              [
                "Privy / Infura / Alchemy keys",
                "Their infra is gone. You would stand up a whole new backend.",
              ],
              [
                "Apex / Boss L3s",
                "Decommissioned September 2025. Dead chain = dead game state.",
              ],
              [
                "300+ smart contracts",
                "This is what made shipyards need Discord diagrams.",
              ],
              [
                "$PIRATE / Foundation",
                "Independent org still exists. Do not impersonate it.",
              ],
            ]}
          />
        </Stack>
      </Grid>

      <H2>Licenses, in plain language</H2>
      <Table
        headers={["Question", "Answer"]}
        rows={[
          [
            "Can I ship a commercial game using their art?",
            "Yes. CC0 waives copyright. No attribution required (still polite).",
          ],
          [
            "Can I copy and sell modified MIT code?",
            "Yes, if you keep the Proof of Play copyright notice on the code you keep.",
          ],
          [
            "Does that include Odin, DOTween Pro, Privy, Sentry…?",
            "No. Those were removed because their licenses forbid redistribution.",
          ],
          [
            "Can I call it Pirate Nation?",
            "Copyright is waived; trademark/confusion is separate. The Foundation still supports $PIRATE. Safer to rebrand.",
          ],
          [
            "Can I airdrop to original Founder Pirate holders?",
            "You can use the images. You do not inherit their wallets, NFTs, or community as an official successor.",
          ],
        ]}
      />
      <Text size="small" tone="tertiary">
        CC0 is a copyright waiver, not a lawyer. If you use the name, logos, or
        real-money features commercially, get a short legal review before you
        take payments.
      </Text>

      <H2>Three build paths</H2>
      <Text tone="secondary">
        Ballpark cash outlay only (tools, assets, hosting). Your time is the
        real cost. A solo builder with AI can move the prototype path in weeks;
        the on-chain path is what burned a $33M studio.
      </Text>
      <Table
        headers={["Path", "Cash", "Time", "What you ship"]}
        columnAlign={["left", "right", "left", "left"]}
        rowTone={["success", "info", "danger"]}
        striped
        rows={[
          [
            "Casual prototype",
            "$0–5k",
            "2–8 weeks",
            "Web or Godot island. Plant, harvest, craft a boat. CC0 art. No wallet.",
          ],
          [
            "Polished IAP game",
            "$20–80k",
            "3–6 months",
            "Same loop, nicer UX, energy + gems. Apple/Google IAP. Optional later marketplace.",
          ],
          [
            "Revive on-chain PN",
            "$100k+",
            "9–18 months",
            "New chain or L2, indexer, gasless relay, audits, wallets. Same complexity that died.",
          ],
        ]}
      />

      <Card>
        <CardHeader trailing={<Pill size="sm" active>Recommended</Pill>}>
          Casual prototype — FarmVille loop, pirate skin
        </CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Text>
              Pirate Nation already had the FarmVille pieces: energy that
              regenerates, resource collection, island buildings, ships as
              upgrades, and items you could sell. The product failure was
              getting to that loop. Official ship docs sent players through
              repeating loot-odd quests, then a community Shipwright dashboard,
              then visiting someone else’s island, then burning a second ship.
            </Text>
            <Divider />
            <H3>A 10-minute loop that would have been the game</H3>
            <Table
              headers={["Minute", "Action", "Payoff"]}
              rows={[
                ["0", "Tap to place a pirate on an island plot", "Immediate ownership"],
                ["1", "Send them to a nearby cove", "Wood, canvas, rum start ticking"],
                ["3", "Harvest into a chest on your dock", "Visible inventory, no Discord"],
                ["5", "Tap “Build Sloop” when the bar fills", "One button, not four unique plans"],
                ["8", "Sail the sloop, come back with extra loot", "The boat is the upgrade"],
                ["10", "Sell surplus at the harbor stall", "Gold now; real-money later, maybe never"],
              ]}
            />
          </Stack>
        </CardBody>
      </Card>

      <H2>If you did open the Unity repo anyway</H2>
      <Text tone="secondary">
        The README is explicit: it does not build out of the box. Commercial
        packages were stripped. Approximate Asset Store list prices:
      </Text>
      <Table
        headers={["Missing package", "~USD", "Needed to compile?"]}
        columnAlign={["left", "right", "left"]}
        striped
        rows={[
          ["Sirenix Odin Inspector", "55", "Very likely — attributes are in the code"],
          ["DOTween Pro", "15", "Likely if Pro APIs are called; free DOTween is kept"],
          ["CodeStage Anti-Cheat Toolkit", "~70", "Yes if ObscuredString/Int are used"],
          ["Stylized Water 2", "35", "Visuals, maybe compile"],
          ["Highlight Plus", "~50", "Visuals"],
          ["Epic Toon FX", "~40", "VFX"],
          ["Voxel Importer / EnhancedScroller / ProTips", "~80+", "Pipeline / UI"],
          ["Privy SDK + Sentry", "accounts", "Auth and crash reporting — replace, don’t buy blindly"],
        ]}
      />
      <Text size="small" tone="tertiary">
        Buying the plugins still leaves you without a live backend, GraphQL
        indexer, or chains. Stubbing Odin/ACTk is usually smarter than
        reconstituting the original client.
      </Text>

      <H2>Real-money farming is the expensive part</H2>
      <Grid columns="1.2fr 1fr" gap={16}>
        <Stack gap={8}>
          <Text>
            The original game did let people extract value from in-game items.
            It also attracted farmers and bots, needed two custom chains, and
            collapsed when the token thesis faded. Proof of Play later called
            play-to-earn fundamentally broken. A simpler game can still have
            a marketplace — just not as the onboarding.
          </Text>
          <Text>
            If you later add cash-out, you pick up payments, KYC, bot defense,
            and possibly gambling or securities questions depending on design.
            That is a company, not a weekend prototype.
          </Text>
        </Stack>
        <Card>
          <CardHeader>Keep money behind the fun</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">1. Fun loop with fake gold.</Text>
              <Text size="small">2. Cosmetics / energy IAP if people stay.</Text>
              <Text size="small">3. Player-to-player stall only after retention is real.</Text>
              <Text size="small">4. Chain or cash-out last, if ever.</Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <H2>PopBot’s actual role</H2>
      <Text>
        <Link href="https://github.com/proofofplay/popbot-tool">popbot-tool</Link>{" "}
        is an Electron cockpit for running many Claude Code / Codex agents in
        isolated Unity worktrees. MIT-licensed. It can make a small team faster
        if you are already writing the new game. It does not include Pirate
        Nation content, and the Claude Agent SDK dependency is proprietary, so
        you still pay for model usage.
      </Text>

      <Callout tone="info" title="Practical next step">
        Clone piratenation-art, pick 20 voxel props and 12 cards, and prototype
        the 10-minute loop in Godot or a web canvas. If that feels fun without
        a wallet, you have a game. The original Unity client and contracts are
        there to loot ideas from — not to boot.
      </Callout>

      <Row gap={8} wrap>
        <Link href="https://github.com/proofofplay/piratenation-art">Art (CC0)</Link>
        <Text tone="tertiary">·</Text>
        <Link href="https://github.com/proofofplay/piratenation-game">Unity client</Link>
        <Text tone="tertiary">·</Text>
        <Link href="https://raw.githubusercontent.com/proofofplay/piratenation-game/main/ARCHITECTURE.md">
          Architecture
        </Link>
        <Text tone="tertiary">·</Text>
        <Link href="https://github.com/proofofplay/piratenation-contracts">Contracts</Link>
        <Text tone="tertiary">·</Text>
        <Link href="https://github.com/proofofplay/popbot-tool">PopBot</Link>
      </Row>

      <Text size="small" tone="quaternary" style={{ color: theme.text.quaternary }}>
        Unity Asset Store prices are approximate list prices as of this review
        and change with sales. “Pirate Nation” naming risk is trademark /
        consumer-confusion, not copyright.
      </Text>
    </Stack>
  );
}
