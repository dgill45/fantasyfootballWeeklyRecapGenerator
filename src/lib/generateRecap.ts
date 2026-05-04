/**
 * Recap generation — powered by Claude API.
 *
 * The AI generates the narrative content (title, headlines, matchup recaps,
 * weekly callouts). Power rankings are always computed deterministically from
 * win/loss records so they're always accurate.
 *
 * If the Claude API fails, returns malformed JSON, or returns an unexpected
 * structure, the function falls back to a simple deterministic recap so the
 * week is always saved successfully.
 */

import Anthropic from "@anthropic-ai/sdk";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchupData = {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
};

export type PowerRankingEntry = {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  totalPoints: number;
};

export type RecapContent = {
  title: string;
  headlines: string[];
  matchupRecaps: string[]; // one paragraph per matchup, in input order
  callouts: {
    biggestWin: string;
    worstLoss: string;
    teamInTrouble: string;
    teamToWatch: string;
  };
  powerRankings: PowerRankingEntry[];
};

// Prior week records for all teams in the league (from all previous weeks)
export type TeamRecord = {
  teamName: string;
  wins: number;
  losses: number;
  totalPoints: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  // Strip markdown code fences if Claude wraps output in them
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

function buildStorylines(records: TeamRecord[]): string {
  if (records.length === 0) return "First week of the season — no prior storylines.";

  const sorted = [...records].sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints);
  const lines: string[] = [];

  const leader = sorted[0];
  if (leader.wins > 0) {
    lines.push(`${leader.teamName} leads the league at ${leader.wins}-${leader.losses}`);
  }

  const cellar = sorted[sorted.length - 1];
  if (cellar.losses > 1 && cellar !== leader) {
    lines.push(`${cellar.teamName} is struggling at ${cellar.wins}-${cellar.losses}`);
  }

  for (const r of records) {
    const played = r.wins + r.losses;
    if (played >= 3 && r.wins === played) {
      lines.push(`${r.teamName} is undefeated on the season`);
    } else if (played >= 3 && r.losses === played) {
      lines.push(`${r.teamName} has yet to win a game this season`);
    }
  }

  return lines.length > 0 ? lines.join("; ") : "Season is early — no major storylines yet.";
}

/**
 * Simple deterministic fallback recap used when the Claude API is unavailable
 * or returns an unusable response. Rule-based but readable.
 */
function generateFallbackRecap(
  weekNumber: number,
  matchups: MatchupData[],
  powerRankings: PowerRankingEntry[]
): RecapContent {
  // Biggest margin win
  const byMargin = [...matchups].sort(
    (a, b) => Math.abs(b.scoreA - b.scoreB) - Math.abs(a.scoreA - a.scoreB)
  );
  const biggest = byMargin[0];
  const biggestWinner = biggest.scoreA > biggest.scoreB ? biggest.teamA : biggest.teamB;
  const biggestLoser = biggest.scoreA > biggest.scoreB ? biggest.teamB : biggest.teamA;
  const biggestMargin = Math.abs(biggest.scoreA - biggest.scoreB).toFixed(2);

  // Worst loss — team with the lowest losing score
  const worstLoserMatchup = [...matchups].sort(
    (a, b) => Math.min(a.scoreA, a.scoreB) - Math.min(b.scoreA, b.scoreB)
  )[0];
  const worstLoser =
    worstLoserMatchup.scoreA < worstLoserMatchup.scoreB
      ? worstLoserMatchup.teamA
      : worstLoserMatchup.teamB;
  const worstScore = Math.min(worstLoserMatchup.scoreA, worstLoserMatchup.scoreB).toFixed(2);

  const leader = powerRankings[0];
  const lastPlace = powerRankings[powerRankings.length - 1];

  const matchupRecaps = matchups.map((m) => {
    const winner = m.scoreA > m.scoreB ? m.teamA : m.teamB;
    const loser = m.scoreA > m.scoreB ? m.teamB : m.teamA;
    const wScore = (m.scoreA > m.scoreB ? m.scoreA : m.scoreB).toFixed(2);
    const lScore = (m.scoreA > m.scoreB ? m.scoreB : m.scoreA).toFixed(2);
    return `${winner} defeated ${loser} ${wScore}-${lScore}.`;
  });

  return {
    title: `Week ${weekNumber} Results`,
    headlines: [
      `${biggestWinner} wins big, ${biggestLoser} drops by ${biggestMargin} points`,
      `${leader.teamName} holds the top spot in the standings`,
      `${lastPlace.teamName} falls to ${lastPlace.wins}-${lastPlace.losses}`,
    ],
    matchupRecaps,
    callouts: {
      biggestWin: `${biggestWinner} beat ${biggestLoser} by ${biggestMargin} points.`,
      worstLoss: `${worstLoser} put up just ${worstScore} points in a loss.`,
      teamInTrouble:
        lastPlace.losses > 1
          ? `${lastPlace.teamName} is ${lastPlace.wins}-${lastPlace.losses} and running out of time.`
          : `${lastPlace.teamName} hasn't found their footing yet.`,
      teamToWatch:
        leader.wins > 0
          ? `${leader.teamName} is ${leader.wins}-${leader.losses} and looking like the team to beat.`
          : `${leader.teamName} is off to a strong start.`,
    },
    powerRankings,
  };
}

// ─── Main generator ─────────────────────────────────────────────────────────

