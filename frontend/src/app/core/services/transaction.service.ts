import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Observable, map, catchError, of } from 'rxjs';
import type {
  Transaction,
  TransactionData,
  TransactionCategory,
  TransactionCategoryInfo,
} from '../models/transaction.model';
import { TransactionCategory as Category } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly apiUrl = 'http://localhost:8080/api';
  private http = inject(HttpClient);

  private readonly categoryInfo: Record<
    TransactionCategory,
    TransactionCategoryInfo
  > = {
    [Category.INCOME]: {
      category: Category.INCOME,
      name: 'Income',
      icon: 'trending_up',
      color: '#2e7d32',
      backgroundColor: '#e8f5e8',
    },
    [Category.FOOD_DINING]: {
      category: Category.FOOD_DINING,
      name: 'Food & Dining',
      icon: 'restaurant',
      color: '#f57c00',
      backgroundColor: '#fff3e0',
    },
    [Category.SHOPPING]: {
      category: Category.SHOPPING,
      name: 'Shopping',
      icon: 'shopping_bag',
      color: '#7b1fa2',
      backgroundColor: '#f3e5f5',
    },
    [Category.TRANSPORTATION]: {
      category: Category.TRANSPORTATION,
      name: 'Transportation',
      icon: 'directions_car',
      color: '#1976d2',
      backgroundColor: '#e3f2fd',
    },
    [Category.CASH_ATM]: {
      category: Category.CASH_ATM,
      name: 'Cash & ATM',
      icon: 'local_atm',
      color: '#616161',
      backgroundColor: '#f5f5f5',
    },
    [Category.TRANSFER]: {
      category: Category.TRANSFER,
      name: 'Transfer',
      icon: 'swap_horiz',
      color: '#00796b',
      backgroundColor: '#e0f2f1',
    },
    [Category.BILLS_UTILITIES]: {
      category: Category.BILLS_UTILITIES,
      name: 'Bills & Utilities',
      icon: 'receipt',
      color: '#d32f2f',
      backgroundColor: '#ffebee',
    },
    [Category.ENTERTAINMENT]: {
      category: Category.ENTERTAINMENT,
      name: 'Entertainment',
      icon: 'movie',
      color: '#c2185b',
      backgroundColor: '#fce4ec',
    },
    [Category.HEALTHCARE]: {
      category: Category.HEALTHCARE,
      name: 'Healthcare',
      icon: 'local_hospital',
      color: '#388e3c',
      backgroundColor: '#e8f5e8',
    },
    [Category.EDUCATION]: {
      category: Category.EDUCATION,
      name: 'Education',
      icon: 'school',
      color: '#303f9f',
      backgroundColor: '#e8eaf6',
    },
    [Category.OTHER]: {
      category: Category.OTHER,
      name: 'Other',
      icon: 'category',
      color: '#455a64',
      backgroundColor: '#eceff1',
    },
  };

  private cachedTransactionData: TransactionData | null = null;

  getTransactions(): Observable<TransactionData> {
    console.log(`Fetching transactions from: ${this.apiUrl}/transactions`);

    return this.http.get<TransactionData>(`${this.apiUrl}/transactions`).pipe(
      map((data) => {
        console.log('Transactions received:', data);

        // Create unique IDs by combining date and original ID
        const processedData = {
          ...data,
          days: data.days.map((day) => ({
            ...day,
            transactions: day.transactions.map((transaction, index) => ({
              ...transaction,
              // Create unique ID: date + original ID + index to ensure uniqueness
              uniqueId: `${day.id}-${transaction.id}-${index}`,
              originalId: transaction.id, // Keep original ID for reference
            })),
          })),
        };

        // Cache the processed data
        this.cachedTransactionData = processedData;

        return {
          ...processedData,
          days: processedData.days.sort(
            (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
          ),
        };
      }),
      catchError((error) => {
        console.error('Error fetching transactions:', error);
        console.log('Using fallback mock data');
        // Return mock data if API fails
        const mockData = this.getMockData();
        this.cachedTransactionData = mockData;
        return of(mockData);
      })
    );
  }

  getTransactionById(uniqueId: string): Observable<Transaction> {
    console.log(`Looking for transaction with uniqueId: ${uniqueId}`);

    // First try to get from cached data
    if (this.cachedTransactionData) {
      const transaction = this.cachedTransactionData.days
        .flatMap((day) => day.transactions)
        .find((t: any) => t.uniqueId === uniqueId);

      if (transaction) {
        console.log('Found transaction in cache:', transaction);
        return of(transaction);
      }
    }

    // If not in cache, try to fetch all data first
    return this.getTransactions().pipe(
      map((data) => {
        const transaction = data.days
          .flatMap((day) => day.transactions)
          .find((t: any) => t.uniqueId === uniqueId);

        if (transaction) {
          return transaction;
        }
        throw new Error(`Transaction with uniqueId ${uniqueId} not found`);
      }),
      catchError((error) => {
        console.error('Error finding transaction:', error);
        throw error;
      })
    );
  }

  categorizeTransaction(transaction: Transaction): TransactionCategory {
    const description = transaction.description.toLowerCase();
    const otherParty = transaction.otherParty?.name.toLowerCase() || '';
    const amount = transaction.amount;

    // Income detection
    if (
      amount > 0 &&
      (description.includes('salary') ||
        description.includes('payment') ||
        description.includes('income') ||
        description.includes('refund') ||
        description.includes('payday') ||
        otherParty.includes('company') ||
        otherParty.includes('employer'))
    ) {
      return Category.INCOME;
    }

    // Food & Dining
    if (
      description.includes('coffee') ||
      description.includes('restaurant') ||
      description.includes('grocery') ||
      description.includes('food') ||
      description.includes('dining') ||
      otherParty.includes('starbucks') ||
      otherParty.includes('groceries') ||
      otherParty.includes('restaurant') ||
      otherParty.includes('mcdonalds')
    ) {
      return Category.FOOD_DINING;
    }

    // Shopping
    if (
      description.includes('shopping') ||
      description.includes('store') ||
      description.includes('retail') ||
      otherParty.includes('amazon') ||
      otherParty.includes('shop') ||
      otherParty.includes('store')
    ) {
      return Category.SHOPPING;
    }

    // Transportation
    if (
      description.includes('gas') ||
      description.includes('fuel') ||
      description.includes('parking') ||
      description.includes('taxi') ||
      description.includes('uber') ||
      description.includes('transport') ||
      otherParty.includes('shell') ||
      otherParty.includes('bp') ||
      otherParty.includes('esso')
    ) {
      return Category.TRANSPORTATION;
    }

    // Cash & ATM
    if (
      description.includes('atm') ||
      description.includes('cash') ||
      description.includes('withdrawal')
    ) {
      return Category.CASH_ATM;
    }

    // Transfer
    if (
      description.includes('transfer') ||
      description.includes('bank transfer') ||
      description.includes('payment request') ||
      (!transaction.otherParty && amount > 0)
    ) {
      return Category.TRANSFER;
    }

    // Bills & Utilities
    if (
      description.includes('bill') ||
      description.includes('utility') ||
      description.includes('electric') ||
      description.includes('water') ||
      description.includes('internet') ||
      description.includes('phone') ||
      description.includes('insurance') ||
      description.includes('rent') ||
      description.includes('gym') ||
      otherParty.includes('rental') ||
      otherParty.includes('gym')
    ) {
      return Category.BILLS_UTILITIES;
    }

    // Entertainment
    if (
      description.includes('movie') ||
      description.includes('cinema') ||
      description.includes('entertainment') ||
      description.includes('game') ||
      description.includes('music') ||
      description.includes('streaming') ||
      description.includes('dinner') ||
      otherParty.includes('people to hang')
    ) {
      return Category.ENTERTAINMENT;
    }

    // Healthcare
    if (
      description.includes('hospital') ||
      description.includes('doctor') ||
      description.includes('pharmacy') ||
      description.includes('medical') ||
      description.includes('health')
    ) {
      return Category.HEALTHCARE;
    }

    // Education
    if (
      description.includes('school') ||
      description.includes('university') ||
      description.includes('education') ||
      description.includes('course') ||
      description.includes('tuition')
    ) {
      return Category.EDUCATION;
    }

    return Category.OTHER;
  }

  getCategoryInfo(category: TransactionCategory): TransactionCategoryInfo {
    return this.categoryInfo[category];
  }

  getAllCategories(): TransactionCategoryInfo[] {
    return Object.values(this.categoryInfo);
  }

  private getMockData(): TransactionData {
    const baseData = {
      days: [
        {
          id: '2022-11-08',
          transactions: [
            {
              id: 1,
              timestamp: '2022-11-08T14:30:47.123Z',
              amount: 17.95,
              currencyCode: 'USD',
              currencyRate: 1.173628,
              description: 'Some interesting description',
              otherParty: {
                name: 'Mister XX',
                iban: 'NL00RABO0123456789',
              },
            },
            {
              id: 2,
              timestamp: '2022-11-08T12:45:47.123Z',
              amount: -25.95,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Some other interesting description',
              otherParty: {
                name: 'Miss Y',
                iban: 'NL00RABO9876543210',
              },
            },
            {
              id: 3,
              timestamp: '2022-11-08T10:30:47.123Z',
              amount: 3456.67,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Finally payday',
              otherParty: {
                name: 'Company Z',
                iban: 'NL00RABO3210654789',
              },
            },
          ],
        },
        {
          id: '2022-11-06',
          transactions: [
            {
              id: 1,
              timestamp: '2022-11-06T17:12:47.123Z',
              amount: -38.95,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Gym',
              otherParty: {
                name: 'Gym be fit',
                iban: 'NL00RABO0123456789',
              },
            },
            {
              id: 2,
              timestamp: '2022-11-06T15:45:00.123Z',
              amount: -987.65,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Monthly rent',
              otherParty: {
                name: 'RENTAL',
                iban: 'NL00RABO9876543210',
              },
            },
            {
              id: 3,
              timestamp: '2022-11-06T11:56:12.123Z',
              amount: 123.45,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Payment request for dinner',
              otherParty: {
                name: 'People to hang with',
                iban: 'NL00RABO3210654789',
              },
            },
          ],
        },
        {
          id: '2022-11-05',
          transactions: [
            {
              id: 1,
              timestamp: '2022-11-05T11:39:59.123Z',
              amount: -58.47,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Some interesting description',
              otherParty: {
                name: 'Groceries',
                iban: 'NL00RABO0123764789',
              },
            },
          ],
        },
        {
          id: '2022-11-02',
          transactions: [
            {
              id: 1,
              timestamp: '2022-11-02T23:30:45.123Z',
              amount: -99.87,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Some interesting description',
              otherParty: {
                name: 'Restaurant A',
                iban: 'NL00RABO0128356789',
              },
            },
            {
              id: 2,
              timestamp: '2022-11-02T12:45:47.123Z',
              amount: -50,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'ATM',
            },
          ],
        },
      ],
    };

    // Add unique IDs to mock data too
    return {
      ...baseData,
      days: baseData.days.map((day) => ({
        ...day,
        transactions: day.transactions.map((transaction, index) => ({
          ...transaction,
          uniqueId: `${day.id}-${transaction.id}-${index}`,
          originalId: transaction.id,
        })),
      })),
    };
  }

  // Convert any amount to EUR
  convertToEur(amount: number, currencyCode: string, currencyRate = 1): number {
    if (currencyCode === 'EUR') {
      return amount;
    }
    return amount / currencyRate;
  }

  formatAmount(amount: number, currencyCode = 'EUR'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Helper method to format date without timezone issues
  formatDateLocal(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    const date = new Date(
      Number.parseInt(year),
      Number.parseInt(month) - 1,
      Number.parseInt(day)
    );
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
