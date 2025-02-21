import { Component } from '@angular/core';
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
export class HomeComponent {
  public chartOptions: ChartOptions;
  totalProfit = 0;
  totalSales = 0;
  totalExpense = 0;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Income',
          data: [], // Example values
        },
        {
          name: 'Profit',
          data: [], // Example values
        },
        {
          name: 'Expense',
          data: [], // Example values
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
}
