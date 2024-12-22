import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../DataModels/userData.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private usersCollection;

  constructor(private firestore: Firestore) {
    this.usersCollection = collection(this.firestore, 'users');
  }

  addUser(data: any): Promise<any> {
    data.createdAt = Timestamp.now();

    return new Promise((resolve, reject) => {
      try {
        // Attempt to add the document to Firestore
        addDoc(this.usersCollection, data)
          .then((docRef) => {
            resolve(docRef); // Resolve with the document reference if successful
          })
          .catch((error) => {
            reject(error); // Reject with the error if something goes wrong
          });
      } catch (error) {
        reject(error); // Catch any synchronous errors and reject the promise
      }
    });
  }

  // Method to retrieve active users
  getActiveUsers(): Promise<any[]> {
    const activeUsersQuery = query(
      this.usersCollection,
      where('status', '==', 'active'),
      where('role', '==', 'customer'),
      orderBy('name', 'asc')
    );

    return new Promise((resolve, reject) => {
      try {
        getDocs(activeUsersQuery)
          .then((querySnapshot) => {
            const users = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Partial<User>),
            }));
            resolve(users); // Resolve with the list of active users
          })
          .catch((error) => {
            reject(error); // Reject with the error if something goes wrong
          });
      } catch (error) {
        reject(error); // Catch any synchronous errors and reject the promise
      }
    });
  }

  // Method to update a specific document
  updateItem(id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `users/${id}`);
    return setDoc(docRef, data, { merge: true });
  }
}
