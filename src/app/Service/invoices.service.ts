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
export class InvoicesService {
  private invoicesCollection;

  constructor(private firestore: Firestore) {
    this.invoicesCollection = collection(this.firestore, 'invoices');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.invoicesCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.invoicesCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `invoices/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
