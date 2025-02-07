import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { BankAccount } from '../../DataModels/bankAccountData.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import { Transactions } from '../../DataModels/transactionsData.model';
import { TransactionsService } from '../../Service/transactions.service';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.scss',
})
export class BankAccountsComponent implements AfterViewInit, OnInit {
  today = new Date();
  formattedDate = this.today.toLocaleDateString('en-CA');

  bankForm = new FormGroup({
    id: new FormControl('', []),
    bankName: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]+$/),
      Validators.maxLength(25),
    ]),
    accountNumber: new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9]+$'),
      Validators.maxLength(25),
    ]),
    startingAmount: new FormControl('', [Validators.required]),
  });

  filterFormInputs = new FormGroup({
    bankAcc: new FormControl('-1'),
    year: new FormControl(new Date().getFullYear()),
    month: new FormControl(this.today.getMonth() + 1),
  });

  bankDepositForm = new FormGroup({
    id: new FormControl('', []),
    bankAccountId: new FormControl(''),
    bankName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
    accountNumber: new FormControl('', [Validators.pattern('^[0-9]+$')]),
    amount: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
    type: new FormControl(''),
  });

  bankExpenseForm = new FormGroup({
    id: new FormControl('', []),
    bankAccountId: new FormControl(''),
    bankName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
    accountNumber: new FormControl('', [Validators.pattern('^[0-9]+$')]),
    amount: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    date: new FormControl(this.formattedDate),
    type: new FormControl(''),
  });

  get bankNameControl() {
    return this.bankForm.get('bankName');
  }

  get accountNumberControl() {
    return this.bankForm.get('accountNumber');
  }

  get startingAmountControl() {
    return this.bankForm.get('startingAmount');
  }

  bankSpinner = true;
  tableSpinner = true;
  activeBankAccount: BankAccount[] = [];
  modalData = false;
  activeTransactions: Transactions[] = [];
  dataSource = new MatTableDataSource(this.activeTransactions);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  currentYear = new Date().getFullYear();
  lastYear = new Date().getFullYear() - 1;
  currentMonth = new Date().getMonth() + 1;

  displayedColumns: string[] = [
    'bankName',
    'type',
    'amount',
    'description',
    'date',
    'options',
  ];

  constructor(
    private bankAccountsService: BankAccountsService,
    private transactionService: TransactionsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.populateBankAccount();
    this.populateTransactionTable(this.currentYear, this.currentMonth);
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchTransaction'
    ) as HTMLInputElement;
    const clearButton = document.getElementById(
      'clearButtonTransaction'
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
        console.error('Error fetching bank accounts:', error);
      });
  }

  populateTransactionTable(year: number, month: number) {
    this.tableSpinner = true;
    this.transactionService
      .getTransactionYearMonth(year, month)
      .then(async (transactions) => {
        this.tableSpinner = false;
        this.activeTransactions = transactions;
        this.dataSource.data = this.activeTransactions;
      })
      .catch((error) => {
        this.showSnackBar(`Retrieving Transactions Failed`, 'error');
        console.error('Error retrieving active Transactions:', error);
      });
  }

  clearNewBankForm() {
    this.bankForm.reset();
  }

  newBankAccount() {
    if (this.bankForm.valid) {
      const formData = this.bankForm.value;
      // Convert form data to a partial User data model
      const partialBankAcc: Partial<BankAccount> = {
        bankName: formData.bankName!,
        accountNumber: formData.accountNumber!,
        startingAmount: Number(formData.startingAmount),
        balance: Number(formData.startingAmount),
      };

      // Add Bank Account and handle success or error
      this.bankAccountsService
        .addBankAccount(partialBankAcc)
        .then(() => {
          this.clearNewBankForm();
          this.modalData = false;
          this.showSnackBar('User added successfully!', 'success');
          this.populateBankAccount();
        })
        .catch((error) => {
          this.showSnackBar(`Failed to add user`, 'error');
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.bankForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  updateBankAccount() {}

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

  filterBankAcc() {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  setBankInfo(type: string, bankAcc: BankAccount) {
    if (type == 'Deposit') {
      this.bankDepositForm.patchValue({
        bankName: bankAcc.bankName,
        accountNumber: bankAcc.accountNumber,
        bankAccountId: bankAcc.id,
        type: type,
      });
    } else if (type == 'Expense') {
      this.bankExpenseForm.patchValue({
        bankName: bankAcc.bankName,
        accountNumber: bankAcc.accountNumber,
        bankAccountId: bankAcc.id,
        type: type,
      });
    } else if (type == 'Transfer') {
    }
  }

  saveBankDeposit() {
    if (this.bankDepositForm.valid) {
      const formData = this.bankDepositForm.value;
      const [year, month, day] = formData.date!.split('-').map(Number);

      // Convert form data to a partial Payment data model
      const partialDeposit: Partial<Transactions> = {
        bankAccountId: formData.bankAccountId!,
        bankName: formData.bankName!,
        accountNumber: formData.accountNumber || '',
        amount: Number(formData.amount),
        type: formData.type!,
        description: formData.description!,
        day: day,
        month: month,
        year: year,
      };

      this.transactionService
        .addTransactionDepositExpense(partialDeposit)
        .then(() => {
          this.showSnackBar('Deposit Applied Successfully!', 'success');
          this.populateBankAccount();
          this.populateTransactionTable(this.currentYear, this.currentMonth);
          this.clearBankDepositForm();
        })
        .catch((error) => {
          this.showSnackBar(error.message, 'error');
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.bankForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  clearBankDepositForm() {
    this.bankDepositForm.reset();
    this.bankDepositForm.get('date')?.setValue(this.formattedDate);
  }

  saveBankExpense() {
    if (this.bankExpenseForm.valid) {
      const formData = this.bankExpenseForm.value;
      const [year, month, day] = formData.date!.split('-').map(Number);

      // Convert form data to a partial Payment data model
      const partialExpense: Partial<Transactions> = {
        bankAccountId: formData.bankAccountId!,
        bankName: formData.bankName!,
        accountNumber: formData.accountNumber || '',
        amount: Number(formData.amount),
        type: formData.type!,
        description: formData.description!,
        day: day,
        month: month,
        year: year,
      };

      this.transactionService
        .addTransactionDepositExpense(partialExpense)
        .then(() => {
          this.showSnackBar('Expense Applied Successfully!', 'success');
          this.populateBankAccount();
          this.populateTransactionTable(this.currentYear, this.currentMonth);
          this.clearBankExpenseForm();
        })
        .catch((error) => {
          this.showSnackBar(error.message, 'error');
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.bankForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  clearBankExpenseForm() {
    this.bankExpenseForm.reset();
    this.bankExpenseForm.get('date')?.setValue(this.formattedDate);
  }

  showSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
