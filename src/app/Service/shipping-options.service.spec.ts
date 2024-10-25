import { TestBed } from '@angular/core/testing';

import { ShippingOptionsService } from './shipping-options.service';

describe('ShippingOptionsService', () => {
  let service: ShippingOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShippingOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
