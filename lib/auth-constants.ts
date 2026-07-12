import type { AccountRecord } from "./auth-types";

export const SESSION_COOKIE = "icready_session";
export const REGISTRY_COOKIE = "icready_registry";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export const DEMO_PASSWORD = "ICReady";

export const DEMO_ACCOUNTS: AccountRecord[] = [
  {
    email: "alex.rivera@sagard.com",
    password: DEMO_PASSWORD,
    user: {
      id: "user-alex",
      email: "alex.rivera@sagard.com",
      name: "Alex Rivera",
      role: "associate",
      onboardingComplete: true,
      integrations: { sheets: true, n8n: true, claude: true },
    },
  },
  {
    email: "jordan.lee@sagard.com",
    password: DEMO_PASSWORD,
    user: {
      id: "user-jordan",
      email: "jordan.lee@sagard.com",
      name: "Jordan Lee",
      role: "principal",
      onboardingComplete: true,
      integrations: { sheets: true, n8n: true, claude: true },
    },
  },
];

export const ROLE_LABELS: Record<string, string> = {
  associate: "Associate · Investments",
  principal: "Principal · Investments",
  partner: "Partner · Investments",
};
