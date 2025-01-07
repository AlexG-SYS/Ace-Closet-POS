import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import { InvoicesService } from '../../Service/invoices.service';
import { Invoice } from '../../DataModels/invoiceData.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatSnackBarModule,
    MatPaginatorModule,
    DecimalPipe,
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

  tableSpinner = true;
  activeInvoice: Invoice[] = [];
  displayedColumns: string[] = [
    'status',
    'invoiceNum',
    'customerName',
    'total',
    'dateInvoiced',
    'balance',
    'dueDate',
    'options',
  ];
  displayedColumnsSmall: string[] = [
    'upc',
    'productName',
    'price',
    'qty',
    'size',
    'options',
  ];

  dataSource = new MatTableDataSource(this.activeInvoice);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('newProductModal') newProductModal: any;
  displaySmall = false;
  modalData = false;
  invoiceDataLoaded = false;
  invoiceData: Partial<Invoice> = {};
  invoiceTableStatus = '';

  constructor(
    private productService: InvoicesService,
    private snackBar: MatSnackBar
  ) {
    this.displaySmall = window.innerWidth <= 1223;
  }

  ngOnInit(): void {
    this.populateInvoiceTable('active');
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

  populateInvoiceTable(arg0: string) {}

  clearNewInvoiceForm() {
    throw new Error('Method not implemented.');
  }
  updateInvoice() {
    throw new Error('Method not implemented.');
  }
  newInvoiceForm() {
    throw new Error('Method not implemented.');
  }

  modalInvoiceData(formData: Invoice) {}
}
