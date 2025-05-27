import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './transaction-card.component.html',
  styleUrls: ['./transaction-card.component.scss'],
})
export class TransactionCardComponent {
  @Input() transaction!: Transaction & { uniqueId?: string };

  public transactionService = inject(TransactionService);
  private router = inject(Router);

  get eurAmount(): number {
    return this.transactionService.convertToEur(
      this.transaction.amount,
      this.transaction.currencyCode,
      this.transaction.currencyRate || 1
    );
  }

  get displayName(): string {
    return this.transaction.otherParty?.name || this.transaction.description;
  }

  navigateToDetail(): void {
    // Use uniqueId if available, otherwise fall back to regular id
    const id = this.transaction.uniqueId || this.transaction.id.toString();
    console.log('Navigating to transaction detail with id:', id);
    this.router.navigate(['/transaction', id]);
  }
}
