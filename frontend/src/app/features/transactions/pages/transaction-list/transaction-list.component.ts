import { Component, type OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Observable } from 'rxjs';
import type { TransactionData } from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionCardComponent } from '../../components/transaction-card/transaction-card.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, TransactionCardComponent],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  transactionData$!: Observable<TransactionData>;
  loading = false;
  error: string | null = null;

  public transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    this.transactionData$ = this.transactionService.getTransactions();

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

  trackByTransactionId(index: number, transaction: any): number {
    return transaction.id;
  }
}
