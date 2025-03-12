import { Component, inject, Renderer2 } from '@angular/core';
import {
  RouterOutlet,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { tap } from 'rxjs';
import { AuthenticateService } from '../../Service/authenticate.service';
import { GlobalService } from '../../Service/global.service';

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

  authService = inject(AuthenticateService);

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  constructor(
    private router: Router,
    private globalService: GlobalService,
    private renderer: Renderer2
  ) {
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    this.setTheme(savedTheme);

    this.logoPath =
      savedTheme === 'dark-mode'
        ? '../../../assets/aceClosetLogoFullLight.png'
        : '../../../assets/aceClosetLogoFull.png';

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

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (user != null || user != undefined) {
        this.authService.currentUserSig.set({
          email: user.email!,
          displayName: user.displayName!,
        });
      } else {
        this.router.navigateByUrl('/login');
        this.authService.currentUserSig.set(null);
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

  logout() {
    this.authService
      .logout()
      .pipe(
        tap(() => {
          this.globalService.username = null;
          this.router.navigate(['/login']); // Redirect to login page
        })
      )
      .subscribe({
        error: (error) => {
          console.error('Logout Error:', error);
        },
      });
  }

  logoPath = '../../../assets/aceClosetLogoFull.png'; // Default image
  toggleTheme(theme: string) {
    // Remove any existing theme class
    document.body.classList.remove('light-mode', 'dark-mode');

    // Apply new theme
    this.renderer.addClass(document.body, theme);

    // Save the preference
    localStorage.setItem('theme', theme);

    // Update logo image dynamically
    this.logoPath =
      theme === 'dark-mode'
        ? '../../../assets/aceClosetLogoFullLight.png'
        : '../../../assets/aceClosetLogoFull.png';
  }

  setTheme(theme: string) {
    document.body.classList.add(theme);
  }
}
