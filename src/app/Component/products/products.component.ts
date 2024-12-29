import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Product } from '../../DataModels/productData.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatTableModule,
    DecimalPipe,
    MatPaginatorModule,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements AfterViewInit, OnInit {
  tableSpinner = true;
  activeProducts: Product[] = [];
  displayedColumns: string[] = ['name', 'accountBalance', 'options'];
  dataSource = new MatTableDataSource(this.activeProducts);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('newProductModal') newCustomerModal: any;
  displaySmall = false;
  modalData = false;
  customerDataLoaded = false;
  productData: Partial<Product> = {};
  productTableStatus = '';

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  ngOnInit(): void {}

  ngAfterViewInit() {}

  showProductData(_t27: any) {
    throw new Error('Method not implemented.');
  }
  modalProductData(_t49: any) {
    throw new Error('Method not implemented.');
  }
  populateProductTable(arg0: string) {
    throw new Error('Method not implemented.');
  }
}
