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

  const mockTransaction: Transaction & { uniqueId: string } = {
    id: 1,
    uniqueId: '2022-11-08-1-0',
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
      'convertToEur',
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
    mockTransactionService.formatAmount.and.returnValue('€15.29');
    mockTransactionService.convertToEur.and.returnValue(15.29);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display party name when otherParty exists', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.party-name').textContent.trim()).toBe(
      'Starbucks Inc'
    );
  });

  it('should display description when no otherParty', () => {
    component.transaction = { ...mockTransaction, otherParty: undefined };
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.party-name').textContent.trim()).toBe(
      'Coffee at Starbucks'
    );
  });

  it('should display EUR amount', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    expect(
      compiled.querySelector('.transaction-amount').textContent.trim()
    ).toBe('€15.29');
    expect(mockTransactionService.formatAmount).toHaveBeenCalledWith(
      15.29,
      'EUR'
    );
  });

  it('should navigate to detail page with unique ID when clicked', () => {
    component.navigateToDetail();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/transaction',
      '2022-11-08-1-0',
    ]);
  });

  it('should navigate with regular ID when uniqueId is not available', () => {
    component.transaction = { ...mockTransaction, uniqueId: undefined };
    component.navigateToDetail();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/transaction', '1']);
  });

  it('should show positive arrow for positive amounts', () => {
    fixture.detectChanges();
    const iconElement = fixture.nativeElement.querySelector(
      '.transaction-icon mat-icon'
    );
    expect(iconElement.textContent.trim()).toBe('arrow_upward');
  });

  it('should show negative arrow for negative amounts', () => {
    component.transaction = { ...mockTransaction, amount: -17.95 };
    mockTransactionService.convertToEur.and.returnValue(-15.29);
    fixture.detectChanges();

    const iconElement = fixture.nativeElement.querySelector(
      '.transaction-icon mat-icon'
    );
    expect(iconElement.textContent.trim()).toBe('arrow_downward');
  });

  it('should apply positive class for positive amounts', () => {
    fixture.detectChanges();
    const iconElement =
      fixture.nativeElement.querySelector('.transaction-icon');
    const amountElement = fixture.nativeElement.querySelector(
      '.transaction-amount'
    );

    expect(iconElement.classList).toContain('positive');
    expect(amountElement.classList).toContain('positive');
  });

  it('should apply negative class for negative amounts', () => {
    component.transaction = { ...mockTransaction, amount: -17.95 };
    mockTransactionService.convertToEur.and.returnValue(-15.29);
    fixture.detectChanges();

    const iconElement =
      fixture.nativeElement.querySelector('.transaction-icon');
    const amountElement = fixture.nativeElement.querySelector(
      '.transaction-amount'
    );

    expect(iconElement.classList).toContain('negative');
    expect(amountElement.classList).toContain('negative');
  });

  it('should handle missing currency rate', () => {
    component.transaction = { ...mockTransaction, currencyRate: undefined };
    const eurAmount = component.eurAmount;
    expect(mockTransactionService.convertToEur).toHaveBeenCalledWith(
      17.95,
      'USD',
      1
    );
  });
});
