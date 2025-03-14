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
import { TransactionsService } from '../../Service/transactions.service';
import { ReportsService } from '../../Service/reports.service';
import { SnackbarService } from '../../Service/snackbar.service';

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
  public chartOptions!: ChartOptions;
  totalProfit = 0;
  totalSales = 0;
  totalCost = 0;
  totalExpense = 0;
  lastMonthTotalSales = 0;
  lastMonthTotalProfit = 0;
  today = new Date();
  currentYear = this.today.getFullYear();
  currentMonth = this.today.getMonth() + 1;

  constructor(
    private invoiceService: InvoicesService,
    private reportsService: ReportsService,
    private transactionService: TransactionsService,
    private snackbarService: SnackbarService
  ) {
    this.initializeChart();
  }

  ngOnInit(): void {
    this.getData();
  }

  private initializeChart() {
    this.chartOptions = {
      series: [
        { name: 'Item Cost', data: [0] },
        { name: 'Net Profit', data: [0] },
        { name: 'Expense', data: [0] },
      ],
      chart: { type: 'bar', height: 300, stacked: true },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '45%', borderRadius: 5 },
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
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'center' },
      colors: ['#497ffc', '#56ca00', '#8a8d93'],
      fill: { type: 'solid' },
    };
  }

  private async getData() {
    try {
      if (this.today.getDate() === 1) await this.generateLastMonthReport();

      const pastReports = await this.reportsService.getReportsUpToMonth(
        this.currentYear,
        this.currentMonth
      );
      if (!pastReports || pastReports.length === 0) return;

      this.extractReportData(pastReports);
    } catch (error) {
      this.snackbarService.show('Retrieving Data Failed', 'error');
      console.error('Error retrieving reports:', error);
    }
  }

  private extractReportData(pastReports: any[]) {
    const lastMonthReport = pastReports.find(
      (report) =>
        report.year === this.currentYear &&
        report.month === this.currentMonth - 1
    );
    if (lastMonthReport) {
      this.lastMonthTotalSales = lastMonthReport.totalSales;
    }
    if (lastMonthReport) {
      this.lastMonthTotalProfit = lastMonthReport.totalProfit;
    }

    const currentMonthReport = pastReports.find(
      (report) =>
        report.year === this.currentYear && report.month === this.currentMonth
    );
    if (currentMonthReport) {
      this.totalSales = currentMonthReport.totalSales;
      this.totalCost = currentMonthReport.totalCost;
      this.totalProfit = currentMonthReport.totalProfit;
      this.totalExpense = currentMonthReport.totalExpense;
      this.updateChart(pastReports);
    } else {
      this.fetchLiveData(pastReports);
    }
  }

  private async fetchLiveData(pastReports: any[]) {
    const [invoices, expenses] = await Promise.all([
      this.invoiceService.getInvoicesFilterYearMonth(
        this.currentYear,
        this.currentMonth
      ),
      this.transactionService.getExpenseByMonthYear(
        this.currentMonth,
        this.currentYear
      ),
    ]);

    this.totalSales = invoices.reduce(
      (sum, invoice) => sum + invoice.grandTotal,
      0
    );
    this.totalCost = invoices.reduce(
      (sum, invoice) =>
        sum +
        invoice.products.reduce(
          (pSum: number, product: { cost: number; quantity: number }) =>
            pSum + product.cost * product.quantity,
          0
        ),
      0
    );
    this.totalProfit = this.totalSales - this.totalCost;
    this.totalExpense = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    this.updateChart(pastReports);
  }

  private async generateLastMonthReport() {
    const lastMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
    const year =
      this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;

    const existingReport = await this.reportsService.getMonthlyReports(
      year,
      lastMonth
    );
    if (existingReport?.length) {
      this.lastMonthTotalSales = existingReport[0].totalSales;
      return;
    }

    const [invoices, expenses] = await Promise.all([
      this.invoiceService.getInvoicesFilterYearMonth(year, lastMonth),
      this.transactionService.getExpenseByMonthYear(lastMonth, year),
    ]);

    const reportData = {
      year,
      month: lastMonth,
      totalSales: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalCost: invoices.reduce(
        (sum, inv) =>
          sum +
          inv.products.reduce(
            (pSum: number, p: { cost: number; quantity: number }) =>
              pSum + p.cost * p.quantity,
            0
          ),
        0
      ),
      totalExpense: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalProfit: 0,
      totalNetProfit: 0,
      createdAt: new Date(),
    };
    reportData.totalProfit = reportData.totalSales - reportData.totalCost;
    reportData.totalNetProfit =
      reportData.totalProfit - reportData.totalExpense;

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

  calculatePercent(total: number, lastMonth: number) {
    if (lastMonth === 0) {
      return total > 0 ? 100 : 0; // Avoid division by zero
    }
    return ((total - lastMonth) / lastMonth) * 100;
  }
}
