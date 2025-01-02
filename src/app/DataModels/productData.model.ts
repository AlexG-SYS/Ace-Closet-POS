import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string; // Unique identifier for the product
  upc: string; // Unique identifier for the product
  productName: string; // Name of the product
  productColor: string; // Color of the product
  description: string; // Detailed description of the product
  price: number; // Selling price of the product
  cost: number; // Cost price of the product
  online: boolean; // Availability status for online sales
  category: string; // Product category
  quantity: number; // Stock quantity
  size: string; // Product size
  status: string; // Status of the product (e.g., Active, Inactive)
  tax: boolean; // Indicates if tax applies
  gst: number; // GST
  discount: number; // Discount percentage
  images: string[]; // Array of image URLs
  tags: string; // Tags like "New Arrival" or "Sale"
  createdAt: Timestamp; // Timestamp of product creation
  updatedAt: Timestamp; // Timestamp of the last product update
}
