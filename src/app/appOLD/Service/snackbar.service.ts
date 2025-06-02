import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root', // Ensures this service is available everywhere
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: `${type}-snackbar`,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
