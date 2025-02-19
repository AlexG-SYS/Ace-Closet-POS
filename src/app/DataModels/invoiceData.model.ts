import { Timestamp } from 'firebase/firestore';
import { Product } from './productData.model';
import { User } from './userData.model';

export interface Invoice {
  id: string;
  orderId: string; // Reference to orders collection
  customer: Partial<User>;
  invoiceNumber: number; // Unique invoice number
  invoiceBalance: number; // Balance due on the invoice
  salesRep: string; // Sales representative handling the invoice
  products: Product[]; // Array of product details
  grandTotal: number; // Total amount after taxes and adjustments
  subTotal: number; // Total before taxes
  taxTotal: number; // Total tax amount
  discount: number; // Total discount amount
  invoiceStatus: 'Past Due' | 'Paid' | 'Partial' | 'Pending'; // Status of the invoice
  dueDate: string; // Due date for payment
  memo: string; // Additional notes or memo for the invoice
  year: number;
  month: number;
  day: number;
  createdAt: Timestamp; // Timestamp when the invoice was issued
  updatedAt: Timestamp; // Timestamp for the last update
}
