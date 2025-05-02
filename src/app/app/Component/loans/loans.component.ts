import { Component } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss',
})
export class LoansComponent {
  modalData: any;
  loanSpinner: any;
  activeLoanAccount: any;
  setloanInfo(arg0: string, _t8: any) {
    throw new Error('Method not implemented.');
  }
  applyFilter($event: KeyboardEvent) {
    throw new Error('Method not implemented.');
  }
  filterFormInputs: any;
  filterLoanAcc() {
    throw new Error('Method not implemented.');
  }
  currentYear: any;
  lastYear: any;
  tableSpinner: any;
  loanForm: any;
  clearNewLoanForm() {
    throw new Error('Method not implemented.');
  }
  loanNameControl: any;
  accountNumberControl: any;
  startingAmountControl: any;
  typeControl: any;
  clearNewloanForm() {
    throw new Error('Method not implemented.');
  }
  isProcessing: any;
  updateloanAccount() {
    throw new Error('Method not implemented.');
  }
  newloanAccount() {
    throw new Error('Method not implemented.');
  }
}
