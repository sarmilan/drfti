# drfti — Claude Context

## What This App Is
Language-learning web app for tourist conversation practice. Users pick a language, pick a scenario (e.g. ramen shop), then walk through a branching dialogue tree — choosing their responses, hearing the correct Japanese, and completing the scene. Think of it as an interactive phrasebook with choices.

**Domain:** drfti.com (DNS on Cloudflare)
**Current phase:** Sprint 1 complete (ramen shop, no real audio, no auth)

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15.5.2 (App Router) | Pinned to 15.5.2 — CF adapter requires ≤15.5.2 |
| Language | TypeScript | Strict |
| Styling | Tailwind CSS v4 | Config via CSS custom props in globals.css, NOT tailwind.config.ts |
| Animation | Framer Motion | Used on all 4 screens |
| Icons | lucide-react | |
| UI primitives | shadcn/ui | Tailwind v4 compatible version |
| Fonts | Geist Sans, Noto Sans JP | Noto applied to all .ja fields |
| Deployment | Cloudflare Pages | Auto-deploy on push to main |
| CF adapter | @cloudflare/next-on-pages@1.13.16 | |
| Local secrets | .dev.vars | gitignored |

**Key constraint:** Next.js must stay pinned at `15.5.2` until `@cloudflare/next-on-pages` updates its peer dep ceiling.

---

## Project Structure

```
drfti/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← fonts (Geist + Noto Sans JP), metadata, favicon
│   │   ├── globals.css             ← Tailwind v4 theme: brand colors, dark bg
│   │   ├── page.tsx                ← Language select (/, client component)
│   │   └── ja/
│   │       ├── page.tsx            ← Scenario select (/ja)
│   │       └── [scenario]/
│   │           ├── page.tsx        ← Scene intro — runtime='edge'
│   │           └── play/
│   │               └── page.tsx    ← Conversation screen — runtime='edge'
│   ├── components/
│   │   ├── ui/                     ← shadcn: button, card, badge, sonner, sheet
│   │   └── layout/
│   │       └── PageTransition.tsx  ← Framer Motion fade+slide wrapper
│   ├── data/
│   │   ├── types.ts                ← DialogueNode, Scenario, Speaker types
│   │   ├── index.ts                ← getScenario(), getScenariosByLanguage()
│   │   └── scenarios/
│   │       └── ramen-shop.json     ← 58 nodes, root: enter_1, end: leave_staff_1
│   └── lib/
│       ├── utils.ts                ← cn(), formatDuration(), getJourneyStats()
│       └── audio.ts               ← getAudioPath() stub, preloadAudio() stub
├── public/
│   └── audio/ja/                  ← empty — mp3s added Sprint 2
├── wrangler.toml                   ← CF Pages config, nodejs_compat flag
├── .dev.vars                       ← local secrets (gitignored)
└── next.config.ts                  ← turbopack.root set to suppress lockfile warning
```

---

## Data Model

```typescript
// A dialogue node is either staff (with options[]) or customer (with next)
interface DialogueNode {
  id: string;
  speaker: 'staff' | 'customer';
  ja: string;           // Japanese text
  romaji: string;       // Romanization
  en: string;           // English translation
  audio_key: string;    // maps to /audio/{lang}/{audio_key}.mp3
  cultural_note?: string;
  options?: string[];   // staff nodes: array of customer node IDs player can pick
  next?: string | null; // customer nodes: next node ID, null = scene over
}
```

**Conversation logic:** staff node → player picks one of `options[]` (each a customer node) → customer node auto-advances via `next` → repeat until `next === null`.

---

## Brand / Design Tokens

```
Brand red:    #E94560   (hover: #d63a52)
Background:   #0A0A0F
Card:         #12121A
Elevated:     #1A1A28
Muted text:   #6B7280
Light muted:  #9CA3AF
Border:       rgba(255,255,255,0.08)
```

Tailwind usage: `text-brand`, `bg-brand`, `bg-bg-card`, `bg-bg-elevated` (defined as CSS custom props in globals.css `@theme inline` block).

---

## Key Patterns

**Edge runtime:** Dynamic routes (`/ja/[scenario]`, `/ja/[scenario]/play`) need `export const runtime = 'edge'` at the top — required by Cloudflare Pages adapter.

**Tailwind v4:** Custom colors go in `globals.css` as `--color-brand: #E94560` inside `@theme inline {}`. There is no `tailwind.config.ts`.

**Data import:** `data/index.ts` uses `require()` for the JSON (not `import`) to avoid TS module resolution issues with JSON files.

**localStorage schema:**
```typescript
// key: 'drfti_journeys'
Array<{ scenario_id: string; path: string[]; saved_at: string }>
```

**Audio:** Fully stubbed in Sprint 1. `getAudioPath(key, lang)` returns `/audio/{lang}/{key}.mp3`. No files exist yet.

---

## Build Commands

```bash
npm run dev          # local dev (Turbopack, fast HMR)
npm run build        # standard Next.js build (use to check TS errors)
npm run build:cf     # Cloudflare Pages build (slower, run before deploy)
npm run preview:cf   # local CF preview
npm run lint         # ESLint
npx tsc --noEmit     # type-check without building
```

**Deploy:** push to `main` → Cloudflare auto-deploys.

---

## Cloudflare Pages Config

| Field | Value |
|---|---|
| Build command | `npx @cloudflare/next-on-pages` |
| Output directory | `.vercel/output/static` |
| NODE_VERSION env var | `18` |

---

## Sprint Status

- **Sprint 1 ✓** — 4 screens, ramen-shop.json wired, CF Pages ready, dark theme, animations
- **Sprint 2** — Real audio (ElevenLabs batch), waveform (wavesurfer.js), PWA manifest
- **Phase 2** — Supabase auth, journey sync across devices, French scenarios
- **Phase 3** — Anthropic API features, Cloudflare Workers, R2 for audio storage

---

## Scenarios

Currently active: `ramen-shop` only.
Stubs shown (coming soon): convenience-store, cafe, shoe-store.
French language: blocked at language select screen.

---

## Workflow Orchestration

### 1. Plan
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
