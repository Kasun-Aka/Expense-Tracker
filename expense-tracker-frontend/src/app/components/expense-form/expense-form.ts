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
      <h2 style="margin-bottom: 2rem;">Verify Expense Data</h2>
      
      <div *ngIf="!receiptData" style="text-align: center; color: var(--danger-color);">
        No receipt data found. Please upload a receipt first.
      </div>
      
      <form *ngIf="receiptData" [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label class="form-label">Merchant Name</label>
          <input type="text" class="form-input" formControlName="merchant" placeholder="e.g. Starbucks">
        </div>
        
        <div class="form-group">
          <label class="form-label">Amount ($)</label>
          <input type="number" class="form-input" formControlName="amount" step="0.01">
        </div>
        
        <div class="form-group">
          <label class="form-label">Date (YYYY-MM-DD)</label>
          <input type="date" class="form-input" formControlName="date">
        </div>
        
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" formControlName="category_id">
            <option value="">Select a category</option>
            <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button type="submit" class="btn-primary" [disabled]="!expenseForm.valid || isSubmitting">
            <span *ngIf="isSubmitting" class="spinner-small"></span>
            Save Expense
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
  
  receiptData: any;
  categories: any[] = [];
  isSubmitting = false;
  
  expenseForm: FormGroup = this.fb.group({
    receipt_id: ['', Validators.required],
    merchant: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0)]],
    date: ['', Validators.required],
    category_id: ['']
  });

  ngOnInit() {
    // Get data passed from the upload component
    const state = this.location.getState() as any;
    this.receiptData = state?.data;
    
    if (this.receiptData) {
      this.populateForm(this.receiptData);
    }
    
    this.loadCategories();
  }
  
  loadCategories() {
    this.api.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  populateForm(data: any) {
    // Simple date formatter if parser returned something
    let dateStr = '';
    if (data.parsed_data.date) {
        // Assume format from OCR is DD/MM/YYYY or something, for now just try passing it if it fits YYYY-MM-DD
        // We will just pass it to the form and let user fix if it fails standard date input (YYYY-MM-DD)
        dateStr = data.parsed_data.date; 
    }
    
    // Fallback date to today if missing
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    this.expenseForm.patchValue({
      receipt_id: data.receipt_id,
      merchant: data.parsed_data.merchant || '',
      amount: data.parsed_data.amount || 0,
      date: dateStr
    });
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      this.isSubmitting = true;
      const formValue = { ...this.expenseForm.value };
      
      // Convert category_id to number if it exists
      if (formValue.category_id) {
        formValue.category_id = Number(formValue.category_id);
      } else {
        formValue.category_id = null;
      }
      
      this.api.saveExpense(formValue).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to save expense', err);
          alert('Error saving expense.');
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/upload']);
  }
}
