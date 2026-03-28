"use client";

import { useActionState, useState } from "react";

type FormState = { error: string } | null;

type MatchupRow = {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
};

type Team = { id: number; name: string };

type NewMatchup = {
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
};

export default function EditWeekForm({
  weekNumber,
  matchups,
  teams,
  action,
}: {
  weekNumber: number;
  matchups: MatchupRow[];
  teams: Team[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [newMatchups, setNewMatchups] = useState<NewMatchup[]>([]);

  function addSlot() {
    setNewMatchups((prev) => [...prev, { teamAId: "", teamBId: "", scoreA: "", scoreB: "" }]);
  }

  function removeSlot(i: number) {
    setNewMatchups((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSlot(i: number, field: keyof NewMatchup, value: string) {
    setNewMatchups((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Existing matchups */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          Existing Matchups
          <span className="text-xs text-gray-400 font-normal ml-2">edit scores</span>
        </h2>

        {matchups.map((m, i) => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <input type="hidden" name={`matchup_${i}_id`} value={m.id} />
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Matchup {i + 1}
            </span>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Team A</p>
                <p className="font-medium text-gray-800 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {m.teamAName}
                </p>
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
                  defaultValue={m.scoreA}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="text-center text-xs font-bold text-gray-400">VS</div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Team B</p>
                <p className="font-medium text-gray-800 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {m.teamBName}
                </p>
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
                  defaultValue={m.scoreB}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new matchups */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          Add Matchups
          <span className="text-xs text-gray-400 font-normal ml-2">missing matchups</span>
        </h2>

        {newMatchups.length === 0 && (
          <p className="text-sm text-gray-400">No new matchups to add yet.</p>
        )}

        {newMatchups.map((m, j) => (
          <div key={j} className="bg-white border border-green-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                New Matchup {j + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSlot(j)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Team A</label>
                <select
                  name={`new_${j}_teamA`}
                  required
                  value={m.teamAId}
                  onChange={(e) => updateSlot(j, "teamAId", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Score</label>
                <input
                  name={`new_${j}_scoreA`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={500}
                  required
                  placeholder="0.00"
                  value={m.scoreA}
                  onChange={(e) => updateSlot(j, "scoreA", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="text-center text-xs font-bold text-gray-400">VS</div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Team B</label>
                <select
                  name={`new_${j}_teamB`}
                  required
                  value={m.teamBId}
                  onChange={(e) => updateSlot(j, "teamBId", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Score</label>
                <input
                  name={`new_${j}_scoreB`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={500}
                  required
                  placeholder="0.00"
                  value={m.scoreB}
                  onChange={(e) => updateSlot(j, "scoreB", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSlot}
          className="text-sm text-green-700 border border-green-400 rounded-lg px-4 py-2 hover:bg-green-50 transition-colors"
        >
          + Add Matchup
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-base"
      >
        {pending ? "Saving…" : "Save Changes & Regenerate Recap →"}
      </button>
    </form>
  );
}
