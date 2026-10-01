import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "OtakuHub - Anime, Manga & Novel Platform",
  description: "Your ultimate hub for anime, manga, novels, characters, and community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-1"><AuthGuard>{children}</AuthGuard></main>
      </body>
    </html>
  );
}
