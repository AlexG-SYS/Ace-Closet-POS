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
    try {
      // Add the createdAt timestamp before saving the invoice
      data.createdAt = Timestamp.now();
      // Add the invoice data to the Firestore invoices collection
      const docRef = await addDoc(this.invoicesCollection, data);
      return docRef; // Return the document reference if successful
    } catch (error) {
      console.error('Error adding invoice: ', error);
      throw new Error('Failed to add invoice. Please try again later.');
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
