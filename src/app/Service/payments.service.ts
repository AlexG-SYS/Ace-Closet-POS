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
import { Payment } from '../DataModels/paymentData.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private paymentsCollection;

  constructor(private firestore: Firestore) {
    this.paymentsCollection = collection(this.firestore, 'payments');
  }

  // Add a new payment to Firestore
  async addPayment(data: Partial<Payment>): Promise<any> {
    try {
      data.createdAt = Timestamp.now();
      const batch = writeBatch(this.firestore);

      // Add payment to the payments collection
      const docRef = doc(this.paymentsCollection);
      batch.set(docRef, data);

      // Update user balance and invoice balance (if applicable)
      if (data.userId && data.amount && data.invoiceId) {
        await this.updateBalances(batch, data);
      }

      // If bankAccountId is provided, update the corresponding bank account
      if (data.bankAccountId) {
        const bankAccountRef = doc(
          this.firestore,
          `bankAccounts/${data.bankAccountId}`
        );
        const bankAccountSnap = await getDoc(bankAccountRef);

        if (bankAccountSnap.exists()) {
          const bankAccountData = bankAccountSnap.data();
          let bankBalance = bankAccountData['balance'];

          // Add the payment amount to the bank account balance
          bankBalance += data.amount;

          const updatedAt = Timestamp.now(); // Update the timestamp

          // Update the bank account balance and timestamp in batch
          batch.update(bankAccountRef, { balance: bankBalance, updatedAt });
        } else {
          throw new Error(
            `Bank Account with ID ${data.bankAccountId} not found.`
          );
        }
      } else {
        throw new Error(
          `Bank Account with ID ${data.bankAccountId} not found.`
        );
      }

      // Commit all changes atomically
      await batch.commit();
      return docRef; // Return the payment document reference
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error adding payment: ', error);
      throw new Error(message);
    }
  }

  private async updateBalances(batch: any, data: Partial<Payment>) {
    const userDocRef = doc(this.firestore, `users/${data.userId}`);
    const invoiceDocRef = doc(this.firestore, `invoices/${data.invoiceId}`);

    const [userDocSnap, invoiceDocSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(invoiceDocRef),
    ]);

    if (userDocSnap.exists() && invoiceDocSnap.exists()) {
      const userData = userDocSnap.data();
      const invoiceData = invoiceDocSnap.data();

      let paymentAmount = data.amount;
      let invoiceBalance = invoiceData['invoiceBalance'];
      let userBalance = userData['accountBalance'];
      let invoiceStatus = invoiceData['invoiceStatus'];

      // First, cover the invoice balance with the payment amount
      if (paymentAmount! >= invoiceBalance) {
        const excessAmount = paymentAmount! - invoiceBalance; // Calculate the excess

        // Fully pay the invoice and add the excess to the user balance
        userBalance -= invoiceBalance!;
        invoiceBalance = 0;
        userBalance -= excessAmount;
        invoiceStatus = 'Paid';
      } else {
        // If the payment amount is less than the invoice balance, just reduce the invoice balance
        invoiceBalance -= paymentAmount!;
        userBalance -= paymentAmount!;
        invoiceStatus = 'Partial';
      }

      const updatedAt = Timestamp.now();

      batch.update(userDocRef, { accountBalance: userBalance, updatedAt });
      batch.update(invoiceDocRef, {
        invoiceBalance,
        updatedAt,
        invoiceStatus: invoiceStatus,
      });
    }
  }

  // Retrieve payments filtered by year and month
  async getPaymentsFilterYearMonth(
    year: number,
    month: number
  ): Promise<any[]> {
    try {
      const paymentsQuery = query(
        this.paymentsCollection,
        where('year', '==', year),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(paymentsQuery);
      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Partial<Payment>),
      }));

      return payments;
    } catch (error) {
      console.error('Error retrieving payments: ', error);
      throw new Error('Failed to retrieve payments. Please try again later.');
    }
  }

  // Update an existing payment in Firestore
  async updatePayment(id: string, data: Partial<Payment>): Promise<void> {
    try {
      data.updatedAt = Timestamp.now();
      const docRef = doc(this.firestore, `payments/${id}`);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error updating payment with ID ${id}: `, error);
      throw new Error('Failed to update payment. Please try again later.');
    }
  }

  async addCreditToCustomer(data: Partial<Payment>): Promise<any> {
    try {
      data.createdAt = Timestamp.now();
      const batch = writeBatch(this.firestore);

      // Add payment to the payments collection
      const docRef = doc(this.paymentsCollection);
      batch.set(docRef, data);

      // Update user balance
      if (data.userId && data.amount) {
        const userDocRef = doc(this.firestore, `users/${data.userId}`);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          let userBalance = userData['accountBalance'] || 0;
          userBalance -= data.amount; // Add the amount to user balance

          batch.update(userDocRef, {
            accountBalance: userBalance,
            updatedAt: Timestamp.now(),
          });
        } else {
          throw new Error(`User with ID ${data.userId} not found.`);
        }
      }

      // Update bank account balance
      if (data.bankAccountId) {
        const bankAccountRef = doc(
          this.firestore,
          `bankAccounts/${data.bankAccountId}`
        );
        const bankAccountSnap = await getDoc(bankAccountRef);

        if (bankAccountSnap.exists()) {
          const bankAccountData = bankAccountSnap.data();
          let bankBalance = bankAccountData['balance'] || 0;
          bankBalance += data.amount; // Add the amount to bank balance

          batch.update(bankAccountRef, {
            balance: bankBalance,
            updatedAt: Timestamp.now(),
          });
        } else {
          throw new Error(
            `Bank Account with ID ${data.bankAccountId} not found.`
          );
        }
      }

      // Commit batch updates
      await batch.commit();
      return docRef; // Return the payment document reference
    } catch (error) {
      console.error('Error recording balance-only payment: ', error);
      throw new Error('Failed to process the payment.');
    }
  }
}
