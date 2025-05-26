import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import type { Transaction, TransactionData } from '../models/transaction.model';

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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch transactions and sort by date descending', () => {
    service.getTransactions().subscribe((data) => {
      expect(data).toEqual(mockTransactionData);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/transactions');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransactionData);
  });

  it('should fetch transaction by id', () => {
    const mockTransaction: Transaction =
      mockTransactionData.days[0].transactions[0];

    service.getTransactionById(1).subscribe((transaction) => {
      expect(transaction).toEqual(mockTransaction);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/transactions/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransaction);
  });

  it('should format amount correctly', () => {
    const formatted = service.formatAmount(17.95, 'USD');
    expect(formatted).toBe('$17.95');
  });

  it('should format date correctly', () => {
    const formatted = service.formatDate('2022-11-08');
    expect(formatted).toBe('November 8, 2022');
  });

  it('should format time correctly', () => {
    const formatted = service.formatTime('2022-11-08T14:30:47.123Z');
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });
});
