import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { NgxPrintModule } from 'ngx-print';
import { Payment } from '../../DataModels/paymentData.model';
import { PaymentsService } from '../../Service/payments.service';
import { Invoice } from '../../DataModels/invoiceData.model';
import { InvoicesService } from '../../Service/invoices.service';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { UsersService } from '../../Service/users.service';
import { SnackbarService } from '../../Service/snackbar.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-refunds',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    DecimalPipe,
    FormsModule,
    NgxPrintModule,
  ],
  templateUrl: './refunds.component.html',
  styleUrl: './refunds.component.scss',
})
export class RefundsComponent {
  applyFilter($event: KeyboardEvent) {
    throw new Error('Method not implemented.');
  }
  filterFormInputs!: FormGroup<any>;
  filterStatus() {
    throw new Error('Method not implemented.');
  }
  currentYear: any;
  lastYear: any;
  processRefund() {
    throw new Error('Method not implemented.');
  }
  tableSpinner: any;
  dataSource = new MatTableDataSource();

  convertDate(arg0: any, arg1: any, arg2: any) {
    throw new Error('Method not implemented.');
  }
  refundInfoPopulate(_t201: any) {
    throw new Error('Method not implemented.');
  }
  displayedColumns: any;
  tableRow!: number;
  clearRefundForm() {
    throw new Error('Method not implemented.');
  }
  searchInvoiceForRefundInput!: FormGroup<any>;
  findInvoice() {
    throw new Error('Method not implemented.');
  }
  refundData: any;
  formatDate(arg0: any) {
    throw new Error('Method not implemented.');
  }
  refundFormInputs!: FormGroup<any>;
  bankAccounts: any;
  isProcessing: any;
  refundSubmit() {
    throw new Error('Method not implemented.');
  }
  recRefundData: any;
}
