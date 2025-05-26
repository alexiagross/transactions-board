import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-card.component.html',
  styleUrls: ['./transaction-card.component.scss'],
})
export class TransactionCardComponent {
  @Input() transaction!: Transaction;

  public transactionService = inject(TransactionService);
  private router = inject(Router);

  navigateToDetail(): void {
    this.router.navigate(['/transaction', this.transaction.id]);
  }
}
