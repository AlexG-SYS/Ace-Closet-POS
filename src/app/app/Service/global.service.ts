import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  private _username: string | null = null;

  get username(): string | null {
    return this._username;
  }

  set username(newName: string | null) {
    this._username = newName;
  }
}
