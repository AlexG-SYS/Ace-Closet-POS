import { Routes } from '@angular/router';
import { ErrorPageComponent } from './Page/error-page/error-page.component';
import { DashboardPageComponent } from './Page/dashboard-page/dashboard-page.component';
import { HomeComponent } from './Component/home/home.component';
import { ProductsComponent } from './Component/products/products.component';
import { OrdersComponent } from './Component/orders/orders.component';
import { UsersComponent } from './Component/users/users.component';
import { InvoicesComponent } from './Component/invoices/invoices.component';
import { SettingsComponent } from './Component/settings/settings.component';
import { LoginPageComponent } from './Page/login-page/login-page.component';
import { ReportsComponent } from './Component/reports/reports.component';
import { PaymentsComponent } from './Component/payments/payments.component';
import { TransactionsComponent } from './Component/transactions/transactions.component';
import { RefundsComponent } from './Component/refunds/refunds.component';

export const routes: Routes = [
  { path: '', title: 'Login | Ace Closet POS', component: LoginPageComponent },
  {
    path: 'login',
    title: 'Login | Ace Closet POS',
    component: LoginPageComponent,
  },
  {
    path: 'dashboard',
    title: 'Home | Ace Closet POS',
    component: DashboardPageComponent,
    children: [
      { path: '', title: 'Home | Ace Closet POS', component: HomeComponent },
      {
        path: 'home',
        title: 'Home | Ace Closet POS',
        component: HomeComponent,
      },
      {
        path: 'users',
        title: 'Users | Ace Closet POS',
        component: UsersComponent,
      },
      {
        path: 'products',
        title: 'Products | Ace Closet POS',
        component: ProductsComponent,
      },
      {
        path: 'orders',
        title: 'Orders | Ace Closet POS',
        component: OrdersComponent,
      },
      {
        path: 'invoices',
        title: 'Invoices | Ace Closet POS',
        component: InvoicesComponent,
      },
      {
        path: 'payments',
        title: 'Payments | Ace Closet POS',
        component: PaymentsComponent,
      },
      {
        path: 'transactions',
        title: 'Transactions | Ace Closet POS',
        component: TransactionsComponent,
      },
      {
        path: 'reports',
        title: 'Reports | Ace Closet POS',
        component: ReportsComponent,
      },
      {
        path: 'refunds',
        title: 'Refunds | Ace Closet POS',
        component: RefundsComponent,
      },
      {
        path: 'settings',
        title: 'Settings | Ace Closet POS',
        component: SettingsComponent,
      },
      { path: '**', title: 'Page Not Found', component: ErrorPageComponent },
    ],
  },
  { path: '**', title: 'Page Not Found', component: ErrorPageComponent },
];
