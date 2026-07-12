export interface Category {
  id: string;
  label: string;
  description: string;
  accent: string;
  icon: string;
}

export const categories: Category[] = [
  {
    id: "all",
    label: "All sectors",
    description: "Full investment pipeline",
    accent: "from-stone-600 to-stone-800",
    icon: "◈",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Digital health & ops",
    accent: "from-teal-600 to-emerald-700",
    icon: "✚",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    description: "PropTech & infrastructure",
    accent: "from-amber-600 to-orange-700",
    icon: "⌂",
  },
  {
    id: "enterprise-software",
    label: "Enterprise Software",
    description: "B2B SaaS & logistics",
    accent: "from-violet-600 to-indigo-700",
    icon: "⬡",
  },
  {
    id: "fintech",
    label: "Fintech",
    description: "Payments & embedded finance",
    accent: "from-blue-600 to-cyan-700",
    icon: "◉",
  },
  {
    id: "consumer",
    label: "Consumer",
    description: "Marketplaces & brands",
    accent: "from-rose-500 to-pink-700",
    icon: "◎",
  },
];

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id) ?? categories[0];
}
