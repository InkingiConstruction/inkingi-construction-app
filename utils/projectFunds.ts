// utils/projectFunds.ts
/**
 * @fileoverview AsyncStorage-backed project fund management
 * Stores balances and transactions per project locally.
 * Replace with API calls when backend is ready.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FUNDS_KEY = '@inkingi_project_funds_v1';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FundTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  method: string;
  methodLabel: string;
  date: string;
  note?: string;
  reference: string;
}

export interface ProjectFund {
  projectId: string;
  projectName: string;
  balance: number;
  budget: number;
  transactions: FundTransaction[];
  createdAt: string;
  updatedAt: string;
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export const getAllFunds = async (): Promise<Record<string, ProjectFund>> => {
  try {
    const raw = await AsyncStorage.getItem(FUNDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveFunds = async (funds: Record<string, ProjectFund>): Promise<void> => {
  await AsyncStorage.setItem(FUNDS_KEY, JSON.stringify(funds));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a single project's fund record, or null if not initialised.
 */
export const getProjectFund = async (projectId: string): Promise<ProjectFund | null> => {
  const all = await getAllFunds();
  return all[projectId] ?? null;
};

/**
 * Ensure a project wallet exists. Creates it if missing.
 */
export const ensureProjectFund = async (
  projectId: string,
  projectName: string,
  budget: number
): Promise<ProjectFund> => {
  const all = await getAllFunds();
  if (!all[projectId]) {
    all[projectId] = {
      projectId,
      projectName,
      balance: 0,
      budget,
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveFunds(all);
  }
  return all[projectId];
};

/**
 * Add funds to a project wallet.
 */
export const addFunds = async (
  projectId: string,
  projectName: string,
  budget: number,
  amount: number,
  method: string,
  methodLabel: string
): Promise<ProjectFund> => {
  const all = await getAllFunds();
  await ensureProjectFund(projectId, projectName, budget);

  const fund = all[projectId] ?? {
    projectId, projectName, balance: 0, budget,
    transactions: [], createdAt: new Date().toISOString(), updatedAt: '',
  };

  fund.balance += amount;
  fund.updatedAt = new Date().toISOString();
  fund.transactions.unshift({
    id: `dep_${Date.now()}`,
    type: 'deposit',
    amount,
    method,
    methodLabel,
    date: new Date().toISOString(),
    reference: `DEP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  });

  all[projectId] = fund;
  await saveFunds(all);
  return fund;
};

/**
 * Withdraw funds from a project wallet.
 */
export const withdrawFunds = async (
  projectId: string,
  amount: number,
  method: string,
  methodLabel: string
): Promise<ProjectFund> => {
  const all = await getAllFunds();
  const fund = all[projectId];
  if (!fund) throw new Error('Project wallet not found');
  if (fund.balance < amount) throw new Error('Insufficient balance');

  fund.balance -= amount;
  fund.updatedAt = new Date().toISOString();
  fund.transactions.unshift({
    id: `wth_${Date.now()}`,
    type: 'withdraw',
    amount,
    method,
    methodLabel,
    date: new Date().toISOString(),
    reference: `WTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  });

  all[projectId] = fund;
  await saveFunds(all);
  return fund;
};

/**
 * Format amount with RWF currency.
 */
export const formatRWF = (amount: number): string =>
  `${amount.toLocaleString()} RWF`;
