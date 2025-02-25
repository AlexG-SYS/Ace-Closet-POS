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
  totalExpense = 0;
  activeInvoice: Invoice[] = [];
  activeExpense: Payment[] = [];
  today = new Date();

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  constructor(
    private invoiceService: InvoicesService,
    private transactionService: TransactionsService,
    private snackBar: MatSnackBar
  ) {
    this.chartOptions = {
      series: [
        {
          name: 'Income',
          data: [0, this.totalSales], // Example values
        },
        {
          name: 'Profit',
          data: [0, this.totalProfit], // Example values
        },
        {
          name: 'Expense',
          data: [0, this.totalExpense], // Example values
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

    this.chartOptions.series = [
      {
        name: 'Income',
        data: [0, this.totalSales], // Update with new data
      },
      {
        name: 'Profit',
        data: [0, this.totalProfit],
      },
      {
        name: 'Expense',
        data: [0, this.totalExpense],
      },
    ];
  }

  async getData() {
    try {
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

      // Process Invoices
      this.activeInvoice = invoices;
      let totalCost = 0;
      this.totalSales = 0; // Reset before recalculating

      this.activeInvoice.forEach((invoice) => {
        this.totalSales += invoice.grandTotal;
        invoice.products.forEach((product) => {
          totalCost += product.cost * product.quantity;
        });
      });

      this.totalProfit = this.totalSales - totalCost;

      // Process Expenses
      this.activeExpense = expenses;
      this.totalExpense = 0; // Reset before recalculating

      this.activeExpense.forEach((expense) => {
        this.totalExpense += expense.amount;
      });

      // Now that both data sets are ready, update the chart
      this.updateChart();
    } catch (error) {
      this.showSnackBar(`Retrieving Data Failed`, 'error');
      console.error('Error retrieving invoices or expenses:', error);
    }
  }

  updateChart() {
    if (this.chartOptions) {
      this.chartOptions.series = [
        {
          name: 'Income',
          data: [0, parseFloat(this.totalSales.toFixed(2))], // Format to 2 decimal places
        },
        {
          name: 'Profit',
          data: [0, parseFloat(this.totalProfit.toFixed(2))],
        },
        {
          name: 'Expense',
          data: [0, parseFloat(this.totalExpense.toFixed(2))],
        },
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
