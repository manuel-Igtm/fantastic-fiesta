export type SupportedLanguage = 'en' | 'sw';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
};

export type RegisterRequest = {
  email?: string;
  phone?: string;
  password: string;
  preferredLanguage?: SupportedLanguage;
};

export type LoginRequest = {
  email?: string;
  phone?: string;
  password: string;
};

export type UserProfile = {
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  currency?: string | null;
  monthlyBaselineExpense?: string | null;
};

export type MeResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  preferredLanguage: SupportedLanguage;
  role: string;
  status: string;
  createdAt: string;
  profile: UserProfile | null;
};

export type Connection = {
  id: string;
  providerType: string;
  accountName: string;
  accountMask?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type TransactionItem = {
  id: string;
  amount: string;
  currency: string;
  direction: 'in' | 'out';
  merchant: string | null;
  occurredAt: string;
  category: {
    id: string;
    name: string;
    isEssential: boolean;
  } | null;
  account: {
    id: string;
    accountName: string;
    providerType: string;
  };
};

export type TransactionSummary = {
  inflow: number;
  outflow: number;
  netCashFlow: number;
  essentialSpend: number;
  nonEssentialSpend: number;
  haraHachiBuRatio: number;
  window: {
    from: string;
    to: string;
  };
};

export type GoalContribution = {
  id: string;
  amount: string;
  method: string;
  contributedAt: string;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  dueDate: string;
  priority: number;
  imageUrl?: string | null;
  status: string;
  contributions: GoalContribution[];
};

export type GoalInput = {
  title: string;
  targetAmount: number;
  dueDate: string;
  priority: number;
  imageUrl?: string;
};

export type GoalContributionInput = {
  amount: number;
  sourceAccountId?: string;
  method: string;
};

export type GoalSummary = Omit<Goal, 'targetAmount' | 'currentAmount'> & {
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
};

export type EmergencyFund = {
  id: string;
  targetMonths: number;
  targetAmount: string;
  currentAmount: string;
  healthStatus: string;
  updatedAt: string;
};

export type SavingsRule = {
  id: string;
  ruleType: string;
  configJson: Record<string, unknown>;
  status: string;
  nextRunAt?: string | null;
  createdAt: string;
};

export type AlertItem = {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
};

export type ReportItem = {
  id: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  fileRef?: string | null;
  createdAt: string;
};
