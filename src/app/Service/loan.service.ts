import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { LoanAccount } from '../DataModels/loanAccountData.model';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private loanCollection;

  constructor(private firestore: Firestore) {
    this.loanCollection = collection(this.firestore, 'loans');
  }

  // Add a new Loan to Firestore
  async addLoanAccount(
    data: Partial<LoanAccount>,
    bankAccountId: string,
    customerId: string
  ): Promise<void> {
    const loanAmount = data.loanAmount || 0;

    const bankRef = doc(this.firestore, 'bankAccounts', bankAccountId);
    const customerRef = doc(this.firestore, 'users', customerId);
    const loanRef = doc(this.loanCollection); // auto-generated loan doc
    const transactionRef = doc(collection(this.firestore, 'transactions')); // auto-generated transaction doc

    try {
      // Step 1: Get current balances
      const [bankSnap, customerSnap] = await Promise.all([
        getDoc(bankRef),
        getDoc(customerRef),
      ]);

      if (!bankSnap.exists()) throw new Error('Bank account not found');
      if (!customerSnap.exists()) throw new Error('Customer not found');

      const bankData = bankSnap.data();
      const customerData = customerSnap.data();

      const currentBankBalance = bankData['balance'] || 0;
      const currentCustomerBalance = customerData['accountBalance'] || 0;

      // Step 2: Check funds
      if (currentBankBalance < loanAmount) {
        throw new Error('Insufficient funds in the bank account.');
      }

      const newBankBalance = currentBankBalance - loanAmount;
      const newCustomerBalance = currentCustomerBalance + loanAmount;

      // Step 3: Prepare transaction metadata
      const now = Timestamp.now();
      const date = now.toDate();
      const day = date.getDate();
      const month = date.getMonth() + 1; // getMonth is 0-indexed
      const year = date.getFullYear();

      // Step 4: Prepare batch
      const batch = writeBatch(this.firestore);

      // Add loan
      batch.set(loanRef, {
        ...data,
        createdAt: now,
      });

      // Update balances
      batch.update(bankRef, { balance: newBankBalance });
      batch.update(customerRef, { accountBalance: newCustomerBalance });

      // Add transaction (as a Deposit into customer account)
      batch.set(transactionRef, {
        type: 'Loan Disbursement',
        customerId,
        loanId: loanRef.id,
        timestamp: Timestamp.now(),
        accountNumber: bankData['accountNumber'],
        amount: loanAmount,
        bankAccountId,
        bankName: bankData['bankName'],
        createdAt: Timestamp.now(),
        day,
        month,
        year,
        description: `Loan Issued to ${customerData['name'] || 'customer'}`,
      });

      // Step 5: Commit batch
      await batch.commit();

      console.log('Loan, balances, and transaction recorded successfully.');
    } catch (error) {
      console.error('Failed to process loan:', error);
      throw new Error('Loan transaction failed. Please try again.');
    }
  }

  // Retrieve all loan accounts
  async getLoanAccounts(): Promise<any[]> {
    const q = query(this.loanCollection, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async receiveLoanPayment(loanPayment: any): Promise<void> {
    const loanRef = doc(this.firestore, 'loans', loanPayment.id);
    const bankRef = doc(this.firestore, 'bankAccounts', loanPayment.bankID);
    const customerRef = doc(this.firestore, 'users', loanPayment.customerID);
    const transactionRef = doc(collection(this.firestore, 'transactions'));

    try {
      const [loanSnap, bankSnap, customerSnap] = await Promise.all([
        getDoc(loanRef),
        getDoc(bankRef),
        getDoc(customerRef),
      ]);

      if (!loanSnap.exists()) throw new Error('Loan not found');
      if (!bankSnap.exists()) throw new Error('Bank account not found');
      if (!customerSnap.exists()) throw new Error('Customer not found');

      const loanData = loanSnap.data();
      const bankData = bankSnap.data();
      const customerData = customerSnap.data();

      const currentCustomerBalance = customerData['accountBalance'] || 0;
      const currentBankBalance = bankData['balance'] || 0;
      const remainingBalance = loanData['balance'];

      const newCustomerBalance = currentCustomerBalance - loanPayment.amount;
      const newBankBalance = currentBankBalance + loanPayment.amount;
      const newRemainingBalance = remainingBalance - loanPayment.amount;

      const batch = writeBatch(this.firestore);

      // Update loan
      batch.update(loanRef, {
        balance: Math.max(newRemainingBalance, 0),
        status: newRemainingBalance <= 0 ? 'Paid' : 'Active',
      });

      // Update balances
      batch.update(customerRef, { accountBalance: newCustomerBalance });
      batch.update(bankRef, { balance: newBankBalance });

      // Log transaction
      batch.set(transactionRef, {
        accountNumber: loanPayment.bankAccountNumber,
        amount: loanPayment.amount,
        bankAccountId: loanPayment.bankID,
        bankName: loanPayment.bankName,
        day: loanPayment.day,
        month: loanPayment.month,
        year: loanPayment.year,
        type: loanPayment.type,
        description: loanPayment.description,
        createdAt: Timestamp.now(),
      });

      await batch.commit();

      console.log('Loan payment received successfully.');
    } catch (error) {
      console.error('Error receiving loan payment:', error);
      throw new Error('Failed to receive loan payment. Please try again.');
    }
  }
}
