import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Observable, map, catchError, of } from 'rxjs';
import type { Transaction, TransactionData } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly apiUrl = 'http://localhost:8080/api';
  private http = inject(HttpClient);

  getTransactions(): Observable<TransactionData> {
    console.log(`Fetching transactions from: ${this.apiUrl}/transactions`);

    return this.http.get<TransactionData>(`${this.apiUrl}/transactions`).pipe(
      map((data) => {
        console.log('Transactions received:', data);
        return {
          ...data,
          days: data.days.sort(
            (a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()
          ),
        };
      }),
      catchError((error) => {
        console.error('Error fetching transactions:', error);
        console.log('Using fallback mock data');
        // Return mock data if API fails
        return of(this.getMockData());
      })
    );
  }

  getTransactionById(id: number): Observable<Transaction> {
    console.log(
      `Fetching transaction ${id} from: ${this.apiUrl}/transactions/${id}`
    );

    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`).pipe(
      map((transaction) => {
        console.log('Transaction received:', transaction);
        return transaction;
      }),
      catchError((error) => {
        console.error('Error fetching transaction:', error);
        console.log('Using fallback mock data for transaction', id);
        // Return mock transaction if API fails
        const mockData = this.getMockData();
        const transaction = mockData.days
          .flatMap((day) => day.transactions)
          .find((t) => t.id === id);

        if (transaction) {
          return of(transaction);
        }
        throw error;
      })
    );
  }

  private getMockData(): TransactionData {
    return {
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
              description: 'Coffee at Starbucks',
              otherParty: {
                name: 'Starbucks Inc',
                iban: 'NL00RABO0123456789',
              },
            },
            {
              id: 2,
              timestamp: '2022-11-08T09:15:22.456Z',
              amount: -125.5,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Grocery shopping',
              otherParty: {
                name: 'Albert Heijn',
                iban: 'NL91ABNA0417164300',
              },
            },
          ],
        },
        {
          id: '2022-11-07',
          transactions: [
            {
              id: 3,
              timestamp: '2022-11-07T16:45:33.789Z',
              amount: -45.0,
              currencyCode: 'USD',
              currencyRate: 1.173628,
              description: 'Gas station',
              otherParty: {
                name: 'Shell',
                iban: 'NL20INGB0001234567',
              },
            },
            {
              id: 4,
              timestamp: '2022-11-07T12:20:15.321Z',
              amount: 2500.0,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Salary payment',
              otherParty: {
                name: 'Tech Company BV',
                iban: 'NL43RABO0123456789',
              },
            },
          ],
        },
        {
          id: '2022-11-06',
          transactions: [
            {
              id: 5,
              timestamp: '2022-11-06T19:30:45.654Z',
              amount: -89.99,
              currencyCode: 'EUR',
              currencyRate: 1.0,
              description: 'Online shopping',
              otherParty: {
                name: 'Amazon',
                iban: 'NL12BUNQ2025123456',
              },
            },
          ],
        },
      ],
    };
  }

  formatAmount(amount: number, currencyCode: string): string {
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
}
