import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  getDoc,
  limit,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transactions } from '../DataModels/transactionsData.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  private transactionsCollection;

  constructor(private firestore: Firestore) {
    this.transactionsCollection = collection(this.firestore, 'transactions');
  }

  // Add a new transaction with batch operations
  async addTransactionDepositExpenseWithdraw(data: any): Promise<any> {
    const db = this.firestore;
    const batch = writeBatch(db);
    const bankAccountRef = doc(db, `bankAccounts/${data.bankAccountId}`);

    try {
      data.createdAt = Timestamp.now();

      // Fetch bank account details
      const bankAccountSnap = await getDoc(bankAccountRef);
      if (!bankAccountSnap.exists()) {
        throw new Error(`Bank account ${data.bankName} does not exist.`);
      }

      const bankAccountData = bankAccountSnap.data();
      let currentBalance = bankAccountData?.['balance'] || 0;

      // Update balance based on transaction type
      if (data.type == 'Expense' || data.type == 'Withdraw') {
        currentBalance -= data.amount;
      } else if (data.type == 'Deposit') {
        currentBalance += data.amount;
      }

      // Ensure balance does not go negative
      if (currentBalance < 0) {
        throw new Error('Insufficient funds in the account.');
      }

      // Update the bank account balance
      batch.update(bankAccountRef, { balance: currentBalance });

      // Save the transaction
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, data);

      // Commit the batch
      await batch.commit();

      return transactionRef;
    } catch (error: any) {
      console.error('Error adding transaction:', error.message);
      throw new Error(error.message);
    }
  }

  async addBankTransfer(data: any): Promise<any> {
    const db = this.firestore;
    const batch = writeBatch(db);

    const oldBankAccountRef = doc(db, `bankAccounts/${data.oldBankAccountId}`);
    const newBankAccountRef = doc(db, `bankAccounts/${data.newBankAccountId}`);

    try {
      // Fetch old bank account details
      const oldBankSnap = await getDoc(oldBankAccountRef);
      if (!oldBankSnap.exists()) {
        throw new Error(`Old bank account ${data.oldBankName} does not exist.`);
      }

      // Fetch new bank account details
      const newBankSnap = await getDoc(newBankAccountRef);
      if (!newBankSnap.exists()) {
        throw new Error(`New bank account ${data.newBankName} does not exist.`);
      }

      let oldBalance = oldBankSnap.data()?.['balance'] || 0;
      let newBalance = newBankSnap.data()?.['balance'] || 0;

      // Ensure the old account has enough funds to transfer
      if (oldBalance < data.amount) {
        throw new Error(`Insufficient funds in account: ${data.oldBankName}`);
      }

      // Deduct from old account
      oldBalance -= data.amount;
      batch.update(oldBankAccountRef, {
        balance: oldBalance,
        updatedAt: Timestamp.now(), // Add updatedAt timestamp
      });

      // Add to new account
      newBalance += data.amount;
      batch.update(newBankAccountRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(), // Add updatedAt timestamp
      });

      // Save withdrawal transaction
      const withdrawTransactionRef = doc(collection(db, 'transactions'));
      batch.set(withdrawTransactionRef, {
        bankAccountId: data.oldBankAccountId,
        bankName: data.oldBankName,
        accountNumber: data.oldAccountNumber ?? '',
        amount: data.amount,
        type: 'Withdraw',
        description: data.description + '\n (Bank transfer - Withdrawal)',
        day: data.day,
        month: data.month,
        year: data.year,
        createdAt: Timestamp.now(),
      });

      const now = Timestamp.now();
      const oneSecondLater = new Timestamp(now.seconds + 1, now.nanoseconds);

      // Save deposit transaction
      const depositTransactionRef = doc(collection(db, 'transactions'));
      batch.set(depositTransactionRef, {
        bankAccountId: data.newBankAccountId,
        bankName: data.newBankName,
        accountNumber: data.newAccountNumber ?? '',
        amount: data.amount,
        type: 'Deposit',
        description: data.description + '\n (Bank transfer - Deposit)',
        day: data.day,
        month: data.month,
        year: data.year,
        createdAt: oneSecondLater,
      });

      // Commit the batch transaction
      await batch.commit();

      return { withdrawTransactionRef, depositTransactionRef };
    } catch (error: any) {
      console.error('Error processing bank transfer:', error.message);
      throw new Error(error.message);
    }
  }

  async getTransactionYearMonth(year: number, month: number): Promise<any[]> {
    try {
      const transactionsQuery = query(
        this.transactionsCollection,
        where('year', '==', year),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(transactionsQuery);

      // Map the query snapshot to an array of transaction objects
      const transactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // Spread the transaction data
      }));

      return transactions; // Return the list of transactions if successful
    } catch (error) {
      console.error('Error retrieving transactions: ', error);
      throw new Error(
        'Failed to retrieve transactions. Please try again later.'
      );
    }
  }

  async getTransactionsFilterAll(
    year: number,
    month: number,
    bankAccountId: string
  ): Promise<any[]> {
    try {
      const transactionsQuery = query(
        this.transactionsCollection,
        where('year', '==', year),
        where('month', '==', month),
        where('bankAccountId', '==', bankAccountId),
        orderBy('createdAt', 'desc')
      );

      // Fetch transaction documents
      const querySnapshot = await getDocs(transactionsQuery);

      // Map the query snapshot to an array of transaction objects
      const transactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      return transactions;
    } catch (error) {
      console.error('Error retrieving transactions: ', error);
      throw new Error(
        'Failed to retrieve transactions. Please try again later.'
      );
    }
  }
}
