import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations'; // Use provideAnimations

import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(), // Use provideAnimations, NOT provideAnimationsAsync

    // Initialize Firebase FIRST
    provideFirebaseApp(() => initializeApp({})),

    // Then provide other Firebase services
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAnalytics(() => getAnalytics()),
    providePerformance(() => getPerformance()),
    provideMessaging(() => getMessaging()),
    provideAppCheck(() =>
      initializeAppCheck(undefined, {
        provider: new ReCaptchaV3Provider(), // Replace with your reCAPTCHA v3 site key

        isTokenAutoRefreshEnabled: true, // Optional: Enables auto-refresh of AppCheck tokens
      })
    ),

    ScreenTrackingService, // These should be AFTER the providers
    UserTrackingService,
  ],
};
