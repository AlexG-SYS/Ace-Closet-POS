import { Timestamp } from 'firebase/firestore';

export interface LoanAccount {
  id: string; // Unique identifier
  bankID: string;
  bankName: string;
  bankAccountNumber: string;
  customerID: string;
  customerName: string;
  loanAmount: number;
  balance: number;
  createdAt: Timestamp; // Timestamp of when the payment was created
  updatedAt: Timestamp; // Timestamp of the last payment update
}
