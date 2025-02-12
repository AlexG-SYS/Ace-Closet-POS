import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { UsersService } from '../../Service/users.service';
import { User } from '../../DataModels/userData.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { Invoice } from '../../DataModels/invoiceData.model';
import { InvoicesService } from '../../Service/invoices.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
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
    customerEmail: new FormControl('', [Validators.required, Validators.email]), // Valid email format
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  constructor(
    private userService: UsersService,
    private invoiceService: InvoicesService,
    private snackBar: MatSnackBar
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

  newCustomerForm() {
    if (this.customerForm.valid) {
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
          this.showSnackBar('User Added Successfully!', 'success');
          this.populateUsersTable('active');
        })
        .catch((error) => {
          this.showSnackBar(`Failed to Add User`, 'error');
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
        this.showSnackBar(`Retrieving Users Failed`, 'error');
        console.error('Error Retrieving Active Users:', error);
      });

    if (status == 'inactive') {
      this.userTableStatus = 'active';
    } else {
      this.userTableStatus = 'inactive';
    }
  }

  showSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
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
        this.showSnackBar(`Retrieving Invoices Failed`, 'error');
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
        this.showSnackBar('Failed to Update User: Missing User ID', 'error');
        return;
      }
      this.userService
        .updateCustomer(this.customerForm.value.id, updatedData)
        .then(() => {
          this.clearNewCustomerForm();
          this.modalData = false;
          this.showSnackBar('User Updated Successfully!', 'success');
          this.populateUsersTable('active');
        })
        .catch((error) => {
          this.showSnackBar('Failed to Update User', 'error');
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
}
