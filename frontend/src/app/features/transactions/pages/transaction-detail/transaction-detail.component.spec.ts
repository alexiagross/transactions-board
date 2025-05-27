import {
  type ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject, delay } from 'rxjs';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../../core/services/transaction.service';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionCategory } from '../../../../core/models/transaction.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TransactionDetailComponent', () => {
  let component: TransactionDetailComponent;
  let fixture: ComponentFixture<TransactionDetailComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let routeParamsSubject: BehaviorSubject<any>;

  const mockTransaction: Transaction & {
    uniqueId: string;
    originalId: number;
  } = {
    id: 1,
    uniqueId: '2022-11-08-1-0',
    originalId: 1,
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
      'convertToEur',
      'categorizeTransaction',
      'getCategoryInfo',
    ]);

    routeParamsSubject = new BehaviorSubject({ id: '2022-11-08-1-0' });

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParamsSubject.asObservable(),
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

    // Setup default mock returns
    mockTransactionService.getTransactionById.and.returnValue(
      of(mockTransaction)
    );
    mockTransactionService.formatAmount.and.returnValue('$17.95');
    mockTransactionService.formatDate.and.returnValue('November 8, 2022');
    mockTransactionService.formatTime.and.returnValue('2:30 PM');
    mockTransactionService.convertToEur.and.returnValue(15.29);
    mockTransactionService.categorizeTransaction.and.returnValue(
      TransactionCategory.FOOD_DINING
    );
    mockTransactionService.getCategoryInfo.and.returnValue({
      category: TransactionCategory.FOOD_DINING,
      name: 'Food & Dining',
      icon: 'restaurant',
      color: '#f57c00',
      backgroundColor: '#fff3e0',
    });

    // Suppress console logs for cleaner test output
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transaction on init with unique ID', fakeAsync(() => {
    component.ngOnInit();
    component.transaction$.subscribe();
    tick();

    expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(
      '2022-11-08-1-0'
    );
  }));

  it('should handle error when loading transaction', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      throwError(() => new Error('Not found'))
    );

    component.transactionUniqueId = '2022-11-08-1-0';

    const result = component.loadTransaction();
    result.subscribe({
      next: () => {},
      error: () => {},
    });

    tick();

    expect(component.error).toBe(
      'Failed to load transaction details. Please try again.'
    );
  }));

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should calculate EUR amount correctly', () => {
    const eurAmount = component.getEurAmount(mockTransaction);
    expect(mockTransactionService.convertToEur).toHaveBeenCalledWith(
      17.95,
      'USD',
      1.173628
    );
    expect(eurAmount).toBe(15.29);
  });

  it('should handle missing currency rate', () => {
    const transactionWithoutRate = {
      ...mockTransaction,
      currencyRate: undefined,
    };
    component.getEurAmount(transactionWithoutRate);
    expect(mockTransactionService.convertToEur).toHaveBeenCalledWith(
      17.95,
      'USD',
      1
    );
  });

  it('should get category info', () => {
    const categoryInfo = component.getCategoryInfo(mockTransaction);
    expect(mockTransactionService.categorizeTransaction).toHaveBeenCalledWith(
      mockTransaction
    );
    expect(mockTransactionService.getCategoryInfo).toHaveBeenCalledWith(
      TransactionCategory.FOOD_DINING
    );
    expect(categoryInfo.name).toBe('Food & Dining');
  });

  it('should display transaction details when loaded', fakeAsync(() => {
    component.ngOnInit();
    component.transaction$.subscribe();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.querySelector('h1').textContent).toContain(
      'Transaction Details'
    );
  }));

  it('should show loading state', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      of(mockTransaction).pipe(delay(100))
    );

    component.transactionUniqueId = '2022-11-08-1-0';
    component.loadTransaction().subscribe();

    expect(component.loading).toBe(true);
    expect(component.error).toBe(null);

    tick(100);

    expect(component.loading).toBe(false);
  }));

  it('should show error state', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    component.transactionUniqueId = '2022-11-08-1-0';
    component.loadTransaction().subscribe({
      error: () => {},
    });

    tick();

    expect(component.error).toBe(
      'Failed to load transaction details. Please try again.'
    );
    expect(component.loading).toBe(false);
  }));

  it('should retry loading when retry button is clicked', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      throwError(() => new Error('Test error'))
    );
    component.transactionUniqueId = '2022-11-08-1-0';
    component.loadTransaction().subscribe({ error: () => {} });
    tick();

    expect(component.error).toBe(
      'Failed to load transaction details. Please try again.'
    );

    mockTransactionService.getTransactionById.calls.reset();
    mockTransactionService.getTransactionById.and.returnValue(
      of(mockTransaction)
    );

    component.loadTransaction().subscribe();
    tick();

    expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(
      '2022-11-08-1-0'
    );
    expect(component.error).toBe(null);
  }));

  it('should handle route parameter changes', fakeAsync(() => {
    component.ngOnInit();
    component.transaction$.subscribe();
    tick();

    mockTransactionService.getTransactionById.calls.reset();

    routeParamsSubject.next({ id: '2022-11-07-2-0' });
    tick();

    expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(
      '2022-11-07-2-0'
    );
  }));

  it('should display transaction amount in EUR', fakeAsync(() => {
    component.ngOnInit();
    component.transaction$.subscribe();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const amountElement = compiled.querySelector('.main-amount');

    expect(amountElement).toBeTruthy();
    expect(mockTransactionService.convertToEur).toHaveBeenCalled();
  }));

  it('should display category information', fakeAsync(() => {
    component.ngOnInit();
    component.transaction$.subscribe();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const categoryIcon = compiled.querySelector('.category-icon mat-icon');
    const categoryChip = compiled.querySelector('.category-chip');

    expect(categoryIcon).toBeTruthy();
    expect(categoryChip).toBeTruthy();
    expect(mockTransactionService.categorizeTransaction).toHaveBeenCalled();
    expect(mockTransactionService.getCategoryInfo).toHaveBeenCalled();
  }));

  it('should call loadTransaction method directly', fakeAsync(() => {
    component.transactionUniqueId = '2022-11-08-1-0';

    const result = component.loadTransaction();
    result.subscribe();
    tick();

    expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(
      '2022-11-08-1-0'
    );
    expect(result).toBeDefined();
  }));

  it('should set loading state when loadTransaction is called', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      of(mockTransaction).pipe(delay(50))
    );
    component.transactionUniqueId = '2022-11-08-1-0';

    const result = component.loadTransaction();

    expect(component.loading).toBe(true);
    expect(component.error).toBe(null);

    result.subscribe();
    tick(50);

    expect(component.loading).toBe(false);
  }));

  it('should set error state when loadTransaction fails', fakeAsync(() => {
    mockTransactionService.getTransactionById.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    component.transactionUniqueId = '2022-11-08-1-0';

    const result = component.loadTransaction();
    result.subscribe({
      error: () => {},
    });
    tick();

    expect(component.error).toBe(
      'Failed to load transaction details. Please try again.'
    );
    expect(component.loading).toBe(false);
  }));
});
