import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import { InvoicesService } from '../../Service/invoices.service';
import { Invoice } from '../../DataModels/invoiceData.model';
import { UsersService } from '../../Service/users.service';
import { User } from '../../DataModels/userData.model';
import { Product } from '../../DataModels/productData.model';
import { ProductsService } from '../../Service/products.service';
import * as bootstrap from 'bootstrap';
import { NgxPrintModule } from 'ngx-print';
import { Payment } from '../../DataModels/paymentData.model';
import { PaymentsService } from '../../Service/payments.service';
import { BankAccountsService } from '../../Service/bank-accounts.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatSnackBarModule,
    MatPaginatorModule,
    DecimalPipe,
    FormsModule,
    NgxPrintModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;

  reportDateRange = '';

  filterFormInputs = new FormGroup({
    date: new FormControl(this.formattedDate),
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  filterStatus() {
    throw new Error('Method not implemented.');
  }

  modalData: any;
  getCustomersAndItems() {
    throw new Error('Method not implemented.');
  }
  tableSpinner: any;
  displaySmall: any;
  dataSource: any;
  convertDate(arg0: any, arg1: any, arg2: any) {
    throw new Error('Method not implemented.');
  }
  formatDate(arg0: any) {
    throw new Error('Method not implemented.');
  }
  receivePayment(_t147: any) {
    throw new Error('Method not implemented.');
  }
  viewInvoice(_t147: any) {
    throw new Error('Method not implemented.');
  }
  tableRow: any;

  displayedColumns: string[] = [
    'invoiceStatus',
    'invoiceNum',
    'customerName',
    'total',
    'dateInvoiced',
    'balance',
    'dueDate',
    'options',
  ];
}
