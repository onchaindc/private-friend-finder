# Private Friend Finder

A Solana-based app that discovers mutual friends between users using Arcium-ready private set intersection. No contact lists are uploaded, raw contacts are not logged on-chain, and the demo reveals only masked mutual matches.

Hackathon MVP for private contact discovery on Solana with an Arcium-ready private set intersection flow.

The app lets a user connect a Solana wallet, load contacts locally, find mutual friends with minimal disclosure, and write a compact proof memo on Solana. CSV files never leave the browser in the shipped demo.

## Why This Exists

Traditional friend finder products ask for a full address book upload. That leaks people who never consented and creates a central data liability. Private Friend Finder is structured around private set intersection (PSI): compare two sets and reveal only the overlap.

Arcium is the intended confidential compute layer. Its TypeScript SDK supports encrypting inputs, submitting confidential Solana computations, tracking finalization, and decrypting outputs through `@arcium-hq/client`. This repo includes that SDK and keeps the integration boundary isolated in `lib/arcium/`.

## Current MVP

- Next.js 14 app router frontend.
- TailwindCSS interface designed for a live demo.
- Solana wallet connect through Solana Wallet Adapter.
- Local CSV parsing only, no upload endpoint.
- Deterministic local PSI simulator for demo runs.
- Solana memo transaction that logs only commitments, run id, mode, and match count.
- Arcium adapter and circuit notes ready for a deployed MXE.
- Static demo experience with default Arcium theme, light mode, and dark mode.
- Mutual friend chain visualization with clickable path inspection.
- Invite-code groups with shareable link and QR onboarding flow.
- Verification badges derived from first-proof age in the demo model.
- Ephemeral direct messaging after a mutual match is established.

Note: wagmi and RainbowKit are EVM wallet libraries, so this Solana app uses Solana Wallet Adapter instead.

## Privacy Flow

1. User loads a CSV in the browser.
2. The app normalizes email or phone contacts locally.
3. Contacts are hashed with a domain-separated SHA-256 key.
4. PSI returns only matching hashes.
5. UI shows masked local labels, not full counterparty records.
6. Solana memo logs commitments only:
   - owner set commitment
   - counterparty set commitment
   - result commitment
   - match count
   - run id

For live Arcium, step 4 is replaced by an Arcium MXE computation over encrypted contact hash scalars.

## Quick Start

### No-Install Demo

Open `demo/index.html` directly in a browser. This is the fastest 48-hour demo path:

- Load sample contacts.
- Run private set intersection locally.
- Connect Phantom.
- Log a compact devnet memo proof if the browser can load Solana Web3 from the CDN.
- Explore mutual friend chains, invite-code groups, badges, and session-only chat.

The standalone demo uses the same privacy model as the Next app but avoids any npm install step.

## Feature Notes

### Mutual Friend Chains

The demo generates deterministic relationship paths from each match hash and renders them in an interactive D3 graph. In production, this should be swapped for on-chain graph edges or an Arcium-generated private graph output.

### Invite Codes

Invite codes use the format `MFF_xxx...` and generate a QR plus a shareable join link. The demo stores the active code in browser storage. A production build should derive a PDA from the invite code and store group membership on-chain.

### Verification Badges

Verification status is shown on match cards and profile surfaces. The demo computes this from a synthetic proof age. A production build should fetch the first registration timestamp from chain history and mark badges after 30 days.

### Direct Messaging

Direct messaging is session-only and encrypted in-browser for the demo. Messages are not stored on a server and disappear on refresh. A production build can swap this for wallet-to-wallet encrypted messaging with a lightweight relay or websocket transport.

## Deploy The Demo

The repo includes deployment config for a static launch that serves `demo/index.html`.

### Netlify

1. Create a public GitHub repository and push this project.
2. In Netlify, choose **Add new site** then **Import an existing project**.
3. Select the GitHub repository.
4. Netlify will read `netlify.toml`:
   - publish directory: `demo`
   - build command: empty
5. Deploy. The result will be a `*.netlify.app` URL.

### Vercel

1. Create a public GitHub repository and push this project.
2. In Vercel, choose **Add New Project** and import the repo.
3. Vercel will read `vercel.json`:
   - output directory: `demo`
   - install command: disabled
   - build command: disabled
4. Deploy. The result will be a `*.vercel.app` URL.

### Next.js App

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, click **Load Sample**, run **Find Matches**, then connect a devnet wallet and click **Log Proof**.

## Environment

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

NEXT_PUBLIC_ARCIUM_PROGRAM_ID=
NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET=
NEXT_PUBLIC_ARCIUM_COMPUTATION_NAME=private_friend_intersection
```

## Arcium Integration Plan

The app currently ships with a working in-browser simulator so the demo is usable before the Arcium circuit is deployed. To switch to live Arcium PSI:

1. Implement and deploy the `private_friend_intersection` Arcis/Anchor program.
2. Finalize the computation definition on Arcium.
3. Add the generated Anchor IDL/types to the repo.
4. Replace `submitArciumPsiComputation` in `lib/arcium/client.ts` with the generated program call.
5. Set `NEXT_PUBLIC_ARCIUM_PROGRAM_ID`, `NEXT_PUBLIC_ARCIUM_CLUSTER_OFFSET`, and `NEXT_PUBLIC_ARCIUM_COMPUTATION_NAME`.

Useful official docs:

- Arcium TS SDK quick start: https://ts.arcium.com/docs
- Arcium JS client overview: https://docs.arcium.com/developers/js-client-library
- Invoking confidential computations from Solana programs: https://docs.arcium.com/developers/program

## Repo Structure

```text
app/                    Next.js app router screens and global styles
components/             Wallet and CSV upload UI
lib/contacts.ts         CSV parsing, normalization, masking
lib/privacy.ts          Hashing and commitment helpers
lib/psi.ts              Browser-only PSI simulator
lib/solanaProof.ts      Solana memo proof transaction helper
lib/arcium/             Arcium SDK integration boundary
arcium/                 Circuit notes and starter PSI sketch
```

## Demo Notes

- Use the sample contacts for a predictable two-match demo.
- Use devnet SOL for the proof memo.
- The memo payload intentionally truncates commitments to keep the transaction compact.
- The frontend has no API route for contact ingestion.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```
