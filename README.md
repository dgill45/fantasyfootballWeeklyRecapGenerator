# Fantasy League Weekly Recap Generator

A minimal web app that helps a fantasy football commissioner enter weekly matchup results and generate a shareable, fun recap page.

---

## Folder Structure

```
flwrg/
├── prisma/
│   └── schema.prisma        # Database schema (League, Team, Week, Matchup, Recap)
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with nav bar
│   │   ├── page.tsx                 # Landing page — lists leagues, CTA to create one
│   │   ├── not-found.tsx            # 404 page
│   │   └── league/
│   │       ├── actions.ts           # Server action: createLeague
│   │       ├── new/
│   │       │   ├── page.tsx         # /league/new — form page wrapper
│   │       │   └── NewLeagueForm.tsx  # Client component — dynamic team-name inputs
│   │       └── [leagueId]/
│   │           ├── page.tsx         # /league/[id] — league home with teams & weeks
│   │           └── week/
│   │               ├── actions.ts   # Server action: createWeekWithMatchups
│   │               ├── new/
│   │               │   ├── page.tsx       # /week/new — form page wrapper
│   │               │   └── WeekForm.tsx   # Client component — matchup score inputs
│   │               └── [weekId]/
│   │                   └── page.tsx # /week/[id] — public shareable recap page
│   └── lib/
│       ├── prisma.ts            # Singleton PrismaClient
│       └── generateRecap.ts    # Deterministic recap generation logic
├── .env                         # DATABASE_URL for SQLite
└── package.json
```

---

## How Data Flows Through the App

```
Commissioner fills /league/new form
  → createLeague() server action
    → Prisma creates League + Teams in SQLite
      → Redirect to /league/[leagueId]

Commissioner fills /week/new form
  → createWeekWithMatchups() server action
    → Prisma creates Week + Matchups
    → generateRecap() runs deterministic logic on matchup scores
    → Prisma saves Recap (JSON-encoded fields)
      → Redirect to /week/[weekId]  ← shareable URL

League member opens /week/[weekId]
  → Page fetches Week, Matchups, Recap from SQLite
  → Parses JSON fields back to typed data
  → Renders headlines, storyline, awards, roast, power rankings
```

---

## Running Locally

**Requirements:** Node.js 18+, npm

```bash
# 1. Install dependencies
npm install

# 2. Push schema to create the SQLite database
npm run db:push

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Optional — view the database in a GUI:**
```bash
npm run db:studio
```

---

## Suggested Next 3 Improvements After MVP

### 1. Swap rule-based recap for AI-generated content
Replace `generateRecap.ts` with a call to the Claude API (or OpenAI). The matchup data is already structured — just format it as a prompt. This will make the storyline and roast sections feel much more alive.

### 2. Add edit/delete for weeks and matchups
Right now data is append-only. Commissioners make mistakes. Add simple edit forms and soft-delete so weeks can be corrected without nuking the recap.

### 3. Add a season summary page
After all weeks are entered, aggregate all recaps into a season wrap-up: overall record tables, most blowouts, highest single-week scorer, and playoff seeding. All the data is already in SQLite — it just needs a new page and aggregation queries.
