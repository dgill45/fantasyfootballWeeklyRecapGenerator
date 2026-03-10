import { createLeague } from "../actions";
import NewLeagueForm from "./NewLeagueForm";

// Page wrapper — keeps data (server action) separate from the interactive form UI
export default function NewLeaguePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Create a League</h1>
        <p className="text-gray-500 mt-1">
          Set up your league once, then add week results all season long.
        </p>
      </div>

      <NewLeagueForm action={createLeague} />
    </div>
  );
}
