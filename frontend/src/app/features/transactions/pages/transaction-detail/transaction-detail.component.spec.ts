import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../../core/services/transaction.service';
import type { Transaction } from '../../../../core/models/transaction.model';

describe('TransactionDetailComponent', () => {
  let component: TransactionDetailComponent;
  let fixture: ComponentFixture<TransactionDetailComponent>;
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
      'getTransactionById',
      'formatAmount',
      'formatDate',
      'formatTime',
    ]);

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTransactionService = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;

    mockTransactionService.getTransactionById.and.returnValue(
      of(mockTransaction)
    );
    mockTransactionService.formatAmount.and.returnValue('$17.95');
    mockTransactionService.formatDate.and.returnValue('November 8, 2022');
    mockTransactionService.formatTime.and.returnValue('2:30 PM');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transaction on init', () => {
    component.ngOnInit();
    expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(1);
  });

  it('should handle error when loading transaction', () => {
    mockTransactionService.getTransactionById.and.returnValue(
      throwError(() => new Error('Not found'))
    );

    component.ngOnInit();

    expect(component.error).toBe(
      'Failed to load transaction details. Please try again.'
    );
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should display transaction details', () => {
    component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain(
      'Transaction Details'
    );
  });
});
