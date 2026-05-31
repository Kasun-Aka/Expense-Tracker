import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="glass-card" style="border-radius: 0; padding: 1rem 2rem; display: flex; gap: 2rem; align-items: center; margin-bottom: 2rem;">
      <h1 class="text-gradient" style="font-size: 1.5rem; font-weight: 700; margin-right: auto;">Expense AI</h1>
      <a routerLink="/dashboard" routerLinkActive="active-link" style="color: var(--text-main); text-decoration: none; font-weight: 500;">Dashboard</a>
      <a routerLink="/upload" routerLinkActive="active-link" style="color: var(--text-main); text-decoration: none; font-weight: 500;">Upload Receipt</a>
    </nav>

    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .active-link {
      color: var(--primary-color) !important;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 2px;
    }
  `]
})
export class App {
  title = 'expense-tracker';
}
