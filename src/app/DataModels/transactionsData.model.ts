import { Timestamp } from 'firebase/firestore';

export interface Transactions {
  id: string; // Firestore document ID (optional)
  bankAccountId: string; // Reference to bank accounts collection
  bankName: string;
  accountNumber: string;
  amount: number; // Transaction amount
  type: string;
  description: string; // Transaction description
  day: number;
  month: number;
  year: number;
  createdAt: Timestamp; // Firestore timestamp
  updatedAt: Timestamp; // Firestore timestamp
}
