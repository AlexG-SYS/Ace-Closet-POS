import { Timestamp } from 'firebase/firestore';

export interface BankAccount {
  id: string; // Unique identifier
  bankName: string;
  accountNumber: string;
  startingAmount: number;
  balance: number;
  createdAt: Timestamp; // Timestamp of when the payment was created
  updatedAt: Timestamp; // Timestamp of the last payment update
}
