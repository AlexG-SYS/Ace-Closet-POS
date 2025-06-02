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
export class CartsService {
  private cartsCollection;

  constructor(private firestore: Firestore) {
    this.cartsCollection = collection(this.firestore, 'carts');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.cartsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.cartsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `carts/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
