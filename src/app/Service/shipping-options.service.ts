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
export class ShippingOptionsService {
  private shippingOptionsCollection;

  constructor(private firestore: Firestore) {
    this.shippingOptionsCollection = collection(
      this.firestore,
      'shippingOptions'
    );
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.shippingOptionsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.shippingOptionsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `shippingOptions/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
