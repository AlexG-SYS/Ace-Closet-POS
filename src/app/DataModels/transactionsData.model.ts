import { Timestamp } from 'firebase/firestore';

export interface Transactions {
  id: string; // Firestore document ID (optional)
  status: string;
  bankAccountId: string; // Reference to bank accounts collection
  bankName: string;
  accountNumber: string;
  amount: number; // Transaction amount
  type: string;
  description: string; // Transaction description
  day: number;
  month: number;
  year: number;
  timestamp: Timestamp;
  createdAt: Timestamp; // Firestore timestamp
  updatedAt: Timestamp; // Firestore timestamp
}
