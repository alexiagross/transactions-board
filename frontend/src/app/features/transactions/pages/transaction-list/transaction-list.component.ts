import { Component, type OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { type Observable, map, BehaviorSubject, combineLatest } from 'rxjs';
import type {
  TransactionData,
  TransactionDay,
  TransactionCategory,
  TransactionCategoryInfo,
} from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionCardComponent } from '../../components/transaction-card/transaction-card.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    TransactionCardComponent,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  transactionData$!: Observable<TransactionData>;
  filteredData$!: Observable<TransactionData>;
  loading = false;
  error: string | null = null;

  private selectedCategorySubject = new BehaviorSubject<
    TransactionCategory | 'all'
  >('all');
  private selectedDateSubject = new BehaviorSubject<string | null>(null);

  selectedCategory$ = this.selectedCategorySubject.asObservable();
  selectedDate$ = this.selectedDateSubject.asObservable();

  categories: TransactionCategoryInfo[] = [];
  transactionDates: Date[] = [];

  public transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.categories = this.transactionService.getAllCategories();
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    this.transactionData$ = this.transactionService.getTransactions().pipe(
      map((data) => {
        this.transactionDates = data.days.map((day) => new Date(day.id));
        return data;
      })
    );

    this.filteredData$ = combineLatest([
      this.transactionData$,
      this.selectedCategory$,
      this.selectedDate$,
    ]).pipe(
      map(([data, category, date]) => this.applyFilters(data, category, date))
    );

    this.transactionData$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load transactions. Please try again.';
        console.error('Error loading transactions:', err);
      },
    });
  }

  applyFilters(
    data: TransactionData,
    category: TransactionCategory | 'all',
    date: string | null
  ): TransactionData {
    let filteredDays = data.days;

    if (category !== 'all') {
      filteredDays = filteredDays
        .map((day) => ({
          ...day,
          transactions: day.transactions.filter(
            (transaction) =>
              this.transactionService.categorizeTransaction(transaction) ===
              category
          ),
        }))
        .filter((day) => day.transactions.length > 0);
    }

    if (date) {
      filteredDays = filteredDays.filter((day) => day.id === date);
    }

    return {
      ...data,
      days: filteredDays,
    };
  }

  onCategoryChange(category: TransactionCategory | 'all'): void {
    this.selectedCategorySubject.next(category);
  }

  onDateSelected(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    console.log('Date selected:', date, 'Formatted as:', dateString);
    this.selectedDateSubject.next(dateString);

    setTimeout(() => {
      const element = document.getElementById(`day-${dateString}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  clearDateFilter(): void {
    this.selectedDateSubject.next(null);
  }

  clearCategoryFilter(): void {
    this.selectedCategorySubject.next('all');
  }

  clearAllFilters(): void {
    this.selectedCategorySubject.next('all');
    this.selectedDateSubject.next(null);
  }

  getSelectedDate(): Date | null {
    return this.selectedDateValue
      ? new Date(this.selectedDateValue + 'T00:00:00')
      : null;
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return this.transactionDates.some((transactionDate) => {
      const tYear = transactionDate.getFullYear();
      const tMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const tDay = String(transactionDate.getDate()).padStart(2, '0');
      const tDateString = `${tYear}-${tMonth}-${tDay}`;
      return tDateString === dateString;
    });
  };

  dateClass = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const hasTransaction = this.transactionDates.some((transactionDate) => {
      const tYear = transactionDate.getFullYear();
      const tMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const tDay = String(transactionDate.getDate()).padStart(2, '0');
      const tDateString = `${tYear}-${tMonth}-${tDay}`;
      return tDateString === dateString;
    });

    return hasTransaction ? 'has-transaction' : '';
  };

  trackByTransactionId(index: number, transaction: any): string {
    return transaction.uniqueId || transaction.id.toString();
  }

  getDayTotal(day: TransactionDay): number {
    return day.transactions.reduce((total, transaction) => {
      return (
        total +
        this.transactionService.convertToEur(
          transaction.amount,
          transaction.currencyCode,
          transaction.currencyRate || 1
        )
      );
    }, 0);
  }

  getCategoryInfo(category: TransactionCategory): TransactionCategoryInfo {
    return this.transactionService.getCategoryInfo(category);
  }

  get selectedCategoryValue(): TransactionCategory | 'all' {
    return this.selectedCategorySubject.value;
  }

  get selectedDateValue(): string | null {
    return this.selectedDateSubject.value;
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedCategoryValue !== 'all' || this.selectedDateValue !== null
    );
  }
}
