import {
  AfterViewInit,
  OnInit,
  Component,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
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
    customerFirstName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]), // Only letters and spaces
    customerLastName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]), // Only letters and spaces
    customerEmail: new FormControl('', [Validators.required, Validators.email]), // Valid email format
    customerPhoneNum: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{3}-\d{4}$/), // Pattern for phone number
    ]),
    customerStreet: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
    ]), // Max length for street
    customerCityTown: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]), // Only letters and spaces
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
  activeUsers: User[] = [];
  displayedColumns: string[] = ['name', 'accountBalance'];
  dataSource = new MatTableDataSource(this.activeUsers);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  constructor(
    private userService: UsersService,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.populateActiveUsers();
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
      const today = new Date();
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
        .addUser(partialUser)
        .then(() => {
          this.showSnackBar('User added successfully!', 'success');
        })
        .catch((error) => {
          this.showSnackBar(`Failed to add user`, 'error');
          console.log(error.message);
        });

      this.clearNewCustomerForm();

      this.populateActiveUsers();
    } else {
      console.log('Form is invalid');
      this.customerForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  clearNewCustomerForm() {
    this.customerForm.reset();
  }

  populateActiveUsers() {
    this.userService
      .getActiveUsers()
      .then((users) => {
        this.tableSpinner = false;
        this.activeUsers = users;
        this.dataSource.data = this.activeUsers;
      })
      .catch((error) => {
        this.showSnackBar(`Failed to Retrieving Users`, 'error');
        console.error('Error retrieving active users:', error);
      });
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
    console.log(data);
  }
}
