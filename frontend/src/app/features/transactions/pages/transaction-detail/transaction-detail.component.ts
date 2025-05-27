import {
  Component,
  type OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { type Observable, switchMap, finalize } from 'rxjs';
import type {
  Transaction,
  TransactionCategoryInfo,
} from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss'],
})
export class TransactionDetailComponent implements OnInit {
  transaction$!: Observable<Transaction>;
  loading = false;
  error: string | null = null;
  public transactionUniqueId!: string;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.transaction$ = this.route.params.pipe(
      switchMap((params) => {
        this.transactionUniqueId = params['id'];
        console.log(
          'Loading transaction with uniqueId:',
          this.transactionUniqueId
        );
        return this.loadTransaction();
      })
    );
  }

  loadTransaction(): Observable<Transaction> {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const transaction$ = this.transactionService
      .getTransactionById(this.transactionUniqueId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      );

    transaction$.subscribe({
      next: (transaction) => {
        console.log('Transaction loaded successfully:', transaction);
      },
      error: (err) => {
        this.error = 'Failed to load transaction details. Please try again.';
        console.error('Error loading transaction:', err);
        this.cdr.detectChanges();
      },
    });

    return transaction$;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getEurAmount(transaction: Transaction): number {
    return this.transactionService.convertToEur(
      transaction.amount,
      transaction.currencyCode,
      transaction.currencyRate || 1
    );
  }

  getCategoryInfo(transaction: Transaction): TransactionCategoryInfo {
    const category = this.transactionService.categorizeTransaction(transaction);
    return this.transactionService.getCategoryInfo(category);
  }
}
