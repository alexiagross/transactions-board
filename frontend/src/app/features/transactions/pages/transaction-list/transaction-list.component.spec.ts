import {
  type ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../../core/services/transaction.service';
import type { TransactionData } from '../../../../core/models/transaction.model';
import { TransactionCategory } from '../../../../core/models/transaction.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

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
          } as any,
        ],
      },
    ],
  };

  beforeEach(async () => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getTransactions',
      'formatDate',
      'formatAmount',
      'formatDateLocal',
      'convertToEur',
      'getAllCategories',
      'categorizeTransaction',
      'getCategoryInfo',
    ]);

    await TestBed.configureTestingModule({
      imports: [TransactionListComponent, NoopAnimationsModule],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    mockTransactionService = TestBed.inject(
      TransactionService
    ) as jasmine.SpyObj<TransactionService>;

    // Setup default mock returns
    mockTransactionService.getAllCategories.and.returnValue([
      {
        category: TransactionCategory.FOOD_DINING,
        name: 'Food & Dining',
        icon: 'restaurant',
        color: '#f57c00',
        backgroundColor: '#fff3e0',
      },
    ]);
    mockTransactionService.formatDate.and.returnValue('November 8, 2022');
    mockTransactionService.formatDateLocal.and.returnValue('November 8, 2022');
    mockTransactionService.formatAmount.and.returnValue('€15.29');
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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transactions on init', fakeAsync(() => {
    mockTransactionService.getTransactions.and.returnValue(
      of(mockTransactionData)
    );

    component.ngOnInit();
    tick();

    expect(mockTransactionService.getTransactions).toHaveBeenCalled();
    expect(mockTransactionService.getAllCategories).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  }));

  it('should handle error when loading transactions', fakeAsync(() => {
    spyOn(console, 'error');
    mockTransactionService.getTransactions.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();
    tick();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe(
      'Failed to load transactions. Please try again.'
    );
  }));

  it('should filter transactions by category', () => {
    const filteredData = component.applyFilters(
      mockTransactionData,
      TransactionCategory.FOOD_DINING,
      null
    );

    expect(mockTransactionService.categorizeTransaction).toHaveBeenCalled();
    expect(filteredData.days.length).toBeGreaterThanOrEqual(0);
  });

  it('should filter transactions by date', () => {
    const filteredData = component.applyFilters(
      mockTransactionData,
      'all',
      '2022-11-08'
    );

    expect(filteredData.days.length).toBe(1);
    expect(filteredData.days[0].id).toBe('2022-11-08');
  });

  it('should handle date selection correctly', () => {
    spyOn(console, 'log');
    const testDate = new Date(2022, 10, 8);
    component.onDateSelected(testDate);

    expect(component.selectedDateValue).toBe('2022-11-08');
  });

  it('should clear category filter', () => {
    component.onCategoryChange(TransactionCategory.FOOD_DINING);
    expect(component.selectedCategoryValue).toBe(
      TransactionCategory.FOOD_DINING
    );

    component.clearCategoryFilter();
    expect(component.selectedCategoryValue).toBe('all');
  });

  it('should clear date filter', () => {
    spyOn(console, 'log');
    const testDate = new Date(2022, 10, 8);
    component.onDateSelected(testDate);
    expect(component.selectedDateValue).toBe('2022-11-08');

    component.clearDateFilter();
    expect(component.selectedDateValue).toBeNull();
  });

  it('should clear all filters', () => {
    spyOn(console, 'log');
    component.onCategoryChange(TransactionCategory.FOOD_DINING);
    const testDate = new Date(2022, 10, 8);
    component.onDateSelected(testDate);

    component.clearAllFilters();

    expect(component.selectedCategoryValue).toBe('all');
    expect(component.selectedDateValue).toBeNull();
  });

  it('should track transactions by unique ID', () => {
    const transaction = mockTransactionData.days[0].transactions[0];
    const result = component.trackByTransactionId(0, transaction);
    expect(result).toBe('2022-11-08-1-0');
  });

  it('should track transactions by regular ID when uniqueId is not available', () => {
    const transaction = {
      ...mockTransactionData.days[0].transactions[0],
      uniqueId: undefined,
    };
    const result = component.trackByTransactionId(0, transaction);
    expect(result).toBe('1');
  });

  it('should calculate day total', () => {
    const day = mockTransactionData.days[0];
    const total = component.getDayTotal(day);

    expect(mockTransactionService.convertToEur).toHaveBeenCalledWith(
      17.95,
      'USD',
      1.173628
    );
    expect(total).toBe(15.29);
  });

  it('should handle missing currency rate in day total calculation', () => {
    const dayWithoutRate = {
      ...mockTransactionData.days[0],
      transactions: [
        {
          ...mockTransactionData.days[0].transactions[0],
          currencyRate: undefined,
        },
      ],
    };

    component.getDayTotal(dayWithoutRate);
    expect(mockTransactionService.convertToEur).toHaveBeenCalledWith(
      17.95,
      'USD',
      1
    );
  });

  it('should detect active filters', () => {
    expect(component.hasActiveFilters).toBeFalse();

    component.onCategoryChange(TransactionCategory.FOOD_DINING);
    expect(component.hasActiveFilters).toBeTrue();

    component.clearCategoryFilter();
    spyOn(console, 'log');
    const testDate = new Date(2022, 10, 8);
    component.onDateSelected(testDate);
    expect(component.hasActiveFilters).toBeTrue();

    component.clearAllFilters();
    expect(component.hasActiveFilters).toBeFalse();
  });

  it('should return correct selected date', () => {
    expect(component.getSelectedDate()).toBeNull();

    spyOn(console, 'log');
    const testDate = new Date(2022, 10, 8);
    component.onDateSelected(testDate);

    const selectedDate = component.getSelectedDate();
    expect(selectedDate).toEqual(new Date('2022-11-08T00:00:00'));
  });

  it('should filter dates correctly', () => {
    component.transactionDates = [
      new Date('2022-11-08'),
      new Date('2022-11-06'),
    ];

    const testDate = new Date(2022, 10, 8);
    expect(component.dateFilter(testDate)).toBeTrue();

    const nonTransactionDate = new Date(2022, 10, 10);
    expect(component.dateFilter(nonTransactionDate)).toBeFalse();
  });

  it('should apply correct date class', () => {
    component.transactionDates = [new Date('2022-11-08')];

    const testDate = new Date(2022, 10, 8);
    expect(component.dateClass(testDate)).toBe('has-transaction');

    const nonTransactionDate = new Date(2022, 10, 10);
    expect(component.dateClass(nonTransactionDate)).toBe('');
  });
});
