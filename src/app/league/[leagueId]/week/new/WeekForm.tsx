"use client";

import { useActionState, useState } from "react";

type Team = { id: number; name: string };

type Matchup = {
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
};

type FormState = { error: string } | null;

// Interactive form for entering weekly matchup results.
// The commissioner picks which teams faced each other and enters scores.
export default function WeekForm({
  teams,
  action,
  nextWeekNumber,
}: {
  teams: Team[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  nextWeekNumber: number;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  // Start with one empty matchup slot
  const [matchups, setMatchups] = useState<Matchup[]>([
    { teamAId: "", teamBId: "", scoreA: "", scoreB: "" },
  ]);

  function addMatchup() {
    setMatchups((prev) => [
      ...prev,
      { teamAId: "", teamBId: "", scoreA: "", scoreB: "" },
    ]);
  }

  function removeMatchup(index: number) {
    setMatchups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMatchup(index: number, field: keyof Matchup, value: string) {
    setMatchups((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Week number */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label
          htmlFor="weekNumber"
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          Week Number
        </label>
        <input
          id="weekNumber"
          name="weekNumber"
          type="number"
          required
          min={1}
          max={25}
          defaultValue={nextWeekNumber}
          className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Matchup rows */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Matchups</h2>

        {matchups.map((matchup, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Matchup {i + 1}
              </span>
              {matchups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMatchup(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Team A row */}
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Team A</label>
                <select
                  name={`matchup_${i}_teamA`}
                  required
                  value={matchup.teamAId}
                  onChange={(e) => updateMatchup(i, "teamAId", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Score</label>
                <input
                  name={`matchup_${i}_scoreA`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={500}
                  required
                  placeholder="0.00"
                  value={matchup.scoreA}
                  onChange={(e) => updateMatchup(i, "scoreA", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* VS divider */}
            <div className="text-center text-xs font-bold text-gray-400">VS</div>

            {/* Team B row */}
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Team B</label>
                <select
                  name={`matchup_${i}_teamB`}
                  required
                  value={matchup.teamBId}
                  onChange={(e) => updateMatchup(i, "teamBId", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Score</label>
                <input
                  name={`matchup_${i}_scoreB`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={500}
                  required
                  placeholder="0.00"
                  value={matchup.scoreB}
                  onChange={(e) => updateMatchup(i, "scoreB", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addMatchup}
          className="text-sm text-green-700 border border-green-400 rounded-lg px-4 py-2 hover:bg-green-50 transition-colors"
        >
          + Add Another Matchup
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-base"
      >
        {pending ? "Generating recap…" : "Submit Week & Generate Recap →"}
      </button>
    </form>
  );
}
