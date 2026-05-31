import { Routes } from '@angular/router';
import { ReceiptUpload } from './components/receipt-upload/receipt-upload';
import { ExpenseForm } from './components/expense-form/expense-form';
import { Dashboard } from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'upload', component: ReceiptUpload },
  { path: 'verify', component: ExpenseForm }
];
