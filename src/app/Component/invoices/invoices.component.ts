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
    id: new FormControl(),
    upc: new FormControl('', [Validators.required, Validators.maxLength(25)]),
    productName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]), // Only letters and spaces
    productColor: new FormControl('', [Validators.required]),
    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    price: new FormControl('', [
      Validators.required,
      Validators.min(0), // Price cannot be negative
    ]),
    cost: new FormControl('', [
      Validators.required,
      Validators.min(0), // Cost cannot be negative
    ]),
    online: new FormControl(false, [Validators.required]), // Boolean value
    category: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [
      Validators.required,
      Validators.min(0), // Quantity cannot be negative
    ]),
    size: new FormControl('', [Validators.required]),
    status: new FormControl(),
    tax: new FormControl(false, [Validators.required]), // Boolean value
    tags: new FormControl('', [Validators.required]),
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
  showInvoiceCustomerData = false;
  newInvoiceNum = 0;

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
        this.newInvoiceNum = this.dataSource.data[0].invoiceNumber + 1;
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
      .getUsers('active')
      .then((users) => {
        this.activeUsers = users;
      })
      .catch((error) => {
        this.showSnackBar(`Retrieving Users Failed`, 'error');
        console.error('Error retrieving active users:', error);
      });
  }

  populateCustInv(event: any) {
    this.showInvoiceCustomerData = true;
    console.log(event.target.value);
  }
}
