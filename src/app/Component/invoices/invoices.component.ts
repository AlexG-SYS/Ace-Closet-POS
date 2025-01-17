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

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatSnackBarModule,
    MatPaginatorModule,
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
})
export class InvoicesComponent implements AfterViewInit, OnInit {
  invoiceForm = new FormGroup({
    id: new FormControl('', [Validators.required]), // Unique ID
    orderId: new FormControl('', [Validators.required]), // Reference to orders collection
    userId: new FormControl('', [Validators.required]), // Customer ID
    customer: new FormControl('', [Validators.required]),
    invoiceNumber: new FormControl('', [
      Validators.required,
      Validators.min(0), // Invoice number must be non-negative
    ]), // Unique invoice number
    invoiceBalance: new FormControl('', [
      Validators.required,
      Validators.min(0), // Balance cannot be negative
    ]), // Balance due on the invoice
    salesRep: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/), // Only letters and spaces
    ]), // Sales representative handling the invoice
    products: new FormControl([], [Validators.required]), // Array of product details
    grandTotal: new FormControl('', [
      Validators.required,
      Validators.min(0), // Total cannot be negative
    ]), // Total amount after taxes and adjustments
    subTotal: new FormControl('', [
      Validators.required,
      Validators.min(0), // Subtotal cannot be negative
    ]), // Total before taxes
    taxTotal: new FormControl('', [
      Validators.required,
      Validators.min(0), // Tax cannot be negative
    ]), // Total tax amount
    invoiceStatus: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(Past Due|Paid|Partial)$/), // Must match one of the predefined statuses
    ]), // Status of the invoice
    dueDate: new FormControl(new Date().toISOString().substring(0, 10), [
      Validators.required,
    ]), // Due date for payment
    memo: new FormControl('', [Validators.maxLength(500)]), // Optional notes or memo
    year: new FormControl('', [
      Validators.required,
      Validators.min(2000), // Ensure a reasonable year range
      Validators.max(new Date().getFullYear()), // Cannot be in the future
    ]),
    month: new FormControl('', [
      Validators.required,
      Validators.min(0), // Valid month range
      Validators.max(11),
    ]),
    day: new FormControl('', [
      Validators.required,
      Validators.min(1), // Valid day range
      Validators.max(31),
    ]),
    dateIssued: new FormControl(new Date().toISOString().substring(0, 10), [
      Validators.required,
    ]), // Timestamp when issued
    createdAt: new FormControl('', [Validators.required]), // Timestamp when issued
    updatedAt: new FormControl('', [Validators.required]), // Timestamp for the last update
  });

  filterFormInputs = new FormGroup({
    status: new FormControl('-1'),
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl('0'),
  });

  tableSpinner = true;
  activeInvoice: Invoice[] = [];
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
  displayedColumnsSmall: string[] = [
    'invoiceStatus',
    'invoiceNum',
    'customerName',
    'total',
    'balance',
    'options',
  ];

  dataSource = new MatTableDataSource(this.activeInvoice);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('newProductModal') newProductModal: any;
  displaySmall = false;
  modalData = false;
  invoiceDataLoaded = false;
  invoiceData: Partial<Invoice> = {};
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth();
  paidQty = 0;
  unpaidQty = 0;
  paidTotal = 0;
  unpaidTotal = 0;
  activeUsers: User[] = [];
  selectedInvoiceCustomer!: User;

  constructor(
    private invoiceService: InvoicesService,
    private userService: UsersService,
    private snackBar: MatSnackBar
  ) {
    this.displaySmall = window.innerWidth <= 435;
  }

  ngOnInit(): void {
    this.populateInvoiceTable(this.currentYear, this.currentMonth);
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchInvoice'
    ) as HTMLInputElement;
    const clearButton = document.getElementById('clearButton') as HTMLElement;

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

  populateInvoiceTable(year: number, month: number) {
    this.tableSpinner = true;
    this.invoiceService
      .getInvoicesFilterYearMonth(year, month)
      .then((invoices) => {
        this.tableSpinner = false;
        this.activeInvoice = invoices;
        this.dataSource.data = this.activeInvoice;
        this.countInvoicesByStatus();
        this.invoiceForm.patchValue({
          invoiceNumber: (this.dataSource.data[0].invoiceNumber + 1).toString(),
        });
      })
      .catch((error) => {
        this.showSnackBar(`Retrieving Invoices Failed`, 'error');
        console.error('Error retrieving active Invoices:', error);
      });
  }

  countInvoicesByStatus(): void {
    // Reset counts
    this.paidQty = 0;
    this.unpaidQty = 0;
    this.paidTotal = 0;
    this.unpaidTotal = 0;

    // Count invoices with status "Paid" and "Unpaid"
    this.activeInvoice.forEach((invoice) => {
      if (invoice.invoiceStatus == 'Paid') {
        this.paidQty++;
        this.paidTotal += invoice.grandTotal;
      } else if (
        invoice.invoiceStatus == 'Partial' ||
        invoice.invoiceStatus == 'Past Due'
      ) {
        this.unpaidQty++;
        this.unpaidTotal += invoice.invoiceBalance;
      }
    });
  }

  clearNewInvoiceForm() {}
  updateInvoice() {}
  newInvoiceForm() {}

  modalInvoiceData(formData: Invoice) {}

  showSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  filterStatus(): void {
    const year = Number(this.filterFormInputs.value.year);
    const month = Number(this.filterFormInputs.value.month);
    const status = this.filterFormInputs.value.status!.toString();

    if (this.filterFormInputs.value.status == '-1') {
      this.populateInvoiceTable(year, month);
    } else {
      this.tableSpinner = true;
      this.invoiceService
        .getInvoicesFilterAll(year, month, status)
        .then((invoices) => {
          this.tableSpinner = false;
          this.activeInvoice = invoices;
          this.dataSource.data = this.activeInvoice;
          this.countInvoicesByStatus();
        })
        .catch((error) => {
          this.showSnackBar(`Retrieving Invoices Failed`, 'error');
          console.error('Error retrieving active Invoices:', error);
        });
    }
  }

  convertDate(day: number, month: number, year: number): string {
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
    const formattedMonth = months[month]; // Use the month index directly

    if (formattedMonth === undefined) {
      throw new Error(
        'Invalid month. Please provide a month between 0 and 11.'
      );
    }

    return `${formattedMonth} ${formattedDay}, ${year}`;
  }

  getCustomers() {
    this.userService
      .getCustomer('active')
      .then((users) => {
        this.activeUsers = users;
      })
      .catch((error) => {
        this.showSnackBar(`Retrieving Users Failed`, 'error');
        console.error('Error retrieving active users:', error);
      });
  }

  populateCustInv(event: any) {
    const inputValue = event.target.value; // Get the value from the event

    // Find the matching user in activeUsers
    const matchingUser = this.activeUsers.find(
      (user) => user.name === inputValue
    );

    // Assign the matching user to selectedInvoiceCustomer if found
    if (matchingUser) {
      this.selectedInvoiceCustomer = matchingUser;
    } else {
      console.log('No matching user found.');
    }
  }
}
