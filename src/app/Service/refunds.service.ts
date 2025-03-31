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
  CollectionReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RefundsService {
  private readonly refundsCollection: CollectionReference;

  constructor(private readonly firestore: Firestore) {
    this.refundsCollection = collection(this.firestore, 'refunds');
  }

  async getRefundsByYearMonth(year: number, month: number): Promise<any[]> {
    try {
      const refundsQuery = query(
        this.refundsCollection,
        where('year', '==', year),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(refundsQuery);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
    } catch (error) {
      console.error('Error retrieving refunds:', error);
      throw new Error('Failed to retrieve refunds. Please try again later.');
    }
  }
}
