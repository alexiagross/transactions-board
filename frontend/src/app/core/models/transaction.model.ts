export interface OtherParty {
  name: string;
  iban: string;
}

export interface Transaction {
  id: number;
  timestamp: string;
  amount: number;
  currencyCode: string;
  currencyRate?: number;
  description: string;
  otherParty?: OtherParty;
}

export interface TransactionDay {
  id: string;
  transactions: Transaction[];
}

export interface TransactionData {
  days: TransactionDay[];
}

export enum TransactionCategory {
  INCOME = 'income',
  FOOD_DINING = 'food_dining',
  SHOPPING = 'shopping',
  TRANSPORTATION = 'transportation',
  CASH_ATM = 'cash_atm',
  TRANSFER = 'transfer',
  BILLS_UTILITIES = 'bills_utilities',
  ENTERTAINMENT = 'entertainment',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  OTHER = 'other',
}

export interface TransactionCategoryInfo {
  category: TransactionCategory;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
}
