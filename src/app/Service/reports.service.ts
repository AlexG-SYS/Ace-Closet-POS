import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  CollectionReference,
  DocumentData,
  orderBy,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private reportsCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.reportsCollection = collection(this.firestore, 'reports');
  }

  // Retrieve reports from Firestore
  async getMonthlyReports(year: number, currentMonth: number): Promise<any[]> {
    try {
      const reportsQuery = query(
        this.reportsCollection,
        where('year', '==', year),
        where('month', '==', currentMonth) // Get past months' reports
      );
      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  // Save monthly report to Firestore
  async saveMonthlyReport(reportData: any): Promise<void> {
    try {
      await addDoc(this.reportsCollection, reportData);
      console.log('Report saved successfully');
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  async getReportsUpToMonth(
    year: number,
    currentMonth: number
  ): Promise<any[]> {
    try {
      // Create a query to get reports for the given year and for months <= currentMonth
      const reportsQuery = query(
        this.reportsCollection,
        where('year', '==', year), // Filter by year
        where('month', '<=', currentMonth), // Filter months less than or equal to currentMonth
        orderBy('month', 'asc') // Order by month in ascending order
      );

      const snapshot = await getDocs(reportsQuery);

      // Map the query snapshot to an array of report data
      const reports = snapshot.docs.map((doc) => doc.data());

      return reports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }
}
