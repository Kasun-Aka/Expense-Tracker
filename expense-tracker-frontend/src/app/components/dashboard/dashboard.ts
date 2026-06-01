import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ReceiptOut } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Monthly Expenses</h2>
      <button class="btn-primary" (click)="exportCSV()" [disabled]="expenses.length === 0">
        Export CSV
      </button>
    </div>

    <div class="glass-card" style="margin-bottom: 2rem;">
      <h3 style="color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500;">Total Spending</h3>
      <h1 class="text-gradient" style="font-size: 3rem; font-weight: 700;">
        LKR {{ totalAmount | number:'1.2-2' }}
      </h1>
    </div>

    <!-- Expenses Table -->
    <div class="glass-card" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
      <table class="table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: rgba(0,0,0,0.2); text-align: left;">
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Date</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Merchant</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="expenses.length === 0">
            <td colspan="3" style="padding: 2rem; text-align: center; color: var(--text-muted);">
              No expenses recorded yet.
            </td>
          </tr>
          <tr *ngFor="let expense of expenses" style="border-top: 1px solid var(--glass-border);">
            <td style="padding: 1rem 1.5rem;">{{ expense.date }}</td>
            <td style="padding: 1rem 1.5rem; font-weight: 500;">{{ expense.merchant }}</td>
            <td style="padding: 1rem 1.5rem; color: var(--success-color); font-weight: 600;">\${{ expense.amount | number:'1.2-2' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent Receipts Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Recent Receipts</h2>
    </div>

    <div *ngIf="receipts.length === 0" class="glass-card" style="text-align: center; color: var(--text-muted);">
      No receipts uploaded yet.
    </div>

    <div class="receipts-grid">
      <div *ngFor="let receipt of receipts" class="glass-card receipt-card">
        <div class="receipt-header">
          <h3 style="font-size: 1.1rem; font-weight: 600;">{{ receipt.merchant || 'Unknown Merchant' }}</h3>
          <span class="category-badge" *ngIf="receipt.category">{{ receipt.category }}</span>
        </div>
        
        <div class="receipt-details">
          <div class="receipt-detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value amount">{{ receipt.currency || 'LKR' }} {{ (receipt.amount || 0) | number:'1.2-2' }}</span>
          </div>
          <div class="receipt-detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ receipt.receipt_date || 'N/A' }}</span>
          </div>
        </div>
        
        <div class="receipt-status">
          <span class="status-badge" [class.processed]="receipt.processed" [class.pending]="!receipt.processed">
            {{ receipt.processed ? 'Confirmed' : 'Pending' }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    tr:hover {
      background: rgba(255,255,255,0.02);
    }
    .receipts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .receipt-card {
      padding: 1.5rem;
    }
    .receipt-card:hover {
      border-color: var(--primary-color);
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 0.75rem;
    }
    .category-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.3rem 0.7rem;
      border-radius: 20px;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary-color);
      border: 1px solid rgba(59, 130, 246, 0.3);
      white-space: nowrap;
    }
    .receipt-details {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }
    .receipt-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .detail-value {
      font-size: 0.9rem;
      font-weight: 500;
    }
    .detail-value.amount {
      color: var(--success-color);
      font-weight: 700;
      font-size: 1rem;
    }
    .confidence.high { color: #10b981; }
    .confidence.medium { color: #f59e0b; }
    .confidence.low { color: #ef4444; }
    .receipt-status {
      border-top: 1px solid var(--glass-border);
      padding-top: 1rem;
      display: flex;
      justify-content: flex-end;
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
    }
    .status-badge.processed {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-badge.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
  `]
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  expenses: any[] = [];
  receipts: ReceiptOut[] = [];
  totalAmount = 0;

  ngOnInit() {
    this.api.getExpenses().subscribe({
      next: (data) => {
        this.expenses = data;
        this.totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching expenses', err)
    });

    this.api.getReceipts().subscribe({
      next: (data) => {
        this.receipts = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching receipts', err)
    });
  }

  exportCSV() {
    if (this.expenses.length === 0) return;

    const headers = ['Date', 'Merchant', 'Amount'];
    const rows = this.expenses.map(e => [e.date, e.merchant, e.amount]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
