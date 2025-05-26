import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../../core/services/transaction.service';
import type { TransactionData } from '../../../../core/models/transaction.model';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;

  const mockTransactionData: TransactionData = {
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
        ],
      },
    ],
  };

  beforeEach(async () => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getTransactions',
      'formatDate',
    ]);

    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    mockTransactionService = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transactions on init', () => {
    mockTransactionService.getTransactions.and.returnValue(
      of(mockTransactionData)
    );
    mockTransactionService.formatDate.and.returnValue('November 8, 2022');

    component.ngOnInit();

    expect(mockTransactionService.getTransactions).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading transactions', () => {
    mockTransactionService.getTransactions.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe(
      'Failed to load transactions. Please try again.'
    );
  });

  it('should track transactions by id', () => {
    const transaction = mockTransactionData.days[0].transactions[0];
    const result = component.trackByTransactionId(0, transaction);
    expect(result).toBe(1);
  });
});
