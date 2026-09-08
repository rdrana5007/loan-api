import { Loan } from "../models";

export const ALL_LOAN_STATUSES: string[] = ['pending', 'approved', 'rejected', 'active', 'closed', 'defaulted'];

export const ALL_EMI_FOLLOWUP_STATUSES: string[] = ['pending', 'completed'];

export const NON_DELETABLE_LOAN_STATUSES = new Set<Loan['status']>(['pending', 'approved', 'active', 'defaulted']);