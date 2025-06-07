import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';
import * as bootstrap from 'bootstrap';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { User } from '../../DataModels/userData.model';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { SnackbarService } from '../../Service/snackbar.service';
import { TransactionsService } from '../../Service/transactions.service';
import { Timestamp } from '@angular/fire/firestore';
import { Transactions } from '../../DataModels/transactionsData.model';
import { BankAccount } from '../../DataModels/bankAccountData.model';
import { UsersService } from '../../Service/users.service';
import { LoanAccount } from '../../DataModels/loanAccountData.model';
import { LoanService } from '../../Service/loan.service';

@Component({
  selector: 'app-loans',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss',
})
export class LoansComponent implements AfterViewInit, OnInit {
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');

  loanForm = new FormGroup({
    customerID: new FormControl('', []),
    customerName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]),
    bankID: new FormControl('', []),
    bankName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]),
    bankAccountNumber: new FormControl('', []),
    loanAmount: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
  });

  filterFormInputs = new FormGroup({
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  loanPaymentForm = new FormGroup({
    id: new FormControl('', []),
    customerID: new FormControl('', []),
    customerName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]),
    bankAccountId: new FormControl(''),
    bankName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
    ]),
    accountNumber: new FormControl('', [Validators.pattern('^[0-9]+$')]),
    loanBalance: new FormControl(),
    amount: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
    type: new FormControl('Loan Payment'),
  });

  get cusotmerNameControl() {
    return this.loanForm.get('customerName');
  }

  get bankNameControl() {
    return this.loanForm.get('bankName');
  }

  get loanAmountControl() {
    return this.loanForm.get('loanAmount');
  }

  get loanDescriptionControl() {
    return this.loanForm.get('description');
  }

  displayedColumns: string[] = [
    'bankName',
    'type',
    'amount',
    'description',
    'date',
    'options',
  ];

  bankSpinner = true;
  loanSpinner = true;
  tableSpinner = true;
  activeCustomerAccount: User[] = [];
  activeBankAccount: BankAccount[] = [];
  activeLoanAccount: LoanAccount[] = [];
  searchTerm: string = '';
  searchTermBank: string = '';
  filterCustomers = [...this.activeCustomerAccount];
  filterBankAccounts = [...this.activeBankAccount];
  activeLoanTransactions: Transactions[] = [];
  dataSource = new MatTableDataSource(this.activeLoanTransactions);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('loanPaymentViewModal') loanPaymentViewModal: any;
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;

  constructor(
    private bankAccountsService: BankAccountsService,
    private userService: UsersService,
    private loanService: LoanService,
    private transactionService: TransactionsService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.populateBankAccount();
    this.populateCustomerAccount();
    this.populateLoanAccount();
    this.populateTransactionTable(this.currentYear, this.currentMonth);
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchLoanTransaction'
    ) as HTMLInputElement;
    const clearButton = document.getElementById(
      'clearButtonLoan'
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

  populateBankAccount() {
    this.bankAccountsService
      .getAllBankAccounts()
      .then((accounts) => {
        this.bankSpinner = false;
        this.activeBankAccount = accounts;
      })
      .catch((error) => {
        this.snackbarService.show('Error Loading Bank Info', 'error');
        console.error('Error fetching bank accounts:', error);
      });
  }

  populateCustomerAccount() {
    this.userService
      .getCustomer('active')
      .then((customers) => {
        this.bankSpinner = false;
        this.activeCustomerAccount = customers;
      })
      .catch((error) => {
        this.snackbarService.show('Error Loading Customer Info', 'error');
        console.error('Error fetching User accounts:', error);
      });
  }

  populateLoanAccount() {
    this.loanService
      .getLoanAccounts()
      .then((loanAccounts) => {
        this.loanSpinner = false;
        this.activeLoanAccount = loanAccounts;
      })
      .catch((error) => {
        this.snackbarService.show('Error Loading Loan Accounts', 'error');
        console.error('Error fetching Loan accounts:', error);
      });
  }

  populateTransactionTable(year: number, month: number) {
    this.tableSpinner = true;
    this.transactionService
      .getLoanTransactionYearMonth(year, month)
      .then(async (transactions) => {
        this.tableSpinner = false;
        this.activeLoanTransactions = transactions;
        this.dataSource.data = this.activeLoanTransactions;
      })
      .catch((error) => {
        this.snackbarService.show(
          `Retrieving Loan Transactions Failed`,
          'error'
        );
        console.error('Error Retrieving Transactions:', error);
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  filterCust(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase(); // Extract the input value
    this.searchTerm = term;
    this.filterCustomers = this.activeCustomerAccount.filter((userAcc) =>
      userAcc.name.toLowerCase().includes(term)
    );
  }

  filterBankAcc(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase(); // Extract the input value
    this.searchTermBank = term;
    this.filterBankAccounts = this.activeBankAccount.filter((bankAcc) =>
      bankAcc.bankName.toLowerCase().includes(term)
    );
  }

  addCustToLoan(userAcc: User) {
    this.loanForm.patchValue({
      customerID: userAcc.id,
      customerName: userAcc.name,
    });
    this.searchTerm = '';
    this.filterCustomers = [];
  }

  addBankToLoan(bankAcc: BankAccount) {
    this.loanForm.patchValue({
      bankID: bankAcc.id,
      bankName: bankAcc.bankName,
      bankAccountNumber: bankAcc.accountNumber,
    });
    this.searchTermBank = '';
    this.filterBankAccounts = [];
  }

  clearNewloanForm() {
    this.loanForm.reset();
  }

  isProcessing = false;
  saveNewLoanForm() {
    if (this.loanForm.valid) {
      this.isProcessing = true;
      const formData = this.loanForm.value;

      // Convert form data to a partial Loan data model
      const partialLoanAcc: Partial<LoanAccount> = {
        customerID: formData.customerID!,
        customerName: formData.customerName!,
        bankName: formData.bankName!,
        bankAccountNumber: formData.bankAccountNumber!,
        bankID: formData.bankID!,
        loanAmount: Number(formData.loanAmount),
        balance: Number(formData.loanAmount),
        description: formData.description!,
      };

      // Add Bank Account and handle success or error
      this.loanService
        .addLoanAccount(
          partialLoanAcc,
          partialLoanAcc.bankID!,
          partialLoanAcc.customerID!
        )
        .then(() => {
          this.clearNewloanForm();
          this.snackbarService.show(
            'Loan Account Added Successfully!',
            'success'
          );
          this.populateLoanAccount();
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show(`Failed to Add Loan Account`, 'error');
          this.isProcessing = false;
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.loanForm.markAllAsTouched(); // Highlight invalid fields
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

  setloanInfo(loanAcc: LoanAccount) {
    this.loanPaymentForm.patchValue({
      id: loanAcc.id,
      customerName: loanAcc.customerName,
      customerID: loanAcc.customerID,
      loanBalance: loanAcc.balance,
    });
  }

  clearloanPaymentForm() {
    this.loanPaymentForm.reset();
    this.loanPaymentForm.patchValue({ date: this.formattedDate });
  }

  addBankToPayment(bankAcc: BankAccount) {
    this.loanPaymentForm.patchValue({
      bankAccountId: bankAcc.id,
      bankName: bankAcc.bankName,
      accountNumber: bankAcc.accountNumber,
    });
    this.searchTermBank = '';
    this.filterBankAccounts = [];
  }

  saveLoanPayment() {
    if (this.loanPaymentForm.valid) {
      this.isProcessing = true;
      const formData = this.loanPaymentForm.value;

      const [year, month, day] = formData.date!.split('-').map(Number);

      // Convert form data to a partial transaction data model
      const partialLoanPayment: Partial<any> = {
        id: formData.id,
        customerID: formData.customerID!,
        customerName: formData.customerName!,
        bankName: formData.bankName!,
        bankAccountNumber: formData.accountNumber!,
        bankID: formData.bankAccountId!,
        amount: Number(formData.amount),
        type: formData.type,
        description: 'Loan Payment for ' + formData.customerName,
        day,
        month,
        year,
      };

      // Add payment for loan
      this.loanService
        .receiveLoanPayment(partialLoanPayment)
        .then(() => {
          this.clearloanPaymentForm();
          this.snackbarService.show(
            'Loan Payment Added Successfully!',
            'success'
          );
          this.populateLoanAccount();
          this.populateTransactionTable(this.currentYear, this.currentMonth);
          this.isProcessing = false;
        })
        .catch((error) => {
          this.snackbarService.show(`Failed to Add Loan Payment`, 'error');
          this.isProcessing = false;
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.loanForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  filterLoanAcc() {
    const year = Number(this.filterFormInputs.value.year);
    const month = Number(this.filterFormInputs.value.month);

    this.tableSpinner = true;
    this.transactionService
      .getLoanTransactionYearMonth(year, month)
      .then(async (transactions) => {
        this.tableSpinner = false;
        this.activeLoanTransactions = transactions;
        this.dataSource.data = this.activeLoanTransactions;
      })
      .catch((error) => {
        this.snackbarService.show(
          `Retrieving Loan Transactions Failed`,
          'error'
        );
        console.error('Error Retrieving Transactions:', error);
      });
  }

  showLoanTransactionData: any = {} as any;
  viewTransaction(transactionData: Transactions) {
    this.showLoanTransactionData = transactionData; // Assign data

    if (this.loanPaymentViewModal) {
      const loanPaymentViewModal = new bootstrap.Modal(
        this.loanPaymentViewModal.nativeElement
      );
      loanPaymentViewModal.show();
    }
  }
}
