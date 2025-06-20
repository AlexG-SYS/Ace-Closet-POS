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
import { SnackbarService } from '../../Service/snackbar.service';
import { Timestamp } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-invoices',
    imports: [
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        DecimalPipe,
        FormsModule,
        NgxPrintModule,
    ],
    templateUrl: './invoices.component.html',
    styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements AfterViewInit, OnInit {
  logoPath = '../../../assets/aceClosetLogoFull.png'; // Default image
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');
  tableRow = 6;

  invoiceForm = new FormGroup({
    id: new FormControl(''), // Unique ID
    orderId: new FormControl(''), // Reference to orders collection
    customer: new FormControl<User | null>(null, [Validators.required]),
    invoiceNumber: new FormControl('', [
      Validators.required,
      Validators.min(0), // Invoice number must be non-negative
    ]), // Unique invoice number
    invoiceBalance: new FormControl('', [
      Validators.min(0), // Balance cannot be negative
    ]), // Balance due on the invoice
    salesRep: new FormControl('', [
      Validators.pattern(/^[a-zA-Z\s]+$/), // Only letters and spaces
    ]), // Sales representative handling the invoice
    products: new FormControl<Product[]>([], [Validators.required]), // Array of product details
    subTotal: new FormControl('0', [
      Validators.required,
      Validators.min(0), // Subtotal cannot be negative
    ]), // Total before taxes
    taxTotal: new FormControl('0', [
      Validators.required,
      Validators.min(0), // Tax cannot be negative
    ]), // Total tax amount
    grandTotal: new FormControl('0', [
      Validators.required,
      Validators.min(0), // Total cannot be negative
    ]), // Total amount after taxes and adjustments
    discount: new FormControl('0', [
      Validators.required,
      Validators.min(0), // Total cannot be negative
    ]), // Total amount after taxes and adjustments
    invoiceStatus: new FormControl(''), // Status of the invoice
    dueDate: new FormControl(this.formattedDate, [Validators.required]), // Due date for payment
    memo: new FormControl('Thank you for your business!', [
      Validators.maxLength(500),
    ]), // Optional notes or memo
    year: new FormControl('', [
      Validators.min(2000), // Ensure a reasonable year range
      Validators.max(new Date().getFullYear()), // Cannot be in the future
    ]),
    month: new FormControl('', [
      Validators.min(0), // Valid month range
      Validators.max(11),
    ]),
    day: new FormControl('', [
      Validators.min(1), // Valid day range
      Validators.max(31),
    ]),
    dateIssued: new FormControl(this.formattedDate, [Validators.required]), // Timestamp when issued
    createdAt: new FormControl(''), // Timestamp when issued
    updatedAt: new FormControl(''), // Timestamp for the last update
  });

  get subTotalControl() {
    return this.invoiceForm.get('subTotal');
  }

  get discountControl() {
    return this.invoiceForm.get('discount');
  }

  get gstControl() {
    return this.invoiceForm.get('taxTotal');
  }

  get grandTotalControl() {
    return this.invoiceForm.get('grandTotal');
  }

  get memoControl() {
    return this.invoiceForm.get('memo');
  }

  filterFormInputs = new FormGroup({
    status: new FormControl('-1'),
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  paymentFormInputs = new FormGroup({
    amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
    paymentMethod: new FormControl(''),
    bankAccountId: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
  });

  tableSpinner = true;
  activeInvoice: Invoice[] = [];
  activeProduct: Product[] = [];
  paymentsForUser: any[] = [];
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

  displayedColumnsProduct: string[] = [
    'item',
    'qty',
    'price',
    'discount',
    'total',
    'tax',
    'option',
  ];

  displayedColumnsPrintProduct: string[] = [
    'item',
    'qty',
    'price',
    'discount',
    'total',
    'tax',
  ];

  dataSource = new MatTableDataSource(this.activeInvoice);
  dataSourceProduct = new MatTableDataSource(this.activeProduct);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('printInvoiceModal') printInvoiceModal: any;
  @ViewChild('paymentModal') paymentModal: any;
  displaySmall = false;
  modalData = false;
  invoiceDataLoaded = false;
  invoiceData: Partial<Invoice> = {};
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;
  paidQty = 0;
  unpaidQty = 0;
  paidTotal = 0;
  unpaidTotal = 0;
  activeUsers: User[] = [];
  selectedInvoiceCustomer: User | null = null;
  selectedInvoiceProduct: Product | null = null;
  selectedProductPrice = 0;
  selectedProductTotal = 0;
  newInvoiceNumber = '0';
  maxDate!: string;

  searchTerm: string = '';
  searchTermProduct: string = '';
  filteredCustomers = [...this.activeUsers];
  filteredProduct = [...this.activeProduct];

  constructor(
    private invoiceService: InvoicesService,
    private userService: UsersService,
    private productService: ProductsService,
    private paymentService: PaymentsService,
    private snackbarService: SnackbarService,
    private bankAccountsService: BankAccountsService,
    private route: ActivatedRoute
  ) {
    const savedTheme = localStorage.getItem('theme') || 'light-mode';

    this.logoPath =
      savedTheme === 'dark-mode'
        ? '../../../assets/aceClosetLogoFullLight.png'
        : '../../../assets/aceClosetLogoFull.png';
  }

  ngOnInit(): void {
    this.processInvoiceViewPayRoute();

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchStr = filter.trim().toLowerCase();
      return JSON.stringify(data).toLowerCase().includes(searchStr);
    };
    this.initializeComponent();
  }

  async initializeComponent(): Promise<void> {
    try {
      await this.checkPastDue(); // Ensure past due checks finish first
      this.populateInvoiceTable(this.currentYear, this.currentMonth); // Populate invoice table after
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchInvoice'
    ) as HTMLInputElement;
    const clearButton = document.getElementById(
      'clearButtonInvoice'
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

    const inputFieldCusotmer = document.getElementById(
      'searchCustomer2'
    ) as HTMLInputElement;
    const clearButtonCustomer = document.getElementById(
      'clearButtonCustomer2'
    ) as HTMLElement;

    if (clearButtonCustomer && inputFieldCusotmer) {
      clearButtonCustomer.addEventListener('click', () => {
        inputFieldCusotmer.value = ''; // Correctly accessing the 'value' property
        inputFieldCusotmer.focus();
        clearButtonCustomer.style.display = 'none';
        this.searchTerm = '';

        // Create a mock event with an empty value
        const mockEvent = { target: { value: '' } } as unknown as Event;

        // Call the applyFilter method with the mock event
        this.applyFilter(mockEvent);
      });

      inputFieldCusotmer.addEventListener('input', () => {
        clearButtonCustomer.style.display = inputFieldCusotmer.value
          ? 'block'
          : 'none';
      });

      // Initially hide the clear button
      clearButtonCustomer.style.display = 'none';
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
      .then(async (invoices) => {
        this.tableSpinner = false;
        this.activeInvoice = invoices;
        this.dataSource.data = this.activeInvoice;
        this.countInvoicesByStatus();

        try {
          const latestInvoiceNumber =
            await this.invoiceService.getLatestInvoiceNumber();

          this.invoiceForm.patchValue({
            invoiceNumber: latestInvoiceNumber.toString(),
          });

          this.newInvoiceNumber = latestInvoiceNumber.toString();
        } catch (error) {
          console.error('Error Setting Invoice Number:', error);
          this.invoiceForm.patchValue({
            invoiceNumber: '1', // Fallback if there's an error
          });
        }
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
        console.error('Error rRtrieving Active Invoices:', error);
      });
  }

  async checkPastDue(): Promise<void> {
    await this.invoiceService.checkAndMarkPastDueInvoices();
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
        invoice.invoiceStatus == 'Past Due' ||
        invoice.invoiceStatus == 'Pending'
      ) {
        this.unpaidQty++;
        this.unpaidTotal += invoice.invoiceBalance;
      } else if (invoice.invoiceStatus == 'Partial') {
        this.paidTotal += invoice.grandTotal - invoice.invoiceBalance;
        this.unpaidTotal += invoice.invoiceBalance;
      }
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
          this.snackbarService.show(`Retrieving Invoices Failed`, 'error');
          console.error('Error Retrieving Active Invoices:', error);
        });
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

  formatDate(inputDate: string): string {
    if (inputDate != undefined) {
      const [year, month, day] = inputDate.split('-').map(Number);

      // Adjust month to match 0-based index used in convertDate
      return this.convertDate(day, month, year);
    } else {
      return '';
    }
  }

  getCustomersAndItems() {
    this.userService
      .getCustomer('active')
      .then((users) => {
        this.activeUsers = users;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Users Failed`, 'error');
        console.error('Error retrieving Active Users:', error);
      });

    this.productService
      .getProducts('active')
      .then((product) => {
        this.activeProduct = product;
      })
      .catch((error) => {
        this.snackbarService.show(`Retrieving Product Failed`, 'error');
        console.error('Error Retrieving Active Product:', error);
      });
  }

  populateCustInv(event: any) {
    const inputValue = event.id;

    this.searchTerm = '';
    const inputFieldProduct = document.getElementById(
      'searchCustomer2'
    ) as HTMLInputElement;
    inputFieldProduct.value = '';

    this.filteredCustomers = [];

    // Find the matching user in activeUsers
    const matchingUser = this.activeUsers.find(
      (user) => user.id === inputValue
    );

    // Assign the matching user to selectedInvoiceCustomer if found
    if (matchingUser) {
      this.selectedInvoiceCustomer = matchingUser;
      this.invoiceForm.patchValue({
        customer: matchingUser,
      });
    } else {
      console.log('No matching user found.');
    }
  }

  populateProductInv(event: any) {
    const inputValue = event.id;

    this.searchTermProduct = '';
    const inputFieldProduct = document.getElementById(
      'searchProduct'
    ) as HTMLInputElement;
    inputFieldProduct.value = event.productName + ' - ' + event.size;
    this.filteredProduct = [];

    const matchingProduct = this.activeProduct.find(
      (product) => product.id === inputValue
    );

    if (matchingProduct) {
      this.selectedInvoiceProduct = matchingProduct;
      this.calculateSelectedTotal();
    } else {
      console.log('No matching product found.');
    }
  }

  filterCustomers(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase(); // Extract the input value
    this.searchTerm = term;
    this.filteredCustomers = this.activeUsers.filter((customer) =>
      customer.name.toLowerCase().includes(term)
    );
  }

  filterProduct(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase(); // Extract the input value
    this.searchTermProduct = term;
    this.filteredProduct = this.activeProduct.filter((product) =>
      product.description.toLowerCase().includes(term)
    );
  }

  qtyInput = 0;
  discountInput = 0;

  calculateSelectedTotal() {
    const qtyInputField = document.getElementById(
      'invoice-product-qty'
    ) as HTMLInputElement;
    const discountInputField = document.getElementById(
      'invoice-discount'
    ) as HTMLInputElement;

    // Get quantity and discount values
    this.qtyInput = Number(qtyInputField.value) || 0; // Default to 0 if invalid or empty
    this.discountInput = Number(discountInputField.value) || 0; // Default to 0 if invalid or empty

    // Ensure discount is treated as a percentage
    const discountFactor =
      this.discountInput > 0 ? (100 - this.discountInput) / 100 : 1;

    // Calculate total considering the discount
    this.selectedProductTotal =
      this.selectedInvoiceProduct!.price * this.qtyInput * discountFactor;

    this.selectedProductPrice = this.selectedInvoiceProduct!.price;
  }

  addProductToInvoice(item: Product) {
    item.quantity = this.qtyInput;
    item.discount = this.discountInput;

    // Check if the item already exists based on `id`
    const existingItemIndex = this.dataSourceProduct.data.findIndex(
      (data) => data.id === item.id
    );

    if (existingItemIndex !== -1) {
      // If item exists, update its information
      this.dataSourceProduct.data[existingItemIndex] = {
        ...this.dataSourceProduct.data[existingItemIndex],
        ...item, // Merge the updated item properties
      };
    } else {
      // If item does not exist, add it to the array
      this.dataSourceProduct.data = [...this.dataSourceProduct.data, item];
    }

    // Reassign data to trigger change detection
    this.dataSourceProduct.data = [...this.dataSourceProduct.data];
    this.invoiceForm.get('products')?.setValue(this.dataSourceProduct.data);

    this.selectedInvoiceProduct = null;

    const inputFieldProduct = document.getElementById(
      'searchProduct'
    ) as HTMLInputElement;

    const inputFieldQty = document.getElementById(
      'invoice-product-qty'
    ) as HTMLInputElement;

    const discountFieldQty = document.getElementById(
      'invoice-discount'
    ) as HTMLInputElement;

    inputFieldProduct.value = '';
    inputFieldQty.value = '1';
    discountFieldQty.value = '0';
    this.selectedProductPrice = 0;
    this.selectedProductTotal = 0;
    this.updateInvoiceTotals();
  }

  removeProductFromInvoice(item: Product) {
    // Filter out the product with the matching id
    this.dataSourceProduct.data = this.dataSourceProduct.data.filter(
      (data) => data.id !== item.id
    );

    // Reassign data to trigger change detection
    this.dataSourceProduct.data = [...this.dataSourceProduct.data];
    this.invoiceForm.get('products')?.setValue(this.dataSourceProduct.data);
    this.updateInvoiceTotals();
  }

  updateInvoiceTotals() {
    const products: Product[] = this.invoiceForm.get('products')?.value || [];
    let subTotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    // Calculate totals
    products.forEach((product) => {
      const quantity = product.quantity || 0;
      const price = product.price || 0;
      const discount = product.discount || 0; // Discount as a percentage
      const gst = product.tax ? product.gst || 0 : 0; // GST applies only if `tax` is true

      const productSubTotal = quantity * price;
      const productDiscount = productSubTotal * (discount / 100);
      const taxableAmount = productSubTotal - productDiscount;
      const productTax = taxableAmount * (gst / 100);

      subTotal += productSubTotal;
      discountTotal += productDiscount;
      taxTotal += productTax;
    });

    const grandTotal = subTotal - discountTotal + taxTotal;

    // Update form controls
    this.invoiceForm.patchValue({
      subTotal: subTotal.toFixed(2),
      discount: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    });
  }

  clearNewInvoiceForm() {
    this.invoiceForm.reset();
    this.invoiceForm.get('invoiceNumber')?.setValue(this.newInvoiceNumber);
    this.invoiceForm.get('dateIssued')?.setValue(this.formattedDate);
    this.invoiceForm.get('dueDate')?.setValue(this.formattedDate);

    this.invoiceForm.get('subTotal')?.setValue('0');
    this.invoiceForm.get('taxTotal')?.setValue('0');
    this.invoiceForm.get('discount')?.setValue('0');
    this.invoiceForm.get('grandTotal')?.setValue('0');
    this.invoiceForm.get('memo')?.setValue('Thank you for your business!');

    this.selectedInvoiceCustomer = null;
    this.selectedInvoiceProduct = null;
    this.dataSourceProduct.data = [];
    this.modalData = false;
  }

  updateInvoice() {}

  isProcessing = false;
  newInvoiceForm() {
    if (this.invoiceForm.valid) {
      this.isProcessing = true;
      const formData = this.invoiceForm.value;
      const dueDateString = formData.dateIssued!.toString();
      // Split the string and parse each value
      const [year, month, day] = dueDateString.split('-').map(Number);

      // Convert form data to a partial Invoice data model
      const partialInvoice: Partial<Invoice> = {
        customer: {
          id: formData.customer?.id || '',
          name: formData.customer?.name || '',
          email: formData.customer?.email || '',
          phoneNumber: formData.customer?.phoneNumber || '',
          role: formData.customer?.role || '',
          shippingAddress: {
            cityTown: formData.customer?.shippingAddress?.cityTown || '',
            street: formData.customer?.shippingAddress?.cityTown || '',
          },
        },
        invoiceNumber: Number(formData.invoiceNumber),
        invoiceBalance: Number(formData.grandTotal),
        salesRep: formData.salesRep || '',
        products: formData.products!,
        grandTotal: Number(formData.grandTotal),
        subTotal: Number(formData.subTotal),
        taxTotal: Number(formData.taxTotal),
        discount: Number(formData.discount),
        invoiceStatus: 'Pending',
        dueDate: formData.dueDate || '',
        memo: formData.memo || '',
        year: year,
        month: month,
        day: day,
        timestamp: Timestamp.fromDate(new Date(year, month - 1, day)),
      };

      // Add Invoice and handle success or error
      this.invoiceService
        .addInvoice(partialInvoice)
        .then(() => {
          this.modalData = false;
          this.snackbarService.show('Invoice Added Successfully!', 'success');
          this.populateInvoiceTable(this.currentYear, this.currentMonth);
          this.clearNewInvoiceForm();
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show(error.message, 'error');
          console.log(error.message);
        });
    } else {
      this.snackbarService.show('Invalid Action', 'error');
      console.log('Form is invalid');
      this.invoiceForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  printInvoiceData: Invoice = { customer: {} } as Invoice;
  dataSourcePrintInvoiceProduct = new MatTableDataSource(this.activeProduct);

  viewInvoice(invoiceData: Invoice) {
    this.printInvoiceData = invoiceData; // Assign the invoice data
    this.dataSourcePrintInvoiceProduct.data = invoiceData.products;

    if (this.printInvoiceModal) {
      const printInvoiceModal = new bootstrap.Modal(
        this.printInvoiceModal.nativeElement
      );
      printInvoiceModal.show();
    }
  }

  bankAccounts: any[] = [];
  recPymtInvoiceData: Invoice = { customer: {} } as Invoice;

  receivePayment(invoiceData: Invoice) {
    this.paymentService
      .getPaymentsByUserId(invoiceData.customer.id!)
      .then((payments) => {
        this.paymentsForUser = payments;
      })
      .catch((error) => {
        console.error('Error Retrieving User Payments', error);
      });

    this.paymentFormInputs.get('date')?.setValue(this.formattedDate);
    this.recPymtInvoiceData = invoiceData;

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
        this.snackbarService.show('Error Loading Bank Info', 'error');
        console.error('Error fetching bank accounts:', error);
      });
  }

  getBankAccountName(id: string): string {
    const account = this.bankAccounts.find((account) => account.id === id);
    return account ? account.bankName : ''; // Return empty string if not found
  }

  isProcessing2 = false;
  paymentSubmit() {
    if (this.paymentFormInputs.valid) {
      this.isProcessing2 = true;
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
          return Promise.all([
            this.invoiceService.getInvoiceById(this.recPymtInvoiceData.id),
          ]);
        })
        .then(([invoiceData]) => {
          this.recPymtInvoiceData = invoiceData;
          this.populateInvoiceTable(this.currentYear, this.currentMonth);
          this.paymentFormInputs.reset();
          this.paymentFormInputs.get('date')?.setValue(this.formattedDate);
          this.isProcessing2 = false;
          this.snackbarService.show('Payment Applied Successfully!', 'success');
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

  isProcessing3 = false;
  voidInvoice(invoiceData: Invoice) {
    this.isProcessing3 = true;
    this.invoiceService
      .voidInvoice(invoiceData.id)
      .then(() => {
        this.isProcessing3 = false;
        this.snackbarService.show('Invoice Voided Successfully', 'success');
        this.populateInvoiceTable(this.currentYear, this.currentMonth);
      })
      .catch(() => {
        this.snackbarService.show('Error Voiding Invoice', 'error');
      });
  }

  processInvoiceViewPayRoute() {
    this.route.firstChild?.params.subscribe((params) => {
      if (params['action'] == 'pay') {
        this.invoiceService
          .getInvoiceById(params['id'])
          .then((invoiceData) => {
            this.receivePayment(invoiceData);
          })
          .catch((error) => {
            this.snackbarService.show('Error Loading Invoice Data', 'error');
            console.error('Error Loading Invoice Data', error);
          });
      } else if (params['action'] == 'view') {
        this.invoiceService
          .getInvoiceById(params['id'])
          .then((invoiceData) => {
            this.viewInvoice(invoiceData);
          })
          .catch((error) => {
            this.snackbarService.show('Error Loading Invoice Data', 'error');
            console.error('Error Loading Invoice Data', error);
          });
      }
    });
  }

  applyCredit(payment: any) {
    this.paymentService
      .applyCredit(payment.id, this.recPymtInvoiceData.id)
      .then(() => {
        return Promise.all([
          this.invoiceService.getInvoiceById(this.recPymtInvoiceData.id),
          this.paymentService.getPaymentsByUserId(
            this.recPymtInvoiceData.customer.id!
          ),
        ]);
      })
      .then(([invoiceData, payments]) => {
        this.recPymtInvoiceData = invoiceData;
        this.paymentsForUser = payments;
        this.populateInvoiceTable(this.currentYear, this.currentMonth);
        this.snackbarService.show('Credit Applied to Invoice', 'success');
      })
      .catch((error) => {
        this.snackbarService.show('Error Applying Credit', 'error');
        console.error('Error Applying Credit:', error);
      });
  }
}
