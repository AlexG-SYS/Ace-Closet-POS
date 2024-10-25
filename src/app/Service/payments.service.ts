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
export class PaymentsService {
  private paymentsCollection;

  constructor(private firestore: Firestore) {
    this.paymentsCollection = collection(this.firestore, 'payments');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.paymentsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.paymentsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `payments/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
