import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptUpload } from './receipt-upload';

describe('ReceiptUpload', () => {
  let component: ReceiptUpload;
  let fixture: ComponentFixture<ReceiptUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
