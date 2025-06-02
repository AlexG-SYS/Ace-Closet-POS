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
export class OrdersService {
  private ordersCollection;

  constructor(private firestore: Firestore) {
    this.ordersCollection = collection(this.firestore, 'orders');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.ordersCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.ordersCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `orders/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
