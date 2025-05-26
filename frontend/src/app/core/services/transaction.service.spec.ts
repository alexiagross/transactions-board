import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import type { Transaction, TransactionData } from '../models/transaction.model';
import { TransactionCategory } from '../models/transaction.model';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionService],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch transactions and add unique IDs', () => {
    service.getTransactions().subscribe((data) => {
      expect(data.days[0].transactions[0]).toEqual(
        jasmine.objectContaining({
          id: 1,
          uniqueId: '2022-11-08-1-0',
          originalId: 1,
        })
      );
    });

    const req = httpMock.expectOne('http://localhost:8080/api/transactions');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransactionData);
  });

  it('should fetch transaction by unique ID from cache', () => {
    // First, populate the cache
    service.getTransactions().subscribe();
    const req1 = httpMock.expectOne('http://localhost:8080/api/transactions');
    req1.flush(mockTransactionData);

    // Then fetch by unique ID
    service.getTransactionById('2022-11-08-1-0').subscribe((transaction) => {
      expect(transaction).toEqual(
        jasmine.objectContaining({
          id: 1,
          uniqueId: '2022-11-08-1-0',
          description: 'Coffee at Starbucks',
        })
      );
    });
  });

  it('should fetch transaction by unique ID when not in cache', () => {
    service.getTransactionById('2022-11-08-1-0').subscribe((transaction) => {
      expect(transaction).toEqual(
        jasmine.objectContaining({
          id: 1,
          uniqueId: '2022-11-08-1-0',
          description: 'Coffee at Starbucks',
        })
      );
    });

    const req = httpMock.expectOne('http://localhost:8080/api/transactions');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransactionData);
  });

  it('should categorize coffee transaction as food & dining', () => {
    const transaction: Transaction = {
      id: 1,
      timestamp: '2022-11-08T14:30:47.123Z',
      amount: -17.95,
      currencyCode: 'USD',
      currencyRate: 1.173628,
      description: 'Coffee at Starbucks',
      otherParty: {
        name: 'Starbucks Inc',
        iban: 'NL00RABO0123456789',
      },
    };

    const category = service.categorizeTransaction(transaction);
    expect(category).toBe(TransactionCategory.FOOD_DINING);
  });

  it('should categorize payday as income', () => {
    const transaction: Transaction = {
      id: 2,
      timestamp: '2022-11-07T12:20:15.321Z',
      amount: 2500.0,
      currencyCode: 'EUR',
      currencyRate: 1.0,
      description: 'Finally payday',
      otherParty: {
        name: 'Company Z',
        iban: 'NL43RABO0123456789',
      },
    };

    const category = service.categorizeTransaction(transaction);
    expect(category).toBe(TransactionCategory.INCOME);
  });

  it('should categorize gym as bills & utilities', () => {
    const transaction: Transaction = {
      id: 3,
      timestamp: '2022-11-06T17:12:47.123Z',
      amount: -38.95,
      currencyCode: 'EUR',
      currencyRate: 1.0,
      description: 'Gym',
      otherParty: {
        name: 'Gym be fit',
        iban: 'NL00RABO0123456789',
      },
    };

    const category = service.categorizeTransaction(transaction);
    expect(category).toBe(TransactionCategory.BILLS_UTILITIES);
  });

  it('should categorize ATM withdrawal as cash', () => {
    const transaction: Transaction = {
      id: 4,
      timestamp: '2022-11-02T12:45:47.123Z',
      amount: -50.0,
      currencyCode: 'EUR',
      currencyRate: 1.0,
      description: 'ATM',
    };

    const category = service.categorizeTransaction(transaction);
    expect(category).toBe(TransactionCategory.CASH_ATM);
  });

  it('should get category info', () => {
    const categoryInfo = service.getCategoryInfo(
      TransactionCategory.FOOD_DINING
    );

    expect(categoryInfo.category).toBe(TransactionCategory.FOOD_DINING);
    expect(categoryInfo.name).toBe('Food & Dining');
    expect(categoryInfo.icon).toBe('restaurant');
    expect(categoryInfo.color).toBe('#f57c00');
  });

  it('should get all categories', () => {
    const categories = service.getAllCategories();

    expect(categories.length).toBeGreaterThan(0);
    expect(
      categories.some((cat) => cat.category === TransactionCategory.FOOD_DINING)
    ).toBeTrue();
    expect(
      categories.some((cat) => cat.category === TransactionCategory.INCOME)
    ).toBeTrue();
  });

  it('should convert USD to EUR', () => {
    const eurAmount = service.convertToEur(17.95, 'USD', 1.173628);
    expect(eurAmount).toBeCloseTo(15.29, 2);
  });

  it('should return same amount for EUR', () => {
    const eurAmount = service.convertToEur(100, 'EUR', 1.0);
    expect(eurAmount).toBe(100);
  });

  it('should handle missing currency rate', () => {
    const eurAmount = service.convertToEur(100, 'EUR');
    expect(eurAmount).toBe(100);
  });

  it('should format amount correctly', () => {
    const formatted = service.formatAmount(17.95, 'USD');
    expect(formatted).toBe('$17.95');
  });

  it('should format date correctly', () => {
    const formatted = service.formatDate('2022-11-08');
    expect(formatted).toBe('November 8, 2022');
  });

  it('should format date locally without timezone issues', () => {
    const formatted = service.formatDateLocal('2022-11-08');
    expect(formatted).toBe('November 8, 2022');
  });

  it('should format time correctly', () => {
    const formatted = service.formatTime('2022-11-08T14:30:47.123Z');
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it('should handle API error and return mock data', () => {
    service.getTransactions().subscribe((data) => {
      expect(data.days.length).toBeGreaterThan(0);
      expect(data.days[0].transactions[0]).toEqual(
        jasmine.objectContaining({
          uniqueId: jasmine.any(String),
          originalId: jasmine.any(Number),
        })
      );
    });

    const req = httpMock.expectOne('http://localhost:8080/api/transactions');
    req.error(new ErrorEvent('Network error'));
  });
});
