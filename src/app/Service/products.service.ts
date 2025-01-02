import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product } from '../DataModels/productData.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private productsCollection;

  constructor(private firestore: Firestore) {
    this.productsCollection = collection(this.firestore, 'products');
  }

  // Method to write data to Firestore
  async addProduct(data: any): Promise<any> {
    try {
      // Add the createdAt timestamp before saving the product
      data.createdAt = Timestamp.now();
      // Add the product data to the Firestore products collection
      const docRef = await addDoc(this.productsCollection, data); // Await the Firestore operation
      return docRef; // Return the document reference if successful
    } catch (error) {
      console.error('Error adding product: ', error); // Log the error for debugging
      throw new Error('Failed to add product. Please try again later.'); // Throw a custom error message
    }
  }

  // Method to read data from Firestore
  async getProducts(status: string): Promise<any[]> {
    try {
      // Query the products collection based on the status (Active, Inactive, etc.)
      const productsQuery = query(
        this.productsCollection,
        where('status', '==', status),
        orderBy('productName', 'asc') // Optionally order by product name or other field
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(productsQuery);

      // Map the query snapshot to an array of product objects
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Partial<Product>), // Spread the product data
      }));

      return products; // Return the list of products if successful
    } catch (error) {
      console.error('Error retrieving products: ', error); // Log the error for debugging
      throw new Error('Failed to retrieve products. Please try again later.'); // Throw a custom error message
    }
  }

  // Update an existing product in Firestore
  async updateProduct(id: string, data: any): Promise<void> {
    try {
      data.updatedAt = Timestamp.now();
      const docRef = doc(this.firestore, `products/${id}`);
      await setDoc(docRef, data, { merge: true }); // Await the Firestore operation
    } catch (error) {
      console.error(`Error updating product with ID ${id}: `, error); // Log the error for debugging
      throw new Error('Failed to update product. Please try again later.'); // Throw a custom error message
    }
  }
}
