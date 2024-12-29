import { Timestamp } from 'firebase/firestore';

export interface ShippingAddress {
  street: string;
  cityTown: string;
}

export interface WishlistItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  productColor: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string; // Unique identifier for the user
  name: string; // Full name of the user
  email: string; // Email address
  passwordHash: string; // Hashed password for authentication
  phoneNumber: string; // Contact number
  role: string; // Role of the user (e.g., "Customer", "Admin")
  shippingAddress?: ShippingAddress; // Shipping address, optional
  accountBalance?: number; // Balance in the user's account
  wishlist?: WishlistItem[]; // Array of wishlist items
  cart?: CartItem[]; // Array of cart items
  status: string; // Status of the user (e.g., "Active", "Inactive")
  lastLogin: Date; // Timestamp of the last login
  createdAt: Timestamp; // Timestamp of account creation
  updatedAt: Timestamp; // Timestamp of the last update
}
