import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import(
        './features/transactions/pages/transaction-list/transaction-list.component'
      ).then((m) => m.TransactionListComponent),
  },
  {
    path: 'transaction/:id',
    loadComponent: () =>
      import(
        './features/transactions/pages/transaction-detail/transaction-detail.component'
      ).then((m) => m.TransactionDetailComponent),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
