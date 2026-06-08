import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, ReceiptOut } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Annual Expenses ({{ currentYear }})</h2>
      <button class="btn-primary" (click)="exportCSV()" [disabled]="currentYearReceipts.length === 0">
        Export CSV
      </button>
    </div>

    <div class="glass-card" style="margin-bottom: 2rem;">
      <h3 style="color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500;">Total Spending (LKR)</h3>
      <h1 class="text-gradient" style="font-size: 3rem; font-weight: 700;">
        LKR {{ totalAmount | number:'1.2-2' }}
      </h1>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Monthly Expenses ({{ currentMonthName }})</h2>
      <h3 style="color: var(--success-color); font-weight: 700; margin: 0;">
        LKR {{ currentMonthTotal | number:'1.2-2' }}
      </h3>
    </div>

    <!-- Expenses Table (Confirmed Receipts) -->
    <div class="glass-card" style="padding: 0; overflow: hidden; margin-bottom: 2rem;">
      <table class="table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: rgba(0,0,0,0.2); text-align: left;">
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Date</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Merchant</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Category</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Original Amount</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Amount (LKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="currentMonthReceipts.length === 0">
            <td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-muted);">
              No confirmed expenses for this month.
            </td>
          </tr>
          <tr *ngFor="let receipt of currentMonthReceipts" 
              style="border-top: 1px solid var(--glass-border); cursor: pointer;"
              (click)="viewReceiptDetails(receipt)">
            <td style="padding: 1rem 1.5rem;">{{ receipt.receipt_date }}</td>
            <td style="padding: 1rem 1.5rem; font-weight: 500;">{{ receipt.merchant }}</td>
            <td style="padding: 1rem 1.5rem;">
              <span class="category-badge">{{ receipt.category || 'N/A' }}</span>
            </td>
            <td style="padding: 1rem 1.5rem; color: var(--text-muted);">
              {{ receipt.currency }} {{ receipt.amount | number:'1.2-2' }}
            </td>
            <td style="padding: 1rem 1.5rem; color: var(--success-color); font-weight: 600;">
              LKR {{ receipt.amount_LKR | number:'1.2-2' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pending Receipts Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Pending Receipts</h2>
    </div>

    <div *ngIf="pendingReceipts.length === 0" class="glass-card" style="text-align: center; color: var(--text-muted);">
      No pending receipts. You are all caught up!
    </div>

    <div class="receipts-grid">
      <div *ngFor="let receipt of pendingReceipts" class="glass-card receipt-card">
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
          <span class="status-badge pending">Pending</span>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div *ngIf="selectedReceipt" class="modal-overlay" (click)="closeModal()">
      <div class="glass-card modal-content" (click)="$event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0;">Expense Details</h2>
          <button style="background: none; border: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer;" (click)="closeModal()">&times;</button>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Merchant</span>
            <span class="detail-value" style="font-size: 1.1rem;">{{ selectedReceipt.merchant }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ selectedReceipt.receipt_date }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="category-badge" style="display: inline-block; width: fit-content; margin-top: 0.25rem;">{{ selectedReceipt.category || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Original Amount</span>
            <span class="detail-value">{{ selectedReceipt.currency }} {{ selectedReceipt.amount | number:'1.2-2' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Amount (LKR)</span>
            <span class="detail-value amount">LKR {{ selectedReceipt.amount_LKR | number:'1.2-2' }}</span>
          </div>
        </div>

        <div *ngIf="selectedReceipt.line_items" style="margin-top: 1.5rem;">
          <span class="detail-label">Line Items</span>
          <div class="line-items-box">
            <pre style="margin: 0; font-family: 'Inter', monospace; white-space: pre-wrap;">{{ selectedReceipt.line_items }}</pre>
          </div>
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
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .line-items-box {
      margin-top: 0.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
      border: 1px solid var(--glass-border);
      font-size: 0.9rem;
    }
  `]
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  confirmedReceipts: ReceiptOut[] = [];
  pendingReceipts: ReceiptOut[] = [];
  currentYearReceipts: ReceiptOut[] = [];
  currentMonthReceipts: ReceiptOut[] = [];
  totalAmount = 0;
  currentYear = new Date().getFullYear();
  currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  currentMonthTotal = 0;
  
  selectedReceipt: ReceiptOut | null = null;

  ngOnInit() {
    this.api.getReceipts().subscribe({
      next: (data) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        this.confirmedReceipts = data.filter(r => r.processed);
        this.pendingReceipts = data.filter(r => !r.processed);

        // Filter for current year
        this.currentYearReceipts = this.confirmedReceipts.filter(r => {
          if (!r.receipt_date) return false;
          const parts = r.receipt_date.split('-');
          if (parts.length < 3) return false;
          const year = parseInt(parts[0], 10);
          return year === currentYear;
        });

        // Filter for current month of the current year
        this.currentMonthReceipts = this.confirmedReceipts.filter(r => {
          if (!r.receipt_date) return false;
          const parts = r.receipt_date.split('-');
          if (parts.length < 3) return false;
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          return year === currentYear && month === currentMonth;
        });

        this.currentMonthTotal = this.currentMonthReceipts.reduce((sum, item) => sum + Number(item.amount_LKR || 0), 0);

        this.totalAmount = this.currentYearReceipts.reduce((sum, item) => sum + Number(item.amount_LKR || 0), 0);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching receipts', err)
    });
  }

  exportCSV() {
    if (this.currentYearReceipts.length === 0) return;

    const headers = ['Date', 'Merchant', 'Category', 'Original Amount', 'Currency', 'Amount LKR'];
    const rows = this.currentYearReceipts.map(e => [
      e.receipt_date,
      e.merchant,
      e.category,
      e.amount,
      e.currency,
      e.amount_LKR
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_${this.currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  viewReceiptDetails(receipt: ReceiptOut) {
    this.selectedReceipt = receipt;
  }

  closeModal() {
    this.selectedReceipt = null;
  }
}
