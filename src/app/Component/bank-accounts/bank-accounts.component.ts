import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { BankAccount } from '../../DataModels/bankAccountData.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.scss',
})
export class BankAccountsComponent implements AfterViewInit, OnInit {
  tableSpinner = true;
  activeBankAccount: BankAccount[] = [];

  constructor(
    private bankAccountsService: BankAccountsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.populateBankAccount();
  }

  ngAfterViewInit() {}

  populateBankAccount() {
    this.bankAccountsService
      .getAllBankAccounts()
      .then((accounts) => {
        this.activeBankAccount = accounts;
      })
      .catch((error) => {
        console.error('Error fetching bank accounts:', error);
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
}
