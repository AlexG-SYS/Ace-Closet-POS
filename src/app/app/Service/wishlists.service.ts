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
export class WishlistsService {
  private wishlistsCollection;

  constructor(private firestore: Firestore) {
    this.wishlistsCollection = collection(this.firestore, 'wishlists');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.wishlistsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.wishlistsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `wishlists/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
