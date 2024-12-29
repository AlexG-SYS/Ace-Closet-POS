import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string; // Unique identifier for the user
  name: string; // Full name of the user
  createdAt: Timestamp; // Timestamp of account creation
  updatedAt: Timestamp; // Timestamp of the last update
}
