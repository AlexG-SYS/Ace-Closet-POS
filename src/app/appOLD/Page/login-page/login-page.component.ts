import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalService } from '../../Service/global.service';
import { AuthenticateService } from '../../Service/authenticate.service';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { tap } from 'rxjs';

@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule, FormsModule],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  logoPath = '../../../assets/aceClosetLogoFull.png'; // Default image
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  authService = inject(AuthenticateService);

  constructor(private router: Router, private globalService: GlobalService) {
    this.authService
      .logout()
      .pipe(tap(() => (this.globalService.username = null)))
      .subscribe({
        error: (error) => {
          console.error('Logout Error:', error);
        },
      });

    const savedTheme = localStorage.getItem('theme') || 'light-mode';

    this.logoPath =
      savedTheme === 'dark-mode'
        ? '../../../assets/aceClosetLogoFullLight.png'
        : '../../../assets/aceClosetLogoFull.png';
  }

  loginError: string | null = null;

  onLoginClicked() {
    this.loginError = null;
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      this.authService.login(formData.email!, formData.password!).subscribe({
        next: (user) => {
          // <-- Check the emitted user value
          if (user) {
            // User is logged in
            this.globalService.username = formData.email!;
            this.router.navigateByUrl('/dashboard/home');
            console.log(this.globalService.username, ' Logged In*');
          } else {
            // User is null (login failed)
            console.log('Login failed: Invalid credentials');
            this.loginForm.reset(); // Or display an error message
            // Optionally set an error message to display in the UI
            this.loginError = 'Invalid email or password'; // Example error message
          }
        },
        error: (err) => {
          // Handle *real* errors (network, etc.)
          console.error('Login Error (Network/Other):', err);
          this.loginError = 'An error occurred. Please try again later'; // Example error message
        },
        complete: () => {
          // Optional: Code to execute when the observable completes
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
