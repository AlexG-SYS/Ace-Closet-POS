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
export class CouponsService {
  private couponsCollection;

  constructor(private firestore: Firestore) {
    this.couponsCollection = collection(this.firestore, 'coupons');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.couponsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.couponsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `coupons/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
