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
export class TransactionsService {
  private transactionsCollection;

  constructor(private firestore: Firestore) {
    this.transactionsCollection = collection(this.firestore, 'transactions');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.transactionsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.transactionsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `transactions/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
