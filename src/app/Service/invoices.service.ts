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
  limit,
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
    const userRef = doc(db, `users/${data.customer.id}`); // Reference to the user document

    try {
      data.createdAt = Timestamp.now(); // Add timestamp

      // Fetch product details from Firestore
      const productUpdates: { ref: any; newQuantity: number }[] = [];

      // Calculate the total invoice amount
      let totalAmount = 0;
      totalAmount = data.grandTotal;

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
            `Insufficient stock for product: ${item?.['productName']}`
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

      // Fetch user document to get current balance
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error(`User ${data.customer.id} does not exist.`);
      }

      const userData = userSnap.data();
      let userBalance = userData['accountBalance'] || 0;

      // Deduct the invoice amount from the user's balance
      userBalance += totalAmount;

      // Update the user balance in batch
      batch.update(userRef, { accountBalance: userBalance });

      // Save the invoice after stock validation
      const invoiceRef = doc(collection(db, 'invoices'));
      batch.set(invoiceRef, data);

      // Commit all changes atomically
      await batch.commit();

      return invoiceRef;
    } catch (error: any) {
      let message = error instanceof Error ? error.message : String(error);
      console.error('Error adding invoice:', message);
      throw new Error(message);
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

  async getLatestInvoiceNumber(): Promise<number> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        orderBy('invoiceNumber', 'desc'),
        limit(1) // Get only the latest invoice
      );

      const querySnapshot = await getDocs(invoicesQuery);

      if (!querySnapshot.empty) {
        const latestInvoice = querySnapshot.docs[0].data();
        return Number(latestInvoice?.['invoiceNumber']) + 1;
      } else {
        return 1; // Default to 1 if no invoices exist
      }
    } catch (error) {
      console.error('Error retrieving latest invoice number: ', error);
      throw new Error('Failed to retrieve latest invoice number.');
    }
  }

  async getInvoiceById(invoiceId: string): Promise<any> {
    try {
      const invoiceRef = doc(this.firestore, `invoices/${invoiceId}`);
      const invoiceSnap = await getDoc(invoiceRef);

      if (invoiceSnap.exists()) {
        return { id: invoiceSnap.id, ...invoiceSnap.data() };
      } else {
        throw new Error(`Invoice not found.`);
      }
    } catch (error) {
      console.error(`Error fetching invoice with ID ${invoiceId}:`, error);
      throw new Error('Failed to get invoice.');
    }
  }

  async getInvoiceByUserId(userId: string): Promise<any> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('customer.id', '==', userId),
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

  async getInvoiceByNumber(invoiceNumber: string): Promise<any> {
    try {
      const invoicesQuery = query(
        this.invoicesCollection,
        where('invoiceNumber', '==', Number(invoiceNumber))
      );
      const querySnapshot = await getDocs(invoicesQuery);

      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
      } else {
        throw new Error('Invoice not found.');
      }
    } catch (error) {
      console.error(
        `Error fetching invoice with number ${invoiceNumber}:`,
        error
      );
      throw new Error('Failed to get invoice.');
    }
  }

  // Add this method inside the InvoicesService class
  async checkAndMarkPastDueInvoices(): Promise<void> {
    try {
      const db = this.firestore; // Firestore instance

      // Calculate the date for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedYesterday = yesterday.toISOString().split('T')[0];

      // Query invoices with a due date of yesterday and a balance greater than 0
      const invoicesQuery = query(
        this.invoicesCollection,
        where('dueDate', '==', formattedYesterday),
        where('invoiceBalance', '>', 0),
        where('invoiceStatus', '!=', 'Past Due')
      );

      const querySnapshot = await getDocs(invoicesQuery);

      if (!querySnapshot.empty) {
        const batch = writeBatch(db); // Use batch operation for efficient updates

        querySnapshot.forEach((doc) => {
          const invoiceRef = doc.ref;
          batch.update(invoiceRef, { invoiceStatus: 'Past Due' });
        });

        // Commit all updates
        await batch.commit();
        console.log(
          'Invoices with a due date of yesterday have been updated to Past Due.'
        );
      } else {
        console.log(
          'No invoices found with a due date of yesterday and a balance greater than 0.'
        );
      }
    } catch (error) {
      console.error('Error checking and marking past due invoices:', error);
      throw new Error('Failed to check and update past due invoices.');
    }
  }
}
