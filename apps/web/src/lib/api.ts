export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';
export const AI_BASE_URL = import.meta.env.VITE_AI_ORCHESTRATOR_URL ?? 'http://localhost:8001';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  preferredLanguage: 'en' | 'sw' | string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: AuthUser;
}

export interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  currency?: string | null;
  monthlyBaselineExpense?: string | null;
}

export interface MeResponse {
  id: string;
  email: string | null;
  phone: string | null;
  preferredLanguage: 'en' | 'sw' | string;
  role: string;
  status: string;
  createdAt: string;
  profile: UserProfile | null;
}

export interface Connection {
  id: string;
  providerType: string;
  accountName: string;
  accountMask: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface TransactionSummary {
  window: {
    from: string;
    to: string;
  };
  inflow: number;
  outflow: number;
  netCashFlow: number;
  essentialSpend: number;
  nonEssentialSpend: number;
  haraHachiBuRatio: number;
}

export interface TransactionItem {
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
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  dueDate: string;
  priority: number;
  status: string;
  imageUrl: string | null;
  contributions: Array<{
    id: string;
    amount: string;
    method: string;
    contributedAt: string;
  }>;
}

export interface EmergencyFund {
  id: string;
  targetMonths: number;
  targetAmount: string;
  currentAmount: string;
  healthStatus: string;
  updatedAt: string;
}

export interface SavingsRule {
  id: string;
  ruleType: string;
  configJson: Record<string, unknown>;
  status: string;
  nextRunAt: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  fileRef: string | null;
  createdAt: string;
}

export interface ScenarioResponse {
  recommendation: string;
  safer_alternatives: string[];
  action_plan: string[];
  explainability: string;
  generated_at: string;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
  idempotent?: boolean;
  signal?: AbortSignal;
};

function idempotencyKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class SaveSabiApi {
  constructor(private readonly getAccessToken: () => string | null) {}

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, requiresAuth = true, idempotent = false, signal } = options;
    const headers = new Headers({
      'Content-Type': 'application/json'
    });
    if (requiresAuth) {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new ApiError('Authentication required', 401);
      }
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (idempotent) {
      headers.set('Idempotency-Key', idempotencyKey());
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage =
        (payload as { message?: string | string[] } | null)?.message ?? 'Request failed';
      throw new ApiError(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage),
        response.status,
        payload
      );
    }

    return payload as T;
  }

  register(input: {
    email?: string;
    phone?: string;
    password: string;
    preferredLanguage?: 'en' | 'sw';
  }) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      requiresAuth: false
    });
  }

  login(input: { email?: string; phone?: string; password: string }) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      requiresAuth: false
    });
  }

  refresh(refreshToken: string) {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      requiresAuth: false
    });
  }

  logout() {
    return this.request<{ success?: boolean }>('/auth/logout', {
      method: 'POST',
      idempotent: true
    });
  }

  me() {
    return this.request<MeResponse>('/me');
  }

  updateMe(input: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    currency?: string;
    monthlyBaselineExpense?: number;
  }) {
    return this.request<MeResponse>('/me', {
      method: 'PATCH',
      body: input
    });
  }

  updateLanguage(preferredLanguage: 'en' | 'sw') {
    return this.request<MeResponse>('/me/language', {
      method: 'PATCH',
      body: { preferredLanguage }
    });
  }

  listConnections() {
    return this.request<Connection[]>('/connections');
  }

  initiateConnection(input: {
    providerType: 'bank' | 'mpesa' | 'airtel' | 'equitel' | 'manual' | 'crypto';
    accountName: string;
    providerAccountRef?: string;
    accountMask?: string;
  }) {
    return this.request<{
      providerType: string;
      authorizationUrl: string;
      state: string;
    }>('/connections/initiate', {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  callbackConnection(input: {
    providerType: string;
    providerAccountRef: string;
    accountName: string;
    accountMask?: string;
  }) {
    return this.request<Connection>('/connections/callback', {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  deleteConnection(id: string) {
    return this.request<{ success: boolean }>(`/connections/${id}`, {
      method: 'DELETE',
      idempotent: true
    });
  }

  listTransactions(limit = 50, cursor?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.set('cursor', cursor);
    }
    return this.request<TransactionItem[]>(`/transactions?${params.toString()}`);
  }

  updateTransactionCategory(transactionId: string, categoryId: string) {
    return this.request<TransactionItem>(`/transactions/${transactionId}/category`, {
      method: 'PATCH',
      body: { categoryId }
    });
  }

  transactionSummary(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) {
      params.set('startDate', startDate);
    }
    if (endDate) {
      params.set('endDate', endDate);
    }
    return this.request<TransactionSummary>(
      `/transactions/summary${params.size > 0 ? `?${params.toString()}` : ''}`
    );
  }

  listSavingsRules() {
    return this.request<SavingsRule[]>('/savings-rules');
  }

  createSavingsRule(input: {
    ruleType: 'round_up' | 'percentage_sweep' | 'payday_sweep' | 'threshold_sweep' | 'fixed_amount';
    configJson: Record<string, unknown>;
    nextRunAt?: string;
  }) {
    return this.request<SavingsRule>('/savings-rules', {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  pauseSavingsRule(id: string) {
    return this.request<SavingsRule>(`/savings-rules/${id}/pause`, {
      method: 'POST',
      idempotent: true
    });
  }

  resumeSavingsRule(id: string) {
    return this.request<SavingsRule>(`/savings-rules/${id}/resume`, {
      method: 'POST',
      idempotent: true
    });
  }

  listGoals() {
    return this.request<Goal[]>('/goals');
  }

  createGoal(input: {
    title: string;
    targetAmount: number;
    dueDate: string;
    priority: number;
    imageUrl?: string;
  }) {
    return this.request<Goal>('/goals', {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  contributeGoal(goalId: string, input: { amount: number; sourceAccountId?: string; method: string }) {
    return this.request(`/goals/${goalId}/contribute`, {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  emergencyFund() {
    return this.request<EmergencyFund>('/emergency-fund');
  }

  updateEmergencyFund(input: { targetMonths: 6 | 9 | 12; currentAmount: number }) {
    return this.request<EmergencyFund>('/emergency-fund', {
      method: 'PATCH',
      body: input
    });
  }

  listAlerts() {
    return this.request<Alert[]>('/alerts');
  }

  resolveAlert(id: string) {
    return this.request(`/alerts/${id}/resolve`, {
      method: 'POST',
      idempotent: true
    });
  }

  feedbackAlert(id: string, disposition: 'valid' | 'duplicate' | 'fraud') {
    return this.request(`/alerts/${id}/feedback`, {
      method: 'POST',
      body: { disposition },
      idempotent: true
    });
  }

  listReports() {
    return this.request<Report[]>('/reports');
  }

  generateReport(input: { reportType: string; periodStart: string; periodEnd: string }) {
    return this.request<Report>('/reports/generate', {
      method: 'POST',
      body: input,
      idempotent: true
    });
  }

  downloadReport(reportId: string) {
    return this.request<{ downloadUrl: string }>(`/reports/${reportId}/download`);
  }
}

export type ApiClient = SaveSabiApi;

export async function runScenario(input: {
  prompt: string;
  language: 'en' | 'sw';
  monthly_income: number;
  monthly_expenses: number;
  goal_commitments: number;
}): Promise<ScenarioResponse> {
  const response = await fetch(`${AI_BASE_URL}/v1/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const payload = (await response.json()) as ScenarioResponse | { detail?: string };
  if (!response.ok) {
    throw new ApiError((payload as { detail?: string }).detail ?? 'AI scenario failed', response.status);
  }
  return payload as ScenarioResponse;
}
