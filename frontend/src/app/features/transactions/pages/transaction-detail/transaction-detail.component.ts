import { Component, type OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { type Observable, switchMap } from 'rxjs';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss'],
})
export class TransactionDetailComponent implements OnInit {
  transaction$!: Observable<Transaction>;
  loading = false;
  error: string | null = null;
  private transactionId!: number;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.transaction$ = this.route.params.pipe(
      switchMap((params) => {
        this.transactionId = +params['id'];
        return this.loadTransaction();
      })
    );
  }

  loadTransaction(): Observable<Transaction> {
    this.loading = true;
    this.error = null;

    const transaction$ = this.transactionService.getTransactionById(
      this.transactionId
    );

    transaction$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load transaction details. Please try again.';
        console.error('Error loading transaction:', err);
      },
    });

    return transaction$;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
