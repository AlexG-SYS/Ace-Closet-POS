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
export class RefundsService {
  private refundsCollection;

  constructor(private firestore: Firestore) {
    this.refundsCollection = collection(this.firestore, 'refunds');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.refundsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.refundsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `refunds/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}