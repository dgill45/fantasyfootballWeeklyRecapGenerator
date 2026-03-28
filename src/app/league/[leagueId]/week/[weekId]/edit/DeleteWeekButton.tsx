"use client";

export default function DeleteWeekButton({
  action,
  weekNumber,
}: {
  action: () => Promise<void>;
  weekNumber: number;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete Week ${weekNumber} and its recap? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        Delete Week {weekNumber}
      </button>
    </form>
  );
}
