import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  setDoc,
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

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.bankAccountCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.bankAccountCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `bankAccounts/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
