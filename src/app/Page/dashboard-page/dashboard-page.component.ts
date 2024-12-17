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
  greetingMessage: string = '';
  currentDate = new Date();
  time = this.currentDate.getHours();

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  constructor() {
    // Set greeting message based on time of day
    this.setGreetingMessage();

    document.addEventListener('scroll', function () {
      const topNav = document.querySelector('.topNav');
      if (window.scrollY > 10) {
        topNav!.classList.add('scrolled');
      } else {
        topNav!.classList.remove('scrolled');
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------------
  // Set greeting message based on time of day
  setGreetingMessage() {
    if (this.time < 12) {
      this.greetingMessage = 'Good Morning';
    } else if (this.time >= 12 && this.time < 15) {
      this.greetingMessage = 'Good Afternoon';
    } else if (this.time >= 15 && this.time < 18) {
      this.greetingMessage = 'Good Evening';
    } else if (this.time >= 18) {
      this.greetingMessage = 'Good Night';
    }
  }
  // -----------------------------------------------------------------------------------------------------------
}
