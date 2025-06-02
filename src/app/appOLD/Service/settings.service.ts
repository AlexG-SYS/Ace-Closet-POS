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
export class SettingsService {
  private settingsCollection;

  constructor(private firestore: Firestore) {
    this.settingsCollection = collection(this.firestore, 'settings');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.settingsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.settingsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `settings/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
