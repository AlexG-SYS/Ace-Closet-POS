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
  async addTransactionDepositExpense(data: any): Promise<any> {
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
      if (data.type == 'Expense') {
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
}
