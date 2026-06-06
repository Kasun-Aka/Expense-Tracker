import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnualExpenses } from './annual-expenses';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AnnualExpenses', () => {
  let component: AnnualExpenses;
  let fixture: ComponentFixture<AnnualExpenses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualExpenses, HttpClientTestingModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnnualExpenses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
