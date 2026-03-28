"use client";

import { useActionState, useState } from "react";

type FormState = { error: string } | null;

export default function EditLeagueForm({
  league,
  action,
}: {
  league: { name: string; seasonYear: number; teams: { id: number; name: string }[] };
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [newTeams, setNewTeams] = useState<string[]>([]);

  const addSlot = () => setNewTeams((t) => [...t, ""]);
  const removeSlot = (i: number) => setNewTeams((t) => t.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, val: string) =>
    setNewTeams((t) => t.map((v, idx) => (idx === i ? val : v)));

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* League name */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">League Info</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
            League Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={league.name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="seasonYear" className="block text-sm font-semibold text-gray-700 mb-1">
            Season Year
          </label>
          <input
            id="seasonYear"
            name="seasonYear"
            type="number"
            required
            defaultValue={league.seasonYear}
            min={2000}
            max={2100}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Existing teams — read-only */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">
          Existing Teams
          <span className="text-xs text-gray-400 font-normal ml-2">read-only — tied to match history</span>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {league.teams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500"
            >
              🏈 {team.name}
            </div>
          ))}
        </div>
      </div>

      {/* Add new teams */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Add Teams</h2>

        {newTeams.length === 0 && (
          <p className="text-sm text-gray-400">No new teams to add yet.</p>
        )}

        {newTeams.map((val, i) => (
          <div key={i} className="flex gap-2">
            <input
              name={`newTeam_${i}`}
              type="text"
              placeholder={`New team ${i + 1} name`}
              value={val}
              onChange={(e) => updateSlot(i, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSlot}
          className="text-sm text-green-700 border border-green-400 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors"
        >
          + Add Team
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {pending ? "Saving…" : "Save Changes →"}
      </button>
    </form>
  );
}
