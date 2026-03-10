"use client";

import { useActionState, useState } from "react";

type FormState = { error: string } | null;

// This is a client component because we need interactivity:
// the commissioner can add/remove team name inputs dynamically.
export default function NewLeagueForm({
  action,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  // Start with 4 empty team name slots — a typical fantasy league has 8-12
  const [teamCount, setTeamCount] = useState(4);

  const addTeam = () => setTeamCount((n) => Math.min(n + 1, 20));
  const removeTeam = () => setTeamCount((n) => Math.max(n - 1, 2));

  return (
    <form action={formAction} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* League name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
          League Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. The Gridiron Legends"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Season year */}
      <div>
        <label htmlFor="seasonYear" className="block text-sm font-semibold text-gray-700 mb-1">
          Season Year
        </label>
        <input
          id="seasonYear"
          name="seasonYear"
          type="number"
          required
          defaultValue={new Date().getFullYear()}
          min={2000}
          max={2100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Team names */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Team Names</span>
          <span className="text-xs text-gray-400">{teamCount} teams</span>
        </div>

        {Array.from({ length: teamCount }).map((_, i) => (
          <input
            key={i}
            name={`teamName_${i}`}
            type="text"
            required
            placeholder={`Team ${i + 1} name`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={addTeam}
            className="text-sm text-green-700 border border-green-400 rounded-lg px-3 py-1 hover:bg-green-50 transition-colors"
          >
            + Add Team
          </button>
          {teamCount > 2 && (
            <button
              type="button"
              onClick={removeTeam}
              className="text-sm text-red-600 border border-red-300 rounded-lg px-3 py-1 hover:bg-red-50 transition-colors"
            >
              − Remove Last
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors"
      >
        {pending ? "Creating…" : "Create League →"}
      </button>
    </form>
  );
}
