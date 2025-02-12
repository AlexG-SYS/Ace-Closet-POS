import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthenticateService } from './Service/authenticate.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  inactivityTimeout: any;

  constructor(
    private authService: AuthenticateService, // Inject your service
    private router: Router // Inject the router
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo(0, 0);
      });

    this.authService.user$.subscribe((user) => {
      // Subscribe to user$
      if (user) {
        this.resetInactivityTimer();
      } else {
        clearTimeout(this.inactivityTimeout); // Clear on logout
      }
    });

    // Event listeners (same as before)
    document.addEventListener(
      'touchstart',
      this.resetInactivityTimer.bind(this)
    );
    document.addEventListener('click', this.resetInactivityTimer.bind(this));
    document.addEventListener('keydown', this.resetInactivityTimer.bind(this));
    document.addEventListener('focus', this.resetInactivityTimer.bind(this));
  }

  ngOnDestroy() {
    // Remove event listeners (same as before)
    document.removeEventListener(
      'touchstart',
      this.resetInactivityTimer.bind(this)
    );
    document.removeEventListener('click', this.resetInactivityTimer.bind(this));
    document.removeEventListener(
      'keydown',
      this.resetInactivityTimer.bind(this)
    );
    document.removeEventListener('focus', this.resetInactivityTimer.bind(this)); // Optional
    clearTimeout(this.inactivityTimeout);
  }

  resetInactivityTimer() {
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => {
      this.handleInactivityLogout();
    }, 900000); // 15 minutes
  }

  handleInactivityLogout() {
    this.authService.logout().subscribe(() => {
      console.log('User logged out due to inactivity.');
      this.router.navigate(['/login']); // Redirect after logout
    });
  }
}
