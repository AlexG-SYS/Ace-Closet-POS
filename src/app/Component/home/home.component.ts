import { Component } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
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
  imports: [NgApexchartsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Income',
          data: [30, 20, 25, 30, 20, 55, 30, 25, 30, 20, 65, 20], // Example values
        },
        {
          name: 'Profit',
          data: [25, 10, 5, 55, 10, 25, 10, 5, 55, 25, 15, 69], // Example values
        },
        {
          name: 'Expense',
          data: [5, 8, 2, 5, 15, 18, 5, 55, 5, 18, 8, 14], // Example values
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
