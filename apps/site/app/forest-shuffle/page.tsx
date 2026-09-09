import type { Metadata } from "next";
import { GameRedirect } from "@/components/game-redirect";

export const metadata: Metadata = { title: "森森不息已迁移", robots: { index: false } };

export default function LegacyGamePage() {
  return <GameRedirect slug="forest-shuffle" />;
}
