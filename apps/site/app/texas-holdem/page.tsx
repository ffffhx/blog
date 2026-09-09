import type { Metadata } from "next";
import { GameRedirect } from "@/components/game-redirect";

export const metadata: Metadata = { title: "德州扑克已迁移", robots: { index: false } };

export default function LegacyGamePage() {
  return <GameRedirect slug="texas-holdem" />;
}
