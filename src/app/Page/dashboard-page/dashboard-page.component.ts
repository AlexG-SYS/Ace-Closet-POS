import { Component } from '@angular/core';
import {
  RouterOutlet,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  isSidebarVisible: boolean = false;

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  constructor() {
    document.addEventListener('scroll', function () {
      const topNav = document.querySelector('.topNav');
      if (window.scrollY > 10) {
        topNav!.classList.add('scrolled');
      } else {
        topNav!.classList.remove('scrolled');
      }
    });
  }
}
