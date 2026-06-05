import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-expense-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="glass-card form-container">
      <h2 style="margin-bottom: 0.5rem;">{{ isEditMode ? 'Edit Expense' : 'Verify Expense Data' }}</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">
        {{ isEditMode ? 'Modify and save the expense details.' : 'Review and confirm the AI-extracted data below.' }}
      </p>
      
      <div *ngIf="!receiptData" style="text-align: center; color: var(--danger-color);">
        No receipt data found. Please upload a receipt first.
      </div>

      <!-- AI Confidence Badge (Only for verification, hide in edit mode since confidence score is not relevant post-confirmation) -->
      <div *ngIf="receiptData && receiptData.confidence_score !== null && !isEditMode" class="confidence-bar">
        <div class="confidence-label">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <span>AI Confidence</span>
        </div>
        <div class="confidence-track">
          <div 
            class="confidence-fill" 
            [style.width.%]="(receiptData.confidence_score || 0) * 100"
            [class.high]="(receiptData.confidence_score || 0) >= 0.8"
            [class.medium]="(receiptData.confidence_score || 0) >= 0.5 && (receiptData.confidence_score || 0) < 0.8"
            [class.low]="(receiptData.confidence_score || 0) < 0.5">
          </div>
        </div>
        <span class="confidence-value" 
          [class.high]="(receiptData.confidence_score || 0) >= 0.8"
          [class.medium]="(receiptData.confidence_score || 0) >= 0.5 && (receiptData.confidence_score || 0) < 0.8"
          [class.low]="(receiptData.confidence_score || 0) < 0.5">
          {{ ((receiptData.confidence_score || 0) * 100).toFixed(0) }}%
        </span>
      </div>
      
      <form *ngIf="receiptData" [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
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
          <span *ngIf="receiptData.category && !isEditMode" style="font-size: 0.8rem; color: var(--primary-color); margin-top: 0.25rem;">
            AI suggested: {{ receiptData.category }}
          </span>
        </div>

        <!-- Line Items Display -->
        <div class="form-group" *ngIf="receiptData.line_items">
          <label class="form-label">Extracted Items</label>
          <textarea 
            class="form-input line-items-area" 
            formControlName="line_items"
            rows="5"
            placeholder="Items extracted from receipt...">
          </textarea>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            You can edit the items above if needed.
          </span>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button type="submit" class="btn-primary" [disabled]="!expenseForm.valid || isSubmitting">
            <span *ngIf="isSubmitting" class="spinner-small"></span>
            {{ isEditMode ? 'Update Expense' : 'Confirm Data' }}
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
    .confidence-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      padding: 1rem 1.25rem;
      background: rgba(15, 23, 42, 0.4);
      border-radius: var(--radius-md);
      border: 1px solid var(--glass-border);
    }
    .confidence-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .confidence-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .confidence-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .confidence-fill.high { background: linear-gradient(90deg, #10b981, #34d399); }
    .confidence-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .confidence-fill.low { background: linear-gradient(90deg, #ef4444, #f87171); }
    .confidence-value {
      font-weight: 700;
      font-size: 0.95rem;
      min-width: 3rem;
      text-align: right;
    }
    .confidence-value.high { color: #10b981; }
    .confidence-value.medium { color: #f59e0b; }
    .confidence-value.low { color: #ef4444; }
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
export class ExpenseForm implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private location = inject(Location);
  
  receiptData: any = null; // Can be ReceiptUploadResponse or ReceiptOut
  suggestedCategories: string[] = ['Groceries', 'Transport', 'Dining', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Travel'];
  isSubmitting = false;
  isEditMode = false;
  
  expenseForm: FormGroup = this.fb.group({
    merchant: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0)]],
    currency: ['LKR', Validators.required],
    receipt_date: ['', Validators.required],
    category: ['', Validators.required],
    line_items: ['']
  });

  ngOnInit() {
    // Get data passed from the upload component or annual expenses page
    const state = this.location.getState() as any;
    this.receiptData = state?.data;
    
    if (this.receiptData) {
      this.isEditMode = this.receiptData.processed === true;
      this.populateForm(this.receiptData);
    }
  }

  populateForm(data: any) {
    // Use AI-extracted date or receipt date, fallback to today
    let dateStr = data.date || data.receipt_date || '';
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    this.expenseForm.patchValue({
      merchant: data.merchant || '',
      amount: data.amount || 0,
      currency: data.currency || 'LKR',
      receipt_date: dateStr,
      category: data.category || '',
      line_items: data.line_items || ''
    });
  }

  onSubmit() {
    if (this.expenseForm.valid && this.receiptData) {
      this.isSubmitting = true;
      const formValue = { ...this.expenseForm.value };
      const id = this.receiptData.receipt_id || this.receiptData.id;
      
      const request$ = this.isEditMode
        ? this.api.updateReceipt(id, formValue)
        : this.api.confirmReceipt(id, formValue);

      request$.subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate([this.isEditMode ? '/annual' : '/dashboard']);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error(this.isEditMode ? 'Failed to update receipt' : 'Failed to confirm receipt', err);
          alert('Error saving data.');
        }
      });
    }
  }

  cancel() {
    if (this.isEditMode) {
      this.router.navigate(['/annual']);
    } else {
      this.router.navigate(['/upload']);
    }
  }
}
