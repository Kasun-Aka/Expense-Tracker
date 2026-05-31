import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

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
        \${{ totalAmount | number:'1.2-2' }}
      </h1>
    </div>

    <div class="glass-card" style="padding: 0; overflow: hidden;">
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
  `,
  styles: [`
    tr:hover {
      background: rgba(255,255,255,0.02);
    }
  `]
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  expenses: any[] = [];
  totalAmount = 0;

  ngOnInit() {
    this.api.getExpenses().subscribe({
      next: (data) => {
        this.expenses = data;
        this.totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);
      },
      error: (err) => console.error('Error fetching expenses', err)
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
