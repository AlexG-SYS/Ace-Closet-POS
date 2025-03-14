import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
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

  // Add a new user to Firestore
  async addCustomer(data: any): Promise<any> {
    try {
      data.createdAt = Timestamp.now();
      const docRef = await addDoc(this.usersCollection, data); // Await the Firestore operation
      return docRef; // Return the document reference if successful
    } catch (error) {
      console.error('Error adding user: ', error); // Log the error for debugging
      throw new Error('Failed to add user. Please try again later.'); // Throw a custom error message
    }
  }

  // Retrieve active users from Firestore
  async getCustomer(status: string): Promise<any[]> {
    try {
      const activeUsersQuery = query(
        this.usersCollection,
        where('status', '==', status),
        where('role', '==', 'customer'),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(activeUsersQuery); // Await the Firestore operation
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Partial<User>),
      }));
      return users; // Return the list of active users if successful
    } catch (error) {
      console.error('Error retrieving active users: ', error); // Log the error for debugging
      throw new Error(
        'Failed to retrieve active users. Please try again later.'
      ); // Throw a custom error message
    }
  }

  // Update an existing user in Firestore
  async updateCustomer(id: string, data: any): Promise<void> {
    try {
      data.updatedAt = Timestamp.now();
      const docRef = doc(this.firestore, `users/${id}`);
      await setDoc(docRef, data, { merge: true }); // Await the Firestore operation
    } catch (error) {
      console.error(`Error updating user with ID ${id}: `, error); // Log the error for debugging
      throw new Error('Failed to update user. Please try again later.'); // Throw a custom error message
    }
  }

  // Get a user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return { ...(userDocSnap.data() as User) };
      } else {
        console.warn(`User with ID ${userId} not found.`);
        return null;
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
      throw new Error('Failed to retrieve user. Please try again later.');
    }
  }
}
