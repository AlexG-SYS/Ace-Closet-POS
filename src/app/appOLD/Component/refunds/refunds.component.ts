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
import { RefundsService } from '../../Service/refunds.service';
import { Refund } from '../../DataModels/refundData.model';
import { Product } from '../../DataModels/productData.model';

@Component({
    selector: 'app-refunds',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        DecimalPipe,
        FormsModule,
        NgxPrintModule,
    ],
    templateUrl: './refunds.component.html',
    styleUrl: './refunds.component.scss'
})
export class RefundsComponent implements AfterViewInit, OnInit {
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');

  filterFormInputs = new FormGroup({
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  refundFormInputs = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(1)]),
    date: new FormControl(this.formattedDate),
  });

  searchInvoiceForRefundInput = new FormGroup({
    invoiceNumber: new FormControl(''),
  });

  tableSpinner = true;
  refund: Refund[] = [];
  displayedColumns: string[] = [
    'invoiceNum',
    'customerName',
    'total',
    'pymtMethod',
    'date',
    'options',
  ];
  dataSource = new MatTableDataSource(this.refund);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  refundData = { customer: {}, products: [] } as any;
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;

  constructor(
    private refundService: RefundsService,
    private snackbarService: SnackbarService,
    private invoiceService: InvoicesService,
    private bankAccountsService: BankAccountsService,
    private paymentService: PaymentsService
  ) {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  ngOnInit(): void {
    this.populateRefundTable(this.currentYear, this.currentMonth);
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchRefund'
    ) as HTMLInputElement;
    const clearButton = document.getElementById(
      'clearButtonRefund'
    ) as HTMLElement;

    if (clearButton && inputField) {
      clearButton.addEventListener('click', () => {
        inputField.value = ''; // Correctly accessing the 'value' property
        inputField.focus();
        clearButton.style.display = 'none';

        // Create a mock event with an empty value
        const mockEvent = { target: { value: '' } } as unknown as Event;

        // Call the applyFilter method with the mock event
        this.applyFilter(mockEvent);
      });

      inputField.addEventListener('input', () => {
        clearButton.style.display = inputField.value ? 'block' : 'none';
      });

      // Initially hide the clear button
      clearButton.style.display = 'none';
    }
    this.dataSource.paginator = this.paginator;
  }

  populateRefundTable(year: number, month: number) {
    this.tableSpinner = true;
    this.refundService
      .getRefundsByYearMonth(year, month)
      .then(async (refund) => {
        this.tableSpinner = false;
        this.refund = refund;
        this.dataSource.data = this.refund;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Payment Failed`, 'error');
        console.error('Error Retrieving Payments:', error);
      });
  }

  filterStatus(): void {
    const year = Number(this.filterFormInputs.value.year);
    const month = Number(this.filterFormInputs.value.month);

    this.populateRefundTable(year, month);
  }

  newRefund() {
    this.refundFormInputs.get('date')?.setValue(this.formattedDate);
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

  clearRefundForm() {
    this.refundFormInputs.reset();
    this.refundFormInputs.get('date')?.setValue(this.formattedDate);
    this.refundData = { customer: {}, products: [] };
    console.log(this.refundData);
    this.searchInvoiceForRefundInput.reset();
  }

  async findInvoice() {
    try {
      const invoiceNumber =
        this.searchInvoiceForRefundInput.get('invoiceNumber')?.value!;

      const invoice = await this.invoiceService.getInvoiceByNumber(
        invoiceNumber
      );

      if (!invoice) {
        alert('Invoice not found.');
        return;
      }

      this.refundData = invoice;
    } catch (error) {
      console.error('Error:', error);
      this.snackbarService.show('Failed to Retrieve Data', 'error');
    }
  }

  refundTotal = 0;
  selectedItems(item: Product, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const itemTotal =
      item.quantity * item.price * (1 - (item.discount || 0) / 100);

    if (isChecked) {
      this.refundTotal += itemTotal; // Add if checked
    } else {
      this.refundTotal -= itemTotal; // Subtract if unchecked
    }

    this.refundFormInputs
      .get('amount')
      ?.setValue(this.refundTotal.toPrecision(4));
  }

  isProcessing = false;
  refundSubmit() {}

  refundInfoPopulate(data: Refund) {}
}
