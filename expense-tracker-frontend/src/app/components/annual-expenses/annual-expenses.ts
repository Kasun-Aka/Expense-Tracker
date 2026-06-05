import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, ReceiptOut } from '../../services/api.service';

@Component({
  selector: 'app-annual-expenses',
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Annual Expenses</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <label style="color: var(--text-muted); font-size: 0.9rem;">Filter by Year:</label>
        <select 
          class="form-input" 
          style="width: 120px; margin: 0; padding: 0.5rem 1rem;" 
          [value]="selectedYear" 
          (change)="onYearChange($event)">
          <option *ngFor="let yr of availableYears" [value]="yr">{{ yr }}</option>
        </select>
      </div>
    </div>

    <!-- Yearly Summary Card -->
    <div class="glass-card" style="margin-bottom: 2rem;">
      <h3 style="color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500;">Spending in {{ selectedYear }} (LKR)</h3>
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
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Category</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Original Amount</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500;">Amount (LKR)</th>
            <th style="padding: 1rem 1.5rem; color: var(--text-muted); font-weight: 500; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="filteredReceipts.length === 0">
            <td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">
              No confirmed expenses for {{ selectedYear }}.
            </td>
          </tr>
          <tr *ngFor="let receipt of filteredReceipts" style="border-top: 1px solid var(--glass-border);">
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
            <td style="padding: 1rem 1.5rem; text-align: right;">
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="editReceipt(receipt)">
                  Edit
                </button>
                <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171;" (click)="deleteReceipt(receipt.id)">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    tr:hover {
      background: rgba(255,255,255,0.02);
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
  `]
})
export class AnnualExpenses implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  allReceipts: ReceiptOut[] = [];
  filteredReceipts: ReceiptOut[] = [];
  availableYears: number[] = [];
  selectedYear = new Date().getFullYear();
  totalAmount = 0;

  ngOnInit() {
    this.loadReceipts();
  }

  loadReceipts() {
    this.api.getReceipts().subscribe({
      next: (data) => {
        this.allReceipts = data.filter(r => r.processed);
        this.updateAvailableYears();
        this.filterExpenses();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching receipts', err)
    });
  }

  updateAvailableYears() {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current year

    this.allReceipts.forEach(r => {
      if (r.receipt_date) {
        const parts = r.receipt_date.split('-');
        if (parts.length > 0) {
          const year = parseInt(parts[0], 10);
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      }
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  onYearChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedYear = parseInt(select.value, 10);
    this.filterExpenses();
  }

  filterExpenses() {
    this.filteredReceipts = this.allReceipts.filter(r => {
      if (!r.receipt_date) return false;
      const parts = r.receipt_date.split('-');
      if (parts.length < 3) return false;
      const year = parseInt(parts[0], 10);
      return year === this.selectedYear;
    });

    this.totalAmount = this.filteredReceipts.reduce((sum, item) => sum + Number(item.amount_LKR || 0), 0);
  }

  editReceipt(receipt: ReceiptOut) {
    this.router.navigate(['/verify'], { state: { data: receipt } });
  }

  deleteReceipt(id: number) {
    if (confirm('Are you sure you want to permanently delete this expense?')) {
      this.api.deleteReceipt(id).subscribe({
        next: () => {
          this.loadReceipts();
        },
        error: (err) => {
          console.error('Failed to delete receipt', err);
          alert('Failed to delete receipt.');
        }
      });
    }
  }
}
