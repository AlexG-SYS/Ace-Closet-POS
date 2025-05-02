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
        throw new Error(`Bank Account ${data.bankName} Does not Exist.`);
      }

      const bankAccountData = bankAccountSnap.data();
      let currentBalance = bankAccountData?.['balance'] || 0;

      // Update balance based on transaction type
      if (
        data.type == 'Expense' ||
        data.type == 'Withdraw' ||
        data.type == 'Asset Purchase'
      ) {
        currentBalance -= data.amount;
      } else if (data.type == 'Deposit') {
        currentBalance += data.amount;
      }

      // Ensure balance does not go negative
      if (currentBalance < 0) {
        throw new Error('Insufficient Funds in the Account.');
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
      console.error('Error Adding Transaction:', error.message);
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
        throw new Error(`Old Bank Account ${data.oldBankName} Does not Exist.`);
      }

      // Fetch new bank account details
      const newBankSnap = await getDoc(newBankAccountRef);
      if (!newBankSnap.exists()) {
        throw new Error(`New Bank Account ${data.newBankName} Does not Exist.`);
      }

      let oldBalance = oldBankSnap.data()?.['balance'] || 0;
      let newBalance = newBankSnap.data()?.['balance'] || 0;

      // Ensure the old account has enough funds to transfer
      if (oldBalance < data.amount) {
        throw new Error(`Insufficient Funds in Account: ${data.oldBankName}`);
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
      console.error('Error Processing Bank Transfer:', error.message);
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
      console.error('Error Retrieving Transactions: ', error);
      throw new Error(
        'Failed to Retrieve Transactions. Please try Again Later.'
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
      console.error('Error Retrieving Transactions: ', error);
      throw new Error(
        'Failed to Retrieve Transactions. Please try Again Later.'
      );
    }
  }

  async getExpenseByDateRange(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const [startYear, startMonth, startDay] = startDate
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

      const startTimestamp = Timestamp.fromDate(
        new Date(startYear, startMonth - 1, startDay)
      );

      const endTimestamp = Timestamp.fromDate(
        new Date(endYear, endMonth - 1, endDay)
      );

      // Create a query to fetch payments within the specified date range
      const paymentsQuery = query(
        this.transactionsCollection,
        where('type', '==', 'Expense'),
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc')
      );

      // Execute the query and retrieve the documents
      const querySnapshot = await getDocs(paymentsQuery);

      // Map the query results to an array of payment objects
      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Partial<Transactions>),
      }));

      return payments; // Return the list of payments
    } catch (error) {
      console.error('Error Retrieving Expense by Date Range: ', error);
      throw new Error('Failed to Retrieve Expense. Please try Again Later.');
    }
  }

  async getExpenseByMonthYear(month: number, year: number): Promise<any[]> {
    try {
      // Create a query to fetch payments for the specified month and year
      const paymentsQuery = query(
        this.transactionsCollection,
        where('type', '==', 'Expense'),
        where('year', '==', year),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );

      // Execute the query and retrieve the documents
      const querySnapshot = await getDocs(paymentsQuery);

      // Map the query results to an array of payment objects
      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Partial<Transactions>),
      }));

      return payments; // Return the list of payments
    } catch (error) {
      console.error('Error Retrieving Expense by Month and Year: ', error);
      throw new Error('Failed to Retrieve Expense. Please try Again Later.');
    }
  }

  async voidTransaction(transactionId: string): Promise<void> {
    const db = this.firestore;
    const transactionRef = doc(db, `transactions/${transactionId}`);

    try {
      const transactionSnap = await getDoc(transactionRef);
      if (!transactionSnap.exists()) {
        throw new Error(`Transaction ${transactionId} does not exist.`);
      }

      const transactionData = transactionSnap.data();
      if (!transactionData) {
        throw new Error(`Invalid transaction data for ${transactionId}.`);
      }

      const bankAccountRef = doc(
        db,
        `bankAccounts/${transactionData['bankAccountId']}`
      );
      const bankAccountSnap = await getDoc(bankAccountRef);
      if (!bankAccountSnap.exists()) {
        throw new Error(
          `Bank Account ${transactionData['bankAccountId']} does not exist.`
        );
      }

      const bankAccountData = bankAccountSnap.data();
      let currentBalance = bankAccountData?.['balance'] || 0;

      const batch = writeBatch(db);

      switch (transactionData['type']) {
        case 'Deposit':
          currentBalance -= transactionData['amount'];
          break;
        case 'Expense':
        case 'Withdraw':
        case 'Asset Purchase':
          currentBalance += transactionData['amount'];
          break;
        default:
          throw new Error(
            `Unknown transaction type: ${transactionData['type']}`
          );
      }

      // Ensure balance is not negative
      if (currentBalance < 0) {
        throw new Error(
          'Voiding this transaction would result in negative balance.'
        );
      }

      // Update bank account balance
      batch.update(bankAccountRef, { balance: currentBalance });

      // Mark the transaction as voided instead of deleting it
      batch.update(transactionRef, {
        status: 'Voided',
        voidedAt: Timestamp.now(),
      });

      await batch.commit();
    } catch (error: any) {
      console.error('Error voiding transaction:', error.message);
      throw new Error(error.message);
    }
  }

  async getLoanTransactionYearMonth(
    year: number,
    month: number
  ): Promise<any[]> {
    try {
      const transactionsQuery = query(
        this.transactionsCollection,
        where('year', '==', year),
        where('month', '==', month),
        where('type', 'in', ['Loan Payment', 'Loan Disbursement']),
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
      console.error('Error Retrieving Transactions: ', error);
      throw new Error(
        'Failed to Retrieve Transactions. Please try Again Later.'
      );
    }
  }
}
