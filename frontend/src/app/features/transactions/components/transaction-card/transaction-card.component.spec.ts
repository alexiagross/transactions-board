import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TransactionCardComponent } from './transaction-card.component';
import { TransactionService } from '../../../../core/services/transaction.service';
import type { Transaction } from '../../../../core/models/transaction.model';

describe('TransactionCardComponent', () => {
  let component: TransactionCardComponent;
  let fixture: ComponentFixture<TransactionCardComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;

  const mockTransaction: Transaction = {
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
  };

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'formatAmount',
      'formatTime',
    ]);

    await TestBed.configureTestingModule({
      imports: [TransactionCardComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionCardComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTransactionService = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;

    component.transaction = mockTransaction;
    mockTransactionService.formatAmount.and.returnValue('$17.95');
    mockTransactionService.formatTime.and.returnValue('2:30 PM');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display transaction information', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.other-party').textContent).toContain(
      'Starbucks Inc'
    );
    expect(compiled.querySelector('.description').textContent).toContain(
      'Coffee at Starbucks'
    );
    expect(compiled.querySelector('.iban').textContent).toContain(
      'NL00RABO0123456789'
    );
  });

  it('should navigate to detail page when clicked', () => {
    component.navigateToDetail();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/transaction', 1]);
  });

  it('should apply positive class for positive amounts', () => {
    fixture.detectChanges();
    const amountElement = fixture.nativeElement.querySelector(
      '.transaction-amount'
    );
    expect(amountElement.classList).toContain('positive');
  });

  it('should apply negative class for negative amounts', () => {
    component.transaction = { ...mockTransaction, amount: -17.95 };
    fixture.detectChanges();
    const amountElement = fixture.nativeElement.querySelector(
      '.transaction-amount'
    );
    expect(amountElement.classList).toContain('negative');
  });
});
