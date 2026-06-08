import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="glass-card" style="border-radius: 0; padding: 1rem 2rem; display: flex; gap: 2rem; align-items: center; margin-bottom: 2rem;">
      <h1 class="text-gradient" style="font-size: 1.5rem; font-weight: 700; margin-right: auto;">Expense Tracker</h1>
      
      <a class="nav-link" routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
      <a class="nav-link" routerLink="/annual" routerLinkActive="active-link">Annual Expenses</a>
      
      <div class="dropdown">
        <button class="nav-link dropdown-btn">Add New Expense ▼</button>
        
        <div class="dropdown-content glass-card">
          <a class="nav-link dropdown-item" routerLink="/manual" routerLinkActive="active-link">Add Manually</a>
          <a class="nav-link dropdown-item" routerLink="/upload" routerLinkActive="active-link">Add via Receipt</a>
        </div>
      </div>
    </nav>

    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    nav.glass-card:hover {
      transform: none;
    }
    .nav-link {
      color: var(--text-main);
      text-decoration: none;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      padding-bottom: 2px;
      transition: all 0.2s ease;
    }
    .active-link {
      color: var(--primary-color) !important;
      border-bottom: 2px solid var(--primary-color);
    }

    /* --- Dropdown Styles --- */
    .dropdown {
      position: relative;
      display: inline-block;
    }
    
    .dropdown-btn {
      background: none;
      border: none;
      font-family: inherit;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    
    .dropdown-content {
      display: none;
      transform: none;
      position: absolute;
      top: 15%;
      left: 0;
      min-width: 160px;
      flex-direction: column;
      border: none;
      gap: 1rem;
      padding: 1.5rem 1rem;
      z-index: 100;
      margin-top: 1rem; /* Creates a small gap below the nav */
    }
    
    /* Reveal the dropdown on hover */
    .dropdown:hover .dropdown-content {
      display: flex;
    }
    
    /* Prevent the active bottom border from stretching across the whole card */
    .dropdown-item {
      width: fit-content;
    }
  `]
})
export class App {
  title = 'expense-tracker';
}