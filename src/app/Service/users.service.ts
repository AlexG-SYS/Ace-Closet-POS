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
export class UsersService {
  private usersCollection;

  constructor(private firestore: Firestore) {
    this.usersCollection = collection(this.firestore, 'users');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.usersCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.usersCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `users/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