export async function generateRecap(
  weekNumber: number,
  matchups: MatchupData[],
  allTeamRecords: TeamRecord[], // cumulative records BEFORE this week's results
  leagueName: string
): Promise<RecapContent> {
  // ── Power Rankings (always deterministic) ──────────────────────────────

  const updatedRecords = new Map<string, TeamRecord>();

  for (const r of allTeamRecords) {
    updatedRecords.set(r.teamName, { ...r });
  }

  for (const m of matchups) {
    const aRec = updatedRecords.get(m.teamA) ?? { teamName: m.teamA, wins: 0, losses: 0, totalPoints: 0 };
    const bRec = updatedRecords.get(m.teamB) ?? { teamName: m.teamB, wins: 0, losses: 0, totalPoints: 0 };

    aRec.totalPoints += m.scoreA;
    bRec.totalPoints += m.scoreB;

    if (m.scoreA > m.scoreB) {
      aRec.wins += 1;
      bRec.losses += 1;
    } else if (m.scoreB > m.scoreA) {
      bRec.wins += 1;
      aRec.losses += 1;
    }
    // Tied scores: no win/loss assigned (ties are rejected at input)

    updatedRecords.set(m.teamA, aRec);
    updatedRecords.set(m.teamB, bRec);
  }

  const sorted = Array.from(updatedRecords.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  const powerRankings: PowerRankingEntry[] = sorted.map((r, i) => ({
    rank: i + 1,
    teamName: r.teamName,
    wins: r.wins,
    losses: r.losses,
    totalPoints: Math.round(r.totalPoints * 100) / 100,
  }));

  // ── Empty week fallback ────────────────────────────────────────────────

  if (matchups.length === 0) {
    return {
      title: "Nothing to report",
      headlines: [],
      matchupRecaps: [],
      callouts: {
        biggestWin: "No matchups this week.",
        worstLoss: "No matchups this week.",
        teamInTrouble: "N/A",
        teamToWatch: "N/A",
      },
      powerRankings,
    };
  }

  // ── Build prompt context ───────────────────────────────────────────────

  const teamList = [...new Set(matchups.flatMap((m) => [m.teamA, m.teamB]))].join(", ");

  const matchupsText = matchups
    .map((m) => {
      const winnerName = m.scoreA > m.scoreB ? m.teamA : m.teamB;
      return `${m.teamA} ${m.scoreA.toFixed(2)} vs ${m.teamB} ${m.scoreB.toFixed(2)} — ${winnerName} wins`;
    })
    .join("\n");

  const recordsText =
    allTeamRecords.length > 0
      ? [...allTeamRecords]
          .sort((a, b) => b.wins - a.wins)
          .map((r) => `${r.teamName}: ${r.wins}-${r.losses} (${r.totalPoints.toFixed(2)} pts)`)
          .join("\n")
      : "First week of the season — no prior records.";

  const storylinesText = buildStorylines(allTeamRecords);

  const prompt = `You are the commissioner of a long-running fantasy football league.

You have been running this league for years. You know every manager's habits, failures, and tendencies. You write weekly recaps that are entertaining, slightly sarcastic, and feel like they were written for a group chat — not a news article.

Your tone:
- Conversational, natural, and slightly roasting
- Specific > generic
- Confident, not over-explaining
- No corporate or ESPN-style language

Avoid ALL of the following phrases and styles:
- "In a thrilling matchup"
- "In a nail-biting finish"
- "Let's dive in"
- "It's worth noting"
- "Showcased"
- Any em-dashes (—)
- Overly dramatic sports announcer tone

If you don't have something interesting to say, keep it short instead of filling space.

---

LEAGUE CONTEXT:
League Name: ${leagueName}

Teams this week:
${teamList}

---

WEEK ${weekNumber} RESULTS:
${matchupsText}

Records BEFORE this week:
${recordsText}

---

ONGOING STORYLINES:
${storylinesText}

---

OUTPUT — Return ONLY valid JSON with exactly this structure (no markdown, no code fences, no extra keys):
{
  "title": "One short punchy title for the week",
  "headlines": [
    "Headline under 12 words",
    "Headline under 12 words",
    "Headline under 12 words"
  ],
  "matchupRecaps": [
    "2-4 sentence recap of matchup 1",
    "2-4 sentence recap of matchup 2"
  ],
  "callouts": {
    "biggestWin": "1-2 sentences about the most dominant win",
    "worstLoss": "1-2 sentences about the most embarrassing loss",
    "teamInTrouble": "1-2 sentences about a team that should be worried",
    "teamToWatch": "1-2 sentences about a team on the rise or worth noting"
  }
}

IMPORTANT:
- matchupRecaps must have exactly ${matchups.length} entries, one per matchup in the order given above
- Do NOT sound like a generic sports article
- Prioritize personality and specificity over completeness`;

  // ── Call Claude API — fall back to deterministic if anything goes wrong ──

  try {
    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(extractJSON(rawText));

    // Validate the response has the required shape before trusting it
    if (
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.headlines) ||
      !Array.isArray(parsed.matchupRecaps) ||
      typeof parsed.callouts !== "object" ||
      parsed.callouts === null
    ) {
      throw new Error("Claude returned an unexpected JSON structure.");
    }

    return {
      title: parsed.title,
      headlines: parsed.headlines,
      matchupRecaps: parsed.matchupRecaps,
      callouts: {
        biggestWin: parsed.callouts.biggestWin ?? "",
        worstLoss: parsed.callouts.worstLoss ?? "",
        teamInTrouble: parsed.callouts.teamInTrouble ?? "",
        teamToWatch: parsed.callouts.teamToWatch ?? "",
      },
      powerRankings,
    };
  } catch {
    // Claude API failed, timed out, returned malformed JSON, or returned an
    // unexpected structure. Fall back to a deterministic recap so the week
    // is always saved successfully.
    return generateFallbackRecap(weekNumber, matchups, powerRankings);
  }
}
