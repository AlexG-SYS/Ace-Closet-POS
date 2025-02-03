import { Timestamp } from 'firebase/firestore';

export interface Payment {
  id: string; // Unique identifier for the payment
  invoiceId: string; // Reference to the related invoice in the invoices collection
  invoiceNumber: number;
  userId: string; // Reference to the user who made the payment
  customerName: string;
  amount: number; // Amount paid
  paymentMethod: string; // Method of payment (e.g., Credit Card, Cash, Bank Transfer)
  paymentStatus: string; // Status of the payment (e.g., Pending, Completed, Failed)
  day: number;
  month: number;
  year: number;
  createdAt: Timestamp; // Timestamp of when the payment was created
  updatedAt: Timestamp; // Timestamp of the last payment update
}
