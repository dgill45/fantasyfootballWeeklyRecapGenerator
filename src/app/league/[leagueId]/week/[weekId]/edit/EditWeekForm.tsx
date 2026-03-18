"use client";

import { useActionState } from "react";

type FormState = { error: string } | null;

type MatchupRow = {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
};

export default function EditWeekForm({
  weekNumber,
  matchups,
  action,
}: {
  weekNumber: number;
  matchups: MatchupRow[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700">Week {weekNumber}</p>
        <p className="text-xs text-gray-400 mt-1">
          Edit scores below. The recap will be regenerated on save.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Matchup Scores</h2>

        {matchups.map((m, i) => (
          <div
            key={m.id}
            className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
          >
            <input type="hidden" name={`matchup_${i}_id`} value={m.id} />
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Matchup {i + 1}
            </span>

            {/* Team A */}
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

            {/* Team B */}
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
