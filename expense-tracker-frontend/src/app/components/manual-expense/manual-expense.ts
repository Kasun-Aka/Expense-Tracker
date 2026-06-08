import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-manual-expense',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="glass-card form-container">
      <h2 style="margin-bottom: 0.5rem;">Manual Expense Entry</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">
        Enter your expense details below.
      </p>
      
      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Merchant Name</label>
          <input type="text" class="form-input" formControlName="merchant" placeholder="e.g. Keells, Cargills">
        </div>
        
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Amount</label>
            <input type="number" class="form-input" formControlName="amount" step="0.01">
          </div>
          <div class="form-group" style="flex: 0 0 120px;">
            <label class="form-label">Currency</label>
            <select class="form-input" formControlName="currency">
              <option value="LKR">LKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" formControlName="receipt_date">
        </div>
        
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" list="category_suggestions" class="form-input" formControlName="category" placeholder="Enter or select category">
          <datalist id="category_suggestions">
            <option *ngFor="let cat of suggestedCategories" [value]="cat"></option>
          </datalist>
        </div>

        <div class="form-group">
          <label class="form-label">Line Items (Optional)</label>
          <textarea 
            class="form-input line-items-area" 
            formControlName="line_items"
            rows="5"
            placeholder="Item 1 x2 - 50.00&#10;Item 2 - 100.00">
          </textarea>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            List items included in this expense if needed.
          </span>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button type="submit" class="btn-primary" [disabled]="!expenseForm.valid || isSubmitting">
            <span *ngIf="isSubmitting" class="spinner-small"></span>
            Add Expense
          </button>
          <button type="button" class="btn-primary" style="background-color: transparent; border: 1px solid var(--glass-border);" (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 2rem auto;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .line-items-area {
      font-family: 'Inter', monospace;
      font-size: 0.85rem;
      line-height: 1.6;
      resize: vertical;
      min-height: 100px;
    }
    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-left-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ManualExpense {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  suggestedCategories: string[] = ['Groceries', 'Transport', 'Dining', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Travel'];
  isSubmitting = false;
  
  expenseForm: FormGroup = this.fb.group({
    merchant: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0)]],
    currency: ['LKR', Validators.required],
    receipt_date: [new Date().toISOString().split('T')[0], Validators.required],
    category: ['', Validators.required],
    line_items: ['']
  });

  onSubmit() {
    if (this.expenseForm.valid) {
      this.isSubmitting = true;
      const formValue = { ...this.expenseForm.value };
      
      this.api.addManualReceipt(formValue).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to add manual expense', err);
          alert('Error saving data.');
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
