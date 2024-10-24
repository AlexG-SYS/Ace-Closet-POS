import { Component } from '@angular/core';
import { RouterOutlet, Router, } from '@angular/router';
import { CategoriesComponent } from "../../Component/categories/categories.component";

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterOutlet, CategoriesComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {

}
