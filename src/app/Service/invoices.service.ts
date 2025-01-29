import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  getDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoicesService {
  private invoicesCollection;

  constructor(private firestore: Firestore) {
    this.invoicesCollection = collection(this.firestore, 'invoices');
  }

  async addInvoice(data: any): Promise<any> {
    const db = this.firestore; // Firestore instance
    const batch = writeBatch(db); // Firestore batch operation
    const productsCollection = collection(db, 'products'); // Reference to products collection

    try {
      data.createdAt = Timestamp.now(); // Add timestamp

      // Fetch product details from Firestore
      const productUpdates: { ref: any; newQuantity: number }[] = [];

      for (const item of data.products) {
        // Reference the product document directly
        const productRef = doc(productsCollection, item.id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          throw new Error(`Product ${item.id} does not exist.`);
        }

        const productData = productSnap.data();
        const currentStock = productData?.['quantity'] || 0;

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient Stock for Product:   ${item?.['productName']}`
          );
        }

        // Deduct the purchased quantity
        const newQuantity = currentStock - item.quantity;
        productUpdates.push({ ref: productRef, newQuantity });
      }

      // Apply product quantity updates in batch
      for (const update of productUpdates) {
        batch.update(update.ref, { quantity: update.newQuantity });
      }

      // Save the invoice after stock validation
      const invoiceRef = doc(collection(db, 'invoices'));
      batch.set(invoiceRef, data);

      await batch.commit(); // Commit all changes atomically
      return invoiceRef;
    } catch (error: any) {
      let message = error instanceof Error ? error.message : String(error);
      console.error('Error adding invoice:', message);
      throw new Error(message);
    }
  }

  async getInvoices(year: number): Promise<any[]> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('year', '==', year),
        orderBy('invoiceNumber', 'desc')
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(invoicesQuery);

      // Map the query snapshot to an array of invoice objects
      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // Spread the invoice data
      }));

      return invoices; // Return the list of invoices if successful
    } catch (error) {
      console.error('Error retrieving invoices: ', error);
      throw new Error('Failed to retrieve invoices. Please try again later.');
    }
  }

  async getInvoicesFilterAll(
    year: number,
    month: number,
    status: string
  ): Promise<any[]> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('year', '==', year),
        where('month', '==', month),
        where('invoiceStatus', '==', status),
        orderBy('invoiceNumber', 'desc')
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(invoicesQuery);

      // Map the query snapshot to an array of invoice objects
      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // Spread the invoice data
      }));

      return invoices; // Return the list of invoices if successful
    } catch (error) {
      console.error('Error retrieving invoices: ', error);
      throw new Error('Failed to retrieve invoices. Please try again later.');
    }
  }

  async getInvoicesFilterStatusYear(
    year: number,
    status: string
  ): Promise<any[]> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('year', '==', year),
        where('invoiceStatus', '==', status),
        orderBy('invoiceNumber', 'desc')
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(invoicesQuery);

      // Map the query snapshot to an array of invoice objects
      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // Spread the invoice data
      }));

      return invoices; // Return the list of invoices if successful
    } catch (error) {
      console.error('Error retrieving invoices: ', error);
      throw new Error('Failed to retrieve invoices. Please try again later.');
    }
  }

  async getInvoicesFilterYearMonth(
    year: number,
    month: number
  ): Promise<any[]> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('year', '==', year),
        where('month', '==', month),
        orderBy('invoiceNumber', 'desc')
      );

      // Await the Firestore operation to get the documents
      const querySnapshot = await getDocs(invoicesQuery);

      // Map the query snapshot to an array of invoice objects
      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any), // Spread the invoice data
      }));

      return invoices; // Return the list of invoices if successful
    } catch (error) {
      console.error('Error retrieving invoices: ', error);
      throw new Error('Failed to retrieve invoices. Please try again later.');
    }
  }

  // Update an existing invoice in Firestore
  async updateInvoice(id: string, data: any): Promise<void> {
    try {
      data.updatedAt = Timestamp.now();
      const docRef = doc(this.firestore, `invoices/${id}`);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error updating invoice with ID ${id}: `, error);
      throw new Error('Failed to update invoice. Please try again later.');
    }
  }
}
