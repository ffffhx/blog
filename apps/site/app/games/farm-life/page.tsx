import type { Metadata } from "next";
import { GameRedirect } from "@/components/game-redirect";

export const metadata: Metadata = { title: "山居种田已迁移", robots: { index: false } };

// Static export also serves the former iframe URL /games/farm-life/index.html.
export default function LegacyFarmLifePage() {
  return <GameRedirect slug="farm-life" />;
}
