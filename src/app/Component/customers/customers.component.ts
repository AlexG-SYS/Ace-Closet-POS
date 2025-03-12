import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { UsersService } from '../../Service/users.service';
import { User } from '../../DataModels/userData.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { Invoice } from '../../DataModels/invoiceData.model';
import { InvoicesService } from '../../Service/invoices.service';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { PaymentsService } from '../../Service/payments.service';
import { Payment } from '../../DataModels/paymentData.model';
import { SnackbarService } from '../../Service/snackbar.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    DecimalPipe,
    MatPaginatorModule,
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'], // Corrected property
})
export class CustomersComponent implements AfterViewInit, OnInit {
  customerForm = new FormGroup({
    id: new FormControl('', []),
    customerFirstName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]), // Only letters and spaces
    customerLastName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]), // Only letters and spaces
    customerEmail: new FormControl('', [Validators.email]), // Valid email format
    customerPhoneNum: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{3}-\d{4}$/), // Pattern for phone number
    ]),
    customerStreet: new FormControl('', [
      Validators.required,
      Validators.maxLength(25),
    ]), // Max length for street
    customerCityTown: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]), // Only letters and spaces
    customerStatus: new FormControl(),
  });

  get firstNameControl() {
    return this.customerForm.get('customerFirstName');
  }

  get lastNameControl() {
    return this.customerForm.get('customerLastName');
  }

  get emailControl() {
    return this.customerForm.get('customerEmail');
  }

  get phoneControl() {
    return this.customerForm.get('customerPhoneNum');
  }

  get streetControl() {
    return this.customerForm.get('customerStreet');
  }

  get cityControl() {
    return this.customerForm.get('customerCityTown');
  }

  tableSpinner = true;
  tableSpinnerInv = true;
  activeUsers: User[] = [];
  activeUsersInvoice: Invoice[] = [];
  displayedColumns: string[] = ['name', 'accountBalance', 'options'];
  displayedColumnsInvoice: string[] = [
    'status',
    'invNumber',
    'name',
    'total',
    'balance',
    'dueDate',
  ];
  dataSource = new MatTableDataSource(this.activeUsers);
  dataSourceInvoice = new MatTableDataSource(this.activeUsersInvoice);
  @ViewChild('paginator1') paginator!: MatPaginator;
  @ViewChild('paginator2') paginatorInvoice!: MatPaginator;
  @ViewChild('newCustomerModal') newCustomerModal: any;
  displaySmall = false;
  modalData = false;
  customerDataLoaded = false;
  customerData: Partial<User> = {};
  userTableStatus = '';
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');
  bankAccounts: any[] = [];
  @ViewChild('paymentModal') paymentModal: any;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  paymentFormInputs = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(1)]),
    paymentMethod: new FormControl(''),
    bankAccountId: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
  });

  constructor(
    private userService: UsersService,
    private invoiceService: InvoicesService,
    private paymentService: PaymentsService,
    private bankAccountsService: BankAccountsService,
    private snackbarService: SnackbarService
  ) {
    this.displaySmall = window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.populateUsersTable('active');
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchCustomer'
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

  isProcessing = false;
  newCustomerForm() {
    if (this.customerForm.valid) {
      this.isProcessing = true;
      const formData = this.customerForm.value;
      // Convert form data to a partial User data model
      const partialUser: Partial<User> = {
        name: `${formData.customerFirstName} ${formData.customerLastName}`,
        email: formData.customerEmail || '',
        phoneNumber: formData.customerPhoneNum || '',
        shippingAddress: {
          street: formData.customerStreet || '',
          cityTown: formData.customerCityTown || '',
        },
        role: 'customer',
        accountBalance: 0,
        status: 'active',
      };

      // Add user and handle success or error
      this.userService
        .addCustomer(partialUser)
        .then(() => {
          this.clearNewCustomerForm();
          this.modalData = false;
          this.snackbarService.show('User Added Successfully!', 'success');
          this.populateUsersTable('active');
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show(`Failed to Add User`, 'error');
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.customerForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  clearNewCustomerForm() {
    this.customerForm.reset();
    this.modalData = false;
  }

  populateUsersTable(status: string) {
    this.tableSpinner = true;
    this.userService
      .getCustomer(status)
      .then((users) => {
        this.tableSpinner = false;
        this.activeUsers = users;
        this.dataSource.data = this.activeUsers;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Users Failed`, 'error');
        console.error('Error Retrieving Active Users:', error);
      });

    if (status == 'inactive') {
      this.userTableStatus = 'active';
    } else {
      this.userTableStatus = 'inactive';
    }
  }

  showUserData(data: User) {
    this.tableSpinnerInv = true;
    this.customerDataLoaded = true;
    this.customerData = data;

    this.invoiceService
      .getInvoiceByUserId(data.id)
      .then((invoices) => {
        this.tableSpinnerInv = false;
        this.activeUsersInvoice = invoices;
        this.dataSourceInvoice.data = this.activeUsersInvoice;
        this.dataSourceInvoice.paginator = this.paginatorInvoice;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error Retrieving Active Invoices:', error);
      });
  }

  modalUserData(data: User) {
    this.modalData = true;
    this.customerForm.patchValue({
      id: data.id,
      customerFirstName: data.name ? data.name.split(' ')[0] : '',
      customerLastName: data.name ? data.name.split(' ')[1] : '',
      customerEmail: data.email,
      customerPhoneNum: data.phoneNumber,
      customerStreet: data.shippingAddress?.street,
      customerCityTown: data.shippingAddress?.cityTown,
      customerStatus: data.status,
    });

    if (data.status == 'active') {
      this.customerForm.patchValue({
        customerStatus: true,
      });
    } else {
      this.customerForm.patchValue({
        customerStatus: false,
      });
    }

    if (this.newCustomerModal) {
      const customerModal = new bootstrap.Modal(
        this.newCustomerModal.nativeElement
      );
      customerModal.show();
    }
  }

  updateCustomer() {
    if (this.customerForm.valid) {
      this.isProcessing = true;
      const formData = this.customerForm.value;
      const today = new Date();

      // Convert form data to a partial User data model
      const updatedData: Partial<User> = {
        name: `${formData.customerFirstName} ${formData.customerLastName}`,
        email: formData.customerEmail || '',
        phoneNumber: formData.customerPhoneNum || '',
        shippingAddress: {
          street: formData.customerStreet || '',
          cityTown: formData.customerCityTown || '',
        },
      };

      if (formData.customerStatus) {
        updatedData.status = 'active';
      } else {
        updatedData.status = 'inactive';
      }

      if (!this.customerForm.value.id) {
        console.error('User ID is missing');
        this.snackbarService.show(
          'Failed to Update User: Missing User ID',
          'error'
        );
        return;
      }
      this.userService
        .updateCustomer(this.customerForm.value.id, updatedData)
        .then(() => {
          this.clearNewCustomerForm();
          this.modalData = false;
          this.snackbarService.show('User Updated Successfully!', 'success');
          this.populateUsersTable('active');
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show('Failed to Update User', 'error');
          console.error('Error Updating User:', error.message);
        });
    } else {
      this.customerForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  getInitials(): string {
    if (!this.customerData.name) return '';
    const nameParts = this.customerData.name.split(' ');
    const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || '';
    const lastInitial = nameParts[1]?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial;
  }

  receivePayment(data: Invoice) {
    this.paymentFormInputs.get('date')?.setValue(this.formattedDate);
    this.customerData = data;

    // Query all bank accounts
    this.bankAccountsService
      .getAllBankAccounts()
      .then((accounts) => {
        this.bankAccounts = accounts;

        // Show the payment modal after fetching bank accounts
        if (this.paymentModal) {
          const paymentModal = new bootstrap.Modal(
            this.paymentModal.nativeElement
          );
          paymentModal.show();
        }
      })
      .catch((error) => {
        console.error('Error fetching bank accounts:', error);
      });
  }

  getBankAccountName(id: string): string {
    const account = this.bankAccounts.find((account) => account.id === id);
    return account ? account.bankName : ''; // Return empty string if not found
  }

  paymentSubmit() {
    if (this.paymentFormInputs.valid) {
      this.isProcessing = true;
      const formData = this.paymentFormInputs.value;
      const [year, month, day] = formData.date!.split('-').map(Number);

      // Convert form data to a partial Payment data model
      const partialPayment: Partial<Payment> = {
        userId: this.customerData.id || '',
        amount: Number(formData.amount),
        customerName: this.customerData.name,
        day: day,
        month: month,
        year: year,
        timestamp: Timestamp.fromDate(new Date(year, month - 1, day)),
        paymentMethod: this.getBankAccountName(formData.bankAccountId!) || '',
        bankAccountId: formData.bankAccountId || '',
      };

      this.paymentService
        .addCreditToCustomer(partialPayment)
        .then(() => {
          this.snackbarService.show('Payment Applied Successfully!', 'success');
          this.populateUsersTable('active');
          this.customerData = {} as User;
          this.paymentFormInputs.reset();
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
}
