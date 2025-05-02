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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BankAccountsService {
  private bankAccountCollection;

  constructor(private firestore: Firestore) {
    this.bankAccountCollection = collection(this.firestore, 'bankAccounts');
  }

  // Add a new bank account to Firestore
  async addBankAccount(data: any): Promise<any> {
    try {
      data.createdAt = Timestamp.now();
      return await addDoc(this.bankAccountCollection, data);
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw new Error('Failed to add bank account. Please try again later.');
    }
  }

  // Retrieve all bank accounts
  getBankAccounts(): Observable<any[]> {
    return collectionData(this.bankAccountCollection, { idField: 'id' });
  }

  // Retrieve a bank account by its ID
  async getBankAccountById(id: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, `bankAccounts/${id}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Bank account not found.');
      }
    } catch (error) {
      console.error('Error retrieving bank account:', error);
      throw new Error(
        'Failed to retrieve bank account. Please try again later.'
      );
    }
  }

  // Update an existing bank account
  async updateBankAccount(id: string, data: any): Promise<void> {
    try {
      data.updatedAt = Timestamp.now();
      const docRef = doc(this.firestore, `bankAccounts/${id}`);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error updating bank account with ID ${id}:`, error);
      throw new Error('Failed to update bank account. Please try again later.');
    }
  }

  // Adjust the balance of a bank account
  async adjustBalance(bankName: string, amount: number): Promise<void> {
    try {
      const bankQuery = query(
        this.bankAccountCollection,
        where('bankName', '==', bankName)
      );
      const querySnapshot = await getDocs(bankQuery);

      if (!querySnapshot.empty) {
        const bankAccountDoc = querySnapshot.docs[0];
        const bankAccountData = bankAccountDoc.data();
        const bankAccountRef = bankAccountDoc.ref;

        let currentBalance = bankAccountData['balance'] || 0;
        currentBalance += amount;

        await updateDoc(bankAccountRef, {
          balance: currentBalance,
          updatedAt: Timestamp.now(),
        });
      } else {
        throw new Error(`Bank account with name ${bankName} not found.`);
      }
    } catch (error) {
      console.error('Error adjusting balance:', error);
      throw new Error('Failed to adjust balance. Please try again later.');
    }
  }

  // Method to get all bank accounts
  async getAllBankAccounts(): Promise<any[]> {
    const q = query(this.bankAccountCollection, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}
