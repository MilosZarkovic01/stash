import { getToken } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 204) {
    return undefined as T;
  }
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? 'Request failed');
    throw new ApiError(response.status, message);
  }
  return body as T;
}

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  primaryCurrency: 'RSD' | 'EUR';
  hasApple: boolean;
};

export type Session = { accessToken: string; user: User };

export type Account = {
  id: string;
  name: string;
  currency: 'RSD' | 'EUR';
  initialBalance: string;
  currentBalance: string;
};

export type Category = { id: string; name: string; slug: string };

export type Transaction = {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: string;
  currency: 'RSD' | 'EUR';
  description: string;
  categoryId: string | null;
  accountId: string;
  destinationAccountId: string | null;
  transactionDate: string;
};

export type Recurring = {
  id: string;
  name: string;
  amount: string;
  currency: 'RSD' | 'EUR';
  categoryId: string;
  accountId: string;
  nextOccurrence: string;
  active: boolean;
};

export type SavingsGoal = {
  id: string;
  name: string;
  currency: 'RSD' | 'EUR';
  target: string;
  year: number;
  month: number;
  progress: string;
  remaining: string;
};

export const api = {
  register: (body: {
    email: string;
    password: string;
    primaryCurrency?: 'RSD' | 'EUR';
  }) =>
    request<{ message: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyEmail: (token: string) =>
    request<Session>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  resendVerification: (email: string) =>
    request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<Session>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  apple: (identityToken: string, email?: string) =>
    request<Session>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identityToken, email }),
    }),
  me: () => request<User>('/users/me'),
  updateMe: (primaryCurrency: 'RSD' | 'EUR') =>
    request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ primaryCurrency }),
    }),
  accounts: () => request<Account[]>('/accounts'),
  createAccount: (body: {
    name: string;
    currency: 'RSD' | 'EUR';
    initialBalance: string;
  }) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id: string, name: string) =>
    request<Account>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteAccount: (id: string) =>
    request<{ deleted: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
  categories: () => request<Category[]>('/categories'),
  transactions: (accountId?: string) =>
    request<Transaction[]>(
      accountId ? `/transactions?accountId=${accountId}` : '/transactions',
    ),
  createTransaction: (body: Record<string, unknown>) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateTransaction: (id: string, body: Record<string, unknown>) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id: string) =>
    request<{ deleted: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),
  recurring: () => request<Recurring[]>('/recurring-expenses'),
  createRecurring: (body: Record<string, unknown>) =>
    request<Recurring>('/recurring-expenses', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateRecurring: (id: string, body: Record<string, unknown>) =>
    request<Recurring>(`/recurring-expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deactivateRecurring: (id: string) =>
    request<Recurring>(`/recurring-expenses/${id}`, { method: 'DELETE' }),
  generateRecurring: () =>
    request<{ createdCount: number }>('/recurring-expenses/generate', {
      method: 'POST',
    }),
  goals: () => request<SavingsGoal[]>('/savings-goals'),
  createGoal: (body: Record<string, unknown>) =>
    request<SavingsGoal>('/savings-goals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteGoal: (id: string) =>
    request<{ deleted: boolean }>(`/savings-goals/${id}`, { method: 'DELETE' }),
  insights: () => request<Insights>('/insights'),
  status: () => request<StatusPayload>('/insights/status'),
  parseExpense: (text: string) =>
    request<{
      amount: string | null;
      description: string;
      category: string;
      confidence: number;
    }>('/ai/parse-expense', { method: 'POST', body: JSON.stringify({ text }) }),
  classify: (description: string) =>
    request<{ category: string; confidence: number }>('/ai/classify', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
};

export type StatusPayload = {
  year: number;
  month: number;
  primaryCurrency: 'RSD' | 'EUR';
  balances: { currency: string; total: string }[];
  currencies: {
    currency: string;
    income: string;
    expenses: string;
    expectedRecurring: string;
    savingsTarget: string;
    remainingDays: number;
    flexibleSpending: string;
    dailyAllowance: string;
  }[];
};

export type Insights = {
  year: number;
  month: number;
  spendingByCategory: {
    category: string;
    currency: string;
    amount: string;
    share: string;
  }[];
  vsPreviousMonth: { category: string; current: string; previous: string }[];
  topExpenses: {
    id: string;
    description: string;
    amount: string;
    currency: string;
    transactionDate: string;
    category: string;
  }[];
  spendingOverTime: { date: string; currency: string; amount: string }[];
};
