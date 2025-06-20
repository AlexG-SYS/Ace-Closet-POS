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
    selector: 'app-payments',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        DecimalPipe,
        FormsModule,
        NgxPrintModule,
    ],
    templateUrl: './payments.component.html',
    styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements AfterViewInit, OnInit {
  today = new Date();
  tableRow = 8;
  formattedDate = this.today.toLocaleDateString('en-CA');

  filterFormInputs = new FormGroup({
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  paymentFormInputs = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
    paymentMethod: new FormControl(''),
    bankAccountId: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
  });

  searchInvoiceForPaymentInput = new FormGroup({
    invoiceNumber: new FormControl(''),
  });

  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;
  tableSpinner = true;
  bankAccounts: any[] = [];
  activePayment: Payment[] = [];
  displayedColumns: string[] = [
    'invoiceNum',
    'customerName',
    'total',
    'pymtMethod',
    'date',
    'options',
  ];

  dataSource = new MatTableDataSource(this.activePayment);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('paymentModalView') paymentModal: any;
  @ViewChild('newPaymentModal') newPaymentModal: any;

  constructor(
    private paymentService: PaymentsService,
    private invoiceService: InvoicesService,
    private bankAccountsService: BankAccountsService,
    private userService: UsersService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.populatePaymentTable(this.currentYear, this.currentMonth);
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchPayment'
    ) as HTMLInputElement;
    const clearButton = document.getElementById(
      'clearButtonPayment'
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  populatePaymentTable(year: number, month: number) {
    this.tableSpinner = true;
    this.paymentService
      .getPaymentsFilterYearMonth(year, month)
      .then(async (payment) => {
        this.tableSpinner = false;
        this.activePayment = payment;
        this.dataSource.data = this.activePayment;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Payment Failed`, 'error');
        console.error('Error Retrieving Payments:', error);
      });
  }

  filterStatus(): void {
    const year = Number(this.filterFormInputs.value.year);
    const month = Number(this.filterFormInputs.value.month);

    this.populatePaymentTable(year, month);
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

  recPymtData: any = { customer: {} } as any;
  paymentInfoPopulate(data: Payment) {
    if (data.invoiceId) {
      // If invoiceId exists, fetch invoice data
      this.invoiceService
        .getInvoiceById(data.invoiceId)
        .then((invoiceData) => {
          // Merge invoiceData and payment data
          this.recPymtData = { ...invoiceData, ...data };

          // Show the payment modal
          if (this.paymentModal) {
            const paymentModal = new bootstrap.Modal(
              this.paymentModal.nativeElement
            );
            paymentModal.show();
          }
        })
        .catch((error) => {
          this.snackbarService.show('Error Loading Invoice Info', 'error');
          console.error('Error loading invoice info:', error);
        });
    } else {
      // If no invoice, fetch user info using UsersService
      this.userService
        .getUserById(data.userId)
        .then((userData) => {
          if (userData) {
            // Merge userData with payment data
            userData.status = '';
            this.recPymtData = { ...userData, ...data };
          } else {
            console.log(`User with ID ${data.userId} not found.`);
            this.recPymtData = { ...data };
          }
          // Show the payment modal
          if (this.paymentModal) {
            const paymentModal = new bootstrap.Modal(
              this.paymentModal.nativeElement
            );
            paymentModal.show();
          }
        })
        .catch((error) => {
          this.snackbarService.show('Error Loading Customer Info', 'error');
          console.error('Error Loading user info:', error);
        });
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

  getBankAccountName(id: string): string {
    const account = this.bankAccounts.find((account) => account.id === id);
    return account ? account.bankName : ''; // Return empty string if not found
  }

  receivePayment() {
    this.paymentFormInputs.get('date')?.setValue(this.formattedDate);

    // Query all bank accounts
    this.bankAccountsService
      .getAllBankAccounts()
      .then((accounts) => {
        this.bankAccounts = accounts;
      })
      .catch((error) => {
        this.snackbarService.show('Error Loading Bank Info', 'error');
        console.error('Error loading bank info:', error);
      });
  }

  recPymtInvoiceData: Invoice = { customer: {} } as Invoice;
  findInvoice() {
    const invoiceNumber =
      this.searchInvoiceForPaymentInput.get('invoiceNumber')?.value!;

    this.invoiceService
      .getInvoiceByNumber(invoiceNumber)
      .then((invoice) => {
        if (invoice) {
          this.recPymtInvoiceData = invoice;
        } else {
          alert('Invoice not found.');
        }
      })
      .catch((error) => {
        console.error('Error finding invoice:', error);
        this.snackbarService.show('Error Finding Invoice Info', 'error');
      });
  }

  isProcessing = false;
  paymentSubmit() {
    if (this.paymentFormInputs.valid) {
      this.isProcessing = true;

      const formData = this.paymentFormInputs.value;
      const [year, month, day] = formData.date!.split('-').map(Number);

      // Convert form data to a partial Payment data model
      const partialPayment: Partial<Payment> = {
        invoiceId: this.recPymtInvoiceData.id || '',
        userId: this.recPymtInvoiceData.customer.id || '',
        amount: Number(formData.amount),
        balance: 0,
        invoiceNumber: this.recPymtInvoiceData.invoiceNumber,
        customerName: this.recPymtInvoiceData.customer.name,
        day: day,
        month: month,
        year: year,
        timestamp: Timestamp.fromDate(new Date(year, month - 1, day)),
        paymentMethod: this.getBankAccountName(formData.bankAccountId!) || '',
        bankAccountId: formData.bankAccountId || '',
      };

      this.paymentService
        .addPayment(partialPayment)
        .then(() => {
          this.snackbarService.show('Payment Applied Successfully!', 'success');
          this.populatePaymentTable(this.currentYear, this.currentMonth);
          this.clearPaymentForm();
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show(error.message, 'error');
          console.log(error.message);
        });
    } else {
      this.snackbarService.show('Invalid Action', 'error');
      console.log('Form is invalid');
    }
  }

  clearPaymentForm() {
    this.paymentFormInputs.reset();
    this.paymentFormInputs.get('date')?.setValue(this.formattedDate);
    this.recPymtInvoiceData = { customer: {} } as Invoice;
    this.searchInvoiceForPaymentInput.reset();
  }

  isProcessing2 = false;
  voidPayment() {
    this.isProcessing2 = true;
    this.paymentService
      .voidPayment(this.recPymtData.id)
      .then(() => {
        this.isProcessing2 = false;
        this.snackbarService.show('Payment Voided Successfully', 'success');
        this.populatePaymentTable(this.currentYear, this.currentMonth);
      })
      .catch(() => {
        this.snackbarService.show('Error Voiding Payment', 'error');
      });
  }
}
