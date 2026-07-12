/** Auth session and account types for the demo login flow. */

export type UserRole = "associate" | "principal" | "partner";

export type IntegrationState = {
  sheets: boolean;
  n8n: boolean;
  claude: boolean;
};

export type ICReadyUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  onboardingComplete: boolean;
  integrations: IntegrationState;
};

export type AccountRecord = {
  email: string;
  password: string;
  user: ICReadyUser;
};

export type SessionPayload = ICReadyUser;
