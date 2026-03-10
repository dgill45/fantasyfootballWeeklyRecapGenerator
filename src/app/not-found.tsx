import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-5xl">🤷</div>
      <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
      <p className="text-gray-500">That league or week doesn't exist.</p>
      <Link href="/" className="inline-block underline text-green-600 hover:text-green-700">
        Go home
      </Link>
    </div>
  );
}
