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

export const routes: Routes = [
    { path: '', title: 'Login | Ace Closet POS', component: LoginPageComponent },
    {
        path: 'dashboard',
        title: 'Ace Closet POS',
        component: DashboardPageComponent,
        children: [
            { path: '', title: 'Ace Closet POS', component: HomeComponent },
            { path: 'home', title: 'Home | Ace Closet POS', component: HomeComponent },
            { path: 'products', title: 'Products | Ace Closet POS', component: ProductsComponent },
            { path: 'orders', title: 'Orders | Ace Closet POS', component: OrdersComponent },
            { path: 'users', title: 'Users | Ace Closet POS', component: UsersComponent },
            { path: 'invoices', title: 'Invoices | Ace Closet POS', component: InvoicesComponent },
            { path: 'settings', title: 'Settings | Ace Closet POS', component: SettingsComponent },
            { path: '**', title: 'Page Not Found', component: ErrorPageComponent },
        ],
    },
    { path: '**', title: 'Page Not Found', component: ErrorPageComponent },
];
