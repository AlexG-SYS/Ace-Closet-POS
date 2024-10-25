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
export class CategoriesService {
  private categoriesCollection;

  constructor(private firestore: Firestore) {
    this.categoriesCollection = collection(this.firestore, 'categories');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.categoriesCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.categoriesCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `categories/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
