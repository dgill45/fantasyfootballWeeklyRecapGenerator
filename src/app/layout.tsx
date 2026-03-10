import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy League Weekly Recap",
  description: "Generate fun weekly recaps for your fantasy football league",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Simple top nav */}
        <header className="bg-green-700 text-white px-4 py-3 shadow-md">
          <a href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            🏈 Fantasy Recap
          </a>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
