import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexLegend,
  ApexFill,
} from 'ng-apexcharts';
import { InvoicesService } from '../../Service/invoices.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invoice } from '../../DataModels/invoiceData.model';
import { BankAccountsService } from '../../Service/bank-accounts.service';
import { TransactionsService } from '../../Service/transactions.service';
import { Payment } from '../../DataModels/paymentData.model';
import { ReportsService } from '../../Service/reports.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  colors: string[];
  fill: ApexFill;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgApexchartsModule, DecimalPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  public chartOptions: ChartOptions;
  totalProfit = 0;
  totalSales = 0;
  totalCost = 0;
  totalExpense = 0;
  activeInvoice: Invoice[] = [];
  activeExpense: Payment[] = [];
  today = new Date();

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  lastMonthTotalSales = 0;

  constructor(
    private invoiceService: InvoicesService,
    private reportsService: ReportsService,
    private transactionService: TransactionsService,
    private snackBar: MatSnackBar
  ) {
    this.chartOptions = {
      series: [
        {
          name: 'Item Cost',
          data: [0], // Example values
        },
        {
          name: 'Net Profit',
          data: [0], // Example values
        },
        {
          name: 'Expense',
          data: [0], // Example values
        },
      ],
      chart: {
        type: 'bar',
        height: 300,
        stacked: true,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 5,
          borderRadiusApplication: 'end',
        },
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
      },
      colors: ['#497ffc', '#56ca00', '#8a8d93'],
      fill: {
        type: 'solid',
      },
    };
  }

  ngOnInit(): void {
    this.getData();
  }

  async getData() {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
      const firstDayOfMonth = today.getDate() === 1;

      // Generate last month's report on the 1st day of the month
      if (firstDayOfMonth) {
        await this.generateLastMonthReport();
      }

      // Retrieve all reports for the current year (up to the current month)
      const pastReports = await this.reportsService.getReportsUpToMonth(
        currentYear,
        currentMonth
      );

      if (!pastReports || pastReports.length === 0) {
        console.log('No past reports found.');
        return;
      }

      // Find last month's report
      const lastMonthReport = pastReports.find(
        (report) =>
          report.year === currentYear && report.month === currentMonth - 1
      );
      if (lastMonthReport) {
        this.lastMonthTotalSales = lastMonthReport.totalSales;
      }

      // Find current month's report
      let currentMonthReport = pastReports.find(
        (report) => report.year === currentYear && report.month === currentMonth
      );

      if (currentMonthReport) {
        // Use existing report data
        this.totalSales = currentMonthReport.totalSales;
        this.totalCost = currentMonthReport.totalCost;
        this.totalProfit = currentMonthReport.totalProfit;
        this.totalExpense = currentMonthReport.totalExpense;
      } else {
        console.log(
          `No report found for ${currentMonth}/${currentYear}. Querying live data...`
        );

        // Query live data for invoices and expenses
        const [invoices, expenses] = await Promise.all([
          this.invoiceService.getInvoicesFilterYearMonth(
            currentYear,
            currentMonth
          ),
          this.transactionService.getExpenseByMonthYear(
            currentMonth,
            currentYear
          ),
        ]);

        this.totalSales = invoices.reduce(
          (sum, invoice) => sum + invoice.grandTotal,
          0
        );
        this.totalCost = invoices.reduce((sum, invoice) => {
          return (
            sum +
            invoice.products.reduce(
              (pSum: number, product: { cost: number; quantity: number }) =>
                pSum + product.cost * product.quantity,
              0
            )
          );
        }, 0);
        this.totalProfit = this.totalSales - this.totalCost;
        this.totalExpense = expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
      }

      // Update the charts with all past reports
      this.updateChart(pastReports);
    } catch (error) {
      this.showSnackBar(`Retrieving Data Failed`, 'error');
      console.error('Error retrieving reports:', error);
    }
  }

  async generateLastMonthReport() {
    const today = new Date();
    const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
    const year =
      today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

    // Check if the report already exists
    const existingReport = await this.reportsService.getMonthlyReports(
      year,
      lastMonth
    );

    if (existingReport && existingReport.length > 0) {
      console.log(
        `Report for ${lastMonth}/${year} already exists. Using existing data.`
      );

      // Set lastMonthTotalSales from the existing report
      const report = existingReport[0]; // Assuming the report array contains one report per month
      this.lastMonthTotalSales = report.totalSales;

      return; // If the report exists, stop execution.
    }

    console.log(
      `No existing report found for ${lastMonth}/${year}. Generating new report...`
    );

    // Fetch invoices and expenses if no report exists
    const [invoices, expenses] = await Promise.all([
      this.invoiceService.getInvoicesFilterYearMonth(year, lastMonth),
      this.transactionService.getExpenseByMonthYear(lastMonth, year),
    ]);

    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalExpense = 0;

    invoices.forEach((invoice) => {
      totalSales += invoice.grandTotal;
      invoice.products.forEach(
        (product: { cost: number; quantity: number }) => {
          totalCost += product.cost * product.quantity;
        }
      );
    });

    totalProfit = totalSales - totalCost;

    expenses.forEach((expense) => {
      totalExpense += expense.amount;
    });

    const reportData = {
      year: year,
      month: lastMonth,
      totalCost,
      totalSales,
      totalProfit,
      totalExpense,
      totalNetProfit: totalProfit - totalExpense,
      createdAt: new Date(),
    };

    // Save the new report to Firestore
    await this.reportsService.saveMonthlyReport(reportData);
  }

  updateChart(pastReports: any[]) {
    const salesData = new Array(12).fill(0);
    const profitData = new Array(12).fill(0);
    const expenseData = new Array(12).fill(0);

    // Populate data from past reports
    pastReports.forEach((report) => {
      const index = report.month - 1; // Months are indexed from 0 in arrays
      salesData[index] = parseFloat(report.totalCost.toFixed(2)); // Fixed to 2 decimals
      profitData[index] = parseFloat(
        (report.totalProfit - report.totalExpense).toFixed(2)
      ); // Fixed to 2 decimals
      expenseData[index] = parseFloat(report.totalExpense.toFixed(2)); // Fixed to 2 decimals
    });

    // Add current month's data
    const currentIndex = this.currentMonth - 1;
    salesData[currentIndex] = parseFloat(this.totalCost.toFixed(2)); // Fixed to 2 decimals
    profitData[currentIndex] = parseFloat(
      (this.totalProfit - this.totalExpense).toFixed(2)
    ); // Fixed to 2 decimals
    expenseData[currentIndex] = parseFloat(this.totalExpense.toFixed(2)); // Fixed to 2 decimals

    if (this.chartOptions) {
      this.chartOptions.series = [
        { name: 'Item Cost', data: salesData },
        { name: 'Net Profit', data: profitData },
        { name: 'Expense', data: expenseData },
      ];
    }
  }

  showSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
