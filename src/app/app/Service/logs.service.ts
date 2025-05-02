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
export class LogsService {
  private logsCollection;

  constructor(private firestore: Firestore) {
    this.logsCollection = collection(this.firestore, 'logs');
  }

  // Method to write data to Firestore
  addItem(data: any): Promise<any> {
    return addDoc(this.logsCollection, data);
  }

  // Method to read data from Firestore
  getItems(): Observable<any[]> {
    return collectionData(this.logsCollection, { idField: 'id' });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `logs/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
