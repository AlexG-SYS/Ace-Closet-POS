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
import { TransactionsService } from '../../Service/transactions.service';
import { SnackbarService } from '../../Service/snackbar.service';

@Component({
    selector: 'app-reports',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatSnackBarModule,
        DecimalPipe,
        FormsModule,
        NgxPrintModule,
    ],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;

  showSalesReportBool = false;
  showExpenseReportBool = false;
  showProfitReportBool = false;
  showAssetReportBool = false;

  subTotal = 0;
  discount = 0;
  gst = 0;
  grandTotal = 0;
  totalSales = 0;
  grossProfit = 0;
  totalExpense = 0;
  netProfit = 0;
  totalCost = 0;
  netProfitPercentage = 0;

  reportDateRange = '';

  filterFormInputs = new FormGroup({
    startDate: new FormControl(this.formattedDate),
    endDate: new FormControl(this.formattedDate),
  });

  constructor(
    private invoiceService: InvoicesService,
    private productService: ProductsService,
    private transactionService: TransactionsService,
    private snackbarService: SnackbarService,
    private bankAccountsService: BankAccountsService
  ) {}

  tableSpinner: any;
  activeInvoice: Invoice[] = [];
  activeExpense: Payment[] = [];
  activeProduct: Product[] = [];
  dataSource = new MatTableDataSource(this.activeInvoice);
  dataSourceExpense = new MatTableDataSource(this.activeExpense);
  dataSourceProduct = new MatTableDataSource(this.activeProduct);

  displayedColumnsInv: string[] = [
    'invoiceNum',
    'dateInvoiced',
    'customerName',
    'subTotal',
    'discount',
    'total',
    'gst',
    'invoiceStatus',
  ];

  displayedColumnsExp: string[] = [
    'bankName',
    'type',
    'amount',
    'description',
    'date',
  ];

  displayedColumnsInvProfit: string[] = [
    'invoiceNum',
    'dateInvoiced',
    'customerName',
    'subTotal',
    'discount',
    'total',
  ];

  displayedColumnsExpProfit: string[] = [
    'bankName',
    'date',
    'type',
    'amount',
    'description',
  ];

  displayedColumnsProduct: string[] = [
    'upc',
    'productName',
    'category',
    'price',
    'qty',
    'size',
    'cost',
  ];

  showSalesReport() {
    this.filterFormInputs.patchValue({
      startDate: this.formattedDate,
      endDate: this.formattedDate,
    });
    this.filterFormInputs.value.endDate!;
    this.showExpenseReportBool = false;
    this.showProfitReportBool = false;
    this.showAssetReportBool = false;
    this.showSalesReportBool = true;
    this.reportDateRange = this.formatDate(this.formattedDate);
    this.populateInvoiceTable();
  }

  showExpenseReport() {
    this.filterFormInputs.patchValue({
      startDate: this.formattedDate,
      endDate: this.formattedDate,
    });
    this.showExpenseReportBool = false;
    this.showProfitReportBool = false;
    this.showSalesReportBool = false;
    this.showExpenseReportBool = true;
    this.reportDateRange = this.formatDate(this.formattedDate);
    this.populateExpenseTable();
  }

  showProfitReport() {
    this.filterFormInputs.patchValue({
      startDate: this.formattedDate,
      endDate: this.formattedDate,
    });
    this.showExpenseReportBool = false;
    this.showAssetReportBool = false;
    this.showSalesReportBool = false;
    this.showProfitReportBool = true;
    this.reportDateRange = this.formatDate(this.formattedDate);
    this.populateProfitTable();
  }

  showAssetReport() {
    this.showExpenseReportBool = false;
    this.showProfitReportBool = false;
    this.showSalesReportBool = false;
    this.showAssetReportBool = true;
    this.reportDateRange = this.formatDate(this.formattedDate);
    this.populateAssetTable();
  }

  convertDate(day: number, month: number, year: number): string {
    if (day != undefined && month != undefined && year != undefined) {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      // Ensure day and month are in the correct format (e.g., 01 instead of 1)
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const formattedMonth = months[month - 1]; // Use the month index directly

      if (formattedMonth === undefined) {
        console.log('Invalid month. Please provide a month between 0 and 11.');
      }

      return `${formattedMonth} ${formattedDay}, ${year}`;
    } else {
      return '';
    }
  }

  formatDate(inputDate: string): string {
    if (inputDate != undefined) {
      const [year, month, day] = inputDate.split('-').map(Number);

      // Adjust month to match 0-based index used in convertDate
      return this.convertDate(day, month, year);
    } else {
      return '';
    }
  }

  populateInvoiceTable() {
    this.tableSpinner = true;
    this.invoiceService
      .getInvoicesByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (invoices) => {
        this.activeInvoice = invoices;
        this.calcualteSalesTotals(invoices);
        this.dataSource.data = this.activeInvoice;
        this.tableSpinner = false;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error Retrieving Active Invoices:', error);
      });
  }

  searchInvoiceDateRange() {
    this.tableSpinner = true;
    this.invoiceService
      .getInvoicesByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (invoices) => {
        this.activeInvoice = invoices;
        this.calcualteSalesTotals(invoices);
        this.dataSource.data = this.activeInvoice;
        this.tableSpinner = false;
        this.reportDateRange =
          this.formatDate(this.filterFormInputs.value.startDate!) +
          ' to ' +
          this.formatDate(this.filterFormInputs.value.endDate!);
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error Retrieving Active Invoices:', error);
      });
  }

  calcualteSalesTotals(invoices: Invoice[]) {
    // Reset totals before calculating
    this.subTotal = 0;
    this.discount = 0;
    this.gst = 0;
    this.grandTotal = 0;

    invoices.forEach((invoice) => {
      this.subTotal += invoice.subTotal || 0;
      this.discount += invoice.discount || 0;
      this.gst += invoice.taxTotal || 0;
      this.grandTotal += invoice.grandTotal || 0;
    });
  }

  calcualteExpenseTotals(payments: Payment[]) {
    this.subTotal = 0;
    this.discount = 0;
    this.gst = 0;
    this.grandTotal = 0;

    payments.forEach((payment) => {
      this.grandTotal += payment.amount || 0;
    });
  }

  populateExpenseTable() {
    this.tableSpinner = true;
    this.transactionService
      .getExpenseByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (expense) => {
        expense.forEach((doc) => {
          if (doc.status === 'Voided') {
            doc.amount = 0;
          }
        });
        this.activeExpense = expense;
        this.calcualteExpenseTotals(expense);
        this.dataSourceExpense.data = this.activeExpense;
        this.tableSpinner = false;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Expenses Failed`, 'error');
        console.error('Error Retrieving Expenses:', error);
      });
  }

  searchExpenseDateRange() {
    this.tableSpinner = true;
    this.transactionService
      .getExpenseByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (expense) => {
        expense.forEach((doc) => {
          if (doc.status === 'Voided') {
            doc.amount = 0;
          }
        });

        this.activeExpense = expense;
        this.calcualteExpenseTotals(expense);
        this.dataSourceExpense.data = this.activeExpense;
        this.tableSpinner = false;
        this.reportDateRange =
          this.formatDate(this.filterFormInputs.value.startDate!) +
          ' to ' +
          this.formatDate(this.filterFormInputs.value.endDate!);
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Expense Failed`, 'error');
        console.error('Error Retrieving Expense:', error);
      });
  }

  calcualteProfitTotals(expense: Payment[], invoice: Invoice[]) {
    this.totalSales = 0;
    this.grossProfit = 0;
    this.totalExpense = 0;
    this.netProfit = 0;
    this.totalCost = 0;

    expense.forEach((expense) => {
      this.totalExpense += expense.amount || 0;
    });

    invoice.forEach((invoice) => {
      this.totalSales += invoice.grandTotal || 0;
      invoice.products.forEach((product) => {
        this.totalCost += product.cost * product.quantity;
      });
    });

    this.grossProfit = this.totalSales - this.totalCost;
    this.netProfit = this.grossProfit - this.totalExpense;
    this.netProfitPercentage = (this.netProfit / this.totalCost) * 100 || 0;
  }

  calcualteAssets(products: Product[]) {
    this.grandTotal = 0;
    this.totalCost = 0;
    this.grossProfit = 0;

    products.forEach((product) => {
      this.totalCost += product.cost * product.quantity || 0;
    });

    products.forEach((product) => {
      this.grandTotal += product.price * product.quantity || 0;
    });

    this.grossProfit = this.grandTotal - this.totalCost;
    this.netProfitPercentage = (this.totalCost / this.grandTotal) * 100 || 0;
  }

  populateProfitTable() {
    this.tableSpinner = true;
    this.invoiceService
      .getInvoicesByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (invoices) => {
        this.activeInvoice = invoices;
        this.dataSource.data = this.activeInvoice;

        this.transactionService
          .getExpenseByDateRange(
            this.filterFormInputs.value.startDate!,
            this.filterFormInputs.value.endDate!
          )
          .then(async (expense) => {
            expense.forEach((doc) => {
              if (doc.status === 'Voided') {
                doc.amount = 0;
              }
            });
            this.activeExpense = expense;
            this.dataSourceExpense.data = this.activeExpense;
            this.calcualteProfitTotals(expense, invoices);
          })
          .catch((error) => {
            this.snackbarService.show(`Retrieving Expenses Failed`, 'error');
            console.error('Error Retrieving Expenses:', error);
          });

        this.tableSpinner = false;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error Retrieving Active Invoices:', error);
      });
  }

  searchProfitDateRange() {
    this.tableSpinner = true;
    this.invoiceService
      .getInvoicesByDateRange(
        this.filterFormInputs.value.startDate!,
        this.filterFormInputs.value.endDate!
      )
      .then(async (invoices) => {
        this.activeInvoice = invoices;
        this.dataSource.data = this.activeInvoice;

        this.transactionService
          .getExpenseByDateRange(
            this.filterFormInputs.value.startDate!,
            this.filterFormInputs.value.endDate!
          )
          .then(async (expense) => {
            expense.forEach((doc) => {
              if (doc.status === 'Voided') {
                doc.amount = 0;
              }
            });
            this.activeExpense = expense;
            this.dataSourceExpense.data = this.activeExpense;
            this.calcualteProfitTotals(expense, invoices);
          })
          .catch((error) => {
            this.snackbarService.show(`Retrieving Expenses Failed`, 'error');
            console.error('Error Retrieving Expenses:', error);
          });
        this.reportDateRange =
          this.formatDate(this.filterFormInputs.value.startDate!) +
          ' to ' +
          this.formatDate(this.filterFormInputs.value.endDate!);
        this.tableSpinner = false;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error Retrieving Active Invoices:', error);
      });
  }

  populateAssetTable() {
    this.tableSpinner = true;
    this.productService
      .getProducts('active')
      .then(async (products) => {
        this.activeProduct = products;
        this.dataSourceProduct.data = this.activeProduct;
        this.calcualteAssets(products);
        this.tableSpinner = false;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Products Failed`, 'error');
        console.error('Error Retrieving Active Products:', error);
      });
  }
}
