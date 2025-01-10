import { Timestamp } from 'firebase/firestore';
import { Product } from './productData.model';

export interface Invoice {
  id: string;
  orderId: string; // Reference to orders collection
  userId: string; // Customer ID
  invoiceNumber: number; // Unique invoice number
  invoiceBalance: number; // Balance due on the invoice
  salesRep: string; // Sales representative handling the invoice
  products: Product[]; // Array of product details
  grandTotal: number; // Total amount after taxes and adjustments
  subTotal: number; // Total before taxes
  taxTotal: number; // Total tax amount
  invoiceStatus: 'Past Due' | 'Paid' | 'Partial'; // Status of the invoice
  dueDate: Timestamp; // Due date for payment
  memo: string; // Additional notes or memo for the invoice
  year: number;
  month: number;
  day: number;
  createdAt: Timestamp; // Timestamp when the invoice was issued
  updatedAt: Timestamp; // Timestamp for the last update
}
