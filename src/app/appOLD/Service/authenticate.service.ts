import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  user,
  sendPasswordResetEmail,
  User, // Import User type
} from '@angular/fire/auth';
import { Observable, from, of } from 'rxjs'; // Import 'of'
import { switchMap, catchError } from 'rxjs/operators'; // Import operators
import { Router } from '@angular/router';
import { UserInterface } from '../DataModels/userLoginData.model copy';

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private afAuth: Auth = inject(Auth); // Use inject directly
  user$ = user(this.afAuth); // No need for separate firebaseAuth
  currentUserSig = signal<UserInterface | null>(null); // Type signal correctly

  constructor(private router: Router) {}

  login(email: string, password: string): Observable<User | null> {
    // Return user or null
    return from(signInWithEmailAndPassword(this.afAuth, email, password)).pipe(
      switchMap((credential) => of(credential.user)), // Emit the user
      catchError((error) => {
        console.error('Login Error:', error); // Log the error
        return of(null); // Return null on error
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.afAuth)).pipe(
      catchError((error) => {
        console.error('Logout Error:', error);
        return of(undefined); // Return undefined on error
      })
    );
  }

  // ... other methods (updateProfile, sendPasswordResetEmail)
}
