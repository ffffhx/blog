export type GameEntry = {
  slug: string;
  title: string;
  href: string;
  description: string;
  status: string;
};

export const GAME_ENTRIES: GameEntry[] = [
  {
    slug: "forest-shuffle",
    title: "森森不息",
    href: "/forest-shuffle",
    description: "两人私用的森林生态卡牌桌，支持本地游玩和局域网房间。",
    status: "暂存入口",
  },
];

export function getAllGames() {
  return GAME_ENTRIES;
}
