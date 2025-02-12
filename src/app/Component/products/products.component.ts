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
import { ProductsService } from '../../Service/products.service';
import * as bootstrap from 'bootstrap';

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
  productForm = new FormGroup({
    id: new FormControl(),
    upc: new FormControl('', [Validators.required, Validators.maxLength(25)]),
    productName: new FormControl('', [
      Validators.required,
      Validators.maxLength(50),
    ]), // Only letters and spaces
    productColor: new FormControl('', [Validators.required]),
    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
    price: new FormControl('', [
      Validators.required,
      Validators.min(0), // Price cannot be negative
    ]),
    cost: new FormControl('', [
      Validators.required,
      Validators.min(0), // Cost cannot be negative
    ]),
    online: new FormControl(false, [Validators.required]), // Boolean value
    category: new FormControl('', [Validators.required]),
    quantity: new FormControl('', [
      Validators.required,
      Validators.min(0), // Quantity cannot be negative
    ]),
    size: new FormControl('', [Validators.required]),
    status: new FormControl(),
    tax: new FormControl(false, [Validators.required]), // Boolean value
    tags: new FormControl('', [Validators.required]),
  });

  get upcControl() {
    return this.productForm.get('upc');
  }

  get productNameControl() {
    return this.productForm.get('productName');
  }

  get productColorControl() {
    return this.productForm.get('productColor');
  }

  get descriptionControl() {
    return this.productForm.get('description');
  }

  get priceControl() {
    return this.productForm.get('price');
  }

  get costControl() {
    return this.productForm.get('cost');
  }

  get onlineControl() {
    return this.productForm.get('online');
  }

  get categoryControl() {
    return this.productForm.get('category');
  }

  get quantityControl() {
    return this.productForm.get('quantity');
  }

  get sizeControl() {
    return this.productForm.get('size');
  }

  get statusControl() {
    return this.productForm.get('status');
  }

  get taxControl() {
    return this.productForm.get('tax');
  }

  get tagsControl() {
    return this.productForm.get('tags');
  }

  tableSpinner = true;
  activeProducts: Product[] = [];
  displayedColumns: string[] = [
    'upc',
    'productName',
    'category',
    'price',
    'qty',
    'size',
    'cost',
    'profit',
    'color',
    'options',
  ];
  displayedColumnsSmall: string[] = [
    'upc',
    'productName',
    'price',
    'qty',
    'size',
    'options',
  ];
  dataSource = new MatTableDataSource(this.activeProducts);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('newProductModal') newProductModal: any;
  displaySmall = false;
  modalData = false;
  productDataLoaded = false;
  productData: Partial<Product> = {};
  productTableStatus = '';

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  constructor(
    private productService: ProductsService,
    private snackBar: MatSnackBar
  ) {
    this.displaySmall = window.innerWidth <= 1223;
  }

  ngOnInit(): void {
    this.populateProductTable('active');
  }

  ngAfterViewInit() {
    const inputField = document.getElementById(
      'searchProduct'
    ) as HTMLInputElement;
    const clearButton = document.getElementById('clearButton2') as HTMLElement;

    if (clearButton && inputField) {
      clearButton.addEventListener('click', () => {
        inputField.value = ''; // Correctly accessing the 'value' property
        inputField.focus();
        clearButton.style.display = 'none';

        // Create a mock event with an empty value
        const mockEvent = { target: { value: '' } } as unknown as Event;

        // Call the applyFilter method with the mock event
        this.applyFilter(mockEvent);
      });

      inputField.addEventListener('input', () => {
        clearButton.style.display = inputField.value ? 'block' : 'none';
      });

      // Initially hide the clear button
      clearButton.style.display = 'none';
    }
    this.dataSource.paginator = this.paginator;
  }

  newProductForm() {
    if (this.productForm.valid) {
      const formData = this.productForm.value;
      let gst = 0;

      if (formData.tax) {
        gst = 12.5;
      }
      // Convert form data to a partial Product data model
      const partialProduct: Partial<Product> = {
        upc: formData.upc || '',
        productName: formData.productName || '',
        productColor: formData.productColor?.toString() || '',
        description: formData.description || '',
        price: Number(formData.price),
        cost: Number(formData.cost),
        online: formData.online!,
        category: formData.category || '',
        quantity: Number(formData.quantity),
        size: formData.size || '',
        tax: formData.tax!,
        gst: gst,
        tags: formData.tags || '',
        status: 'active',
      };

      // Add Product and handle success or error
      this.productService
        .addProduct(partialProduct)
        .then(() => {
          this.clearNewProductForm();
          this.modalData = false;
          this.showSnackBar('Product added successfully!', 'success');
          this.populateProductTable('active');
        })
        .catch((error) => {
          this.showSnackBar(`Failed to Add Product`, 'error');
          console.log(error.message);
        });
    } else {
      console.log('Form is invalid');
      this.productForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  clearNewProductForm() {
    var lastColor = this.productForm.get('productColor')?.value;
    this.productForm.reset();
    this.modalData = false;
    this.productForm.get('tax')?.setValue(false);
    this.productForm.get('online')?.setValue(false);
    this.productForm.get('tags')?.setValue('');
    this.productForm.get('size')?.setValue('');
    this.productForm.get('productColor')?.setValue(lastColor!);
    this.productForm.get('category')?.setValue('');
  }

  populateProductTable(status: string) {
    this.tableSpinner = true;
    this.productService
      .getProducts(status)
      .then((products) => {
        this.tableSpinner = false;
        this.activeProducts = products;
        this.dataSource.data = this.activeProducts;
      })
      .catch((error) => {
        this.showSnackBar(`Retrieving Products Failed`, 'error');
        console.error('Error Retrieving Active Products:', error);
      });

    if (status == 'inactive') {
      this.productTableStatus = 'active';
    } else {
      this.productTableStatus = 'inactive';
    }
  }

  modalProductData(formData: Product) {
    this.modalData = true;
    this.productForm.patchValue({
      id: formData.id,
      upc: formData.upc || '',
      productName: formData.productName || '',
      productColor: formData.productColor?.toString() || '',
      description: formData.description || '',
      price: formData.price.toString(),
      cost: formData.cost.toString(),
      online: formData.online!,
      category: formData.category || '',
      quantity: formData.quantity.toString(),
      size: formData.size,
      tax: formData.tax!,
      tags: formData.tags,
    });

    if (formData.status == 'active') {
      this.productForm.patchValue({
        status: true,
      });
    } else {
      this.productForm.patchValue({
        status: false,
      });
    }

    if (this.newProductModal) {
      const newProductModal = new bootstrap.Modal(
        this.newProductModal.nativeElement
      );
      newProductModal.show();
    }
  }

  updateProduct() {
    if (this.productForm.valid) {
      const formData = this.productForm.value;
      const today = new Date();

      let gst = 0;

      if (formData.tax) {
        gst = 12.5;
      }

      // Convert form data to a partial Product data model

      const updatedData: Partial<Product> = {
        upc: formData.upc!,
        productName: formData.productName!,
        productColor: formData.productColor?.toString()!,
        description: formData.description!,
        price: Number(formData.price),
        cost: Number(formData.cost!.toString()),
        tags: formData.tags!,
        category: formData.category!,
        quantity: Number(formData.quantity!.toString()),
        size: formData.size!,
        tax: formData.tax!,
        gst: gst,
        online: formData.online!,
        status: formData.status,
      };

      if (formData.status) {
        updatedData.status = 'active';
      } else {
        updatedData.status = 'inactive';
      }

      if (!this.productForm.value.id) {
        console.error('Product ID is missing');
        this.showSnackBar(
          'Failed to Update Product: Missing Product ID',
          'error'
        );
        return;
      }
      this.productService
        .updateProduct(this.productForm.value.id, updatedData)
        .then(() => {
          this.clearNewProductForm();
          this.modalData = false;
          this.showSnackBar('Product Updated Successfully!', 'success');
          this.populateProductTable('active');
        })
        .catch((error) => {
          this.showSnackBar('Failed to Update Product', 'error');
          console.error('Error Updating Product:', error.message);
        });
    } else {
      this.productForm.markAllAsTouched(); // Highlight invalid fields
    }
  }

  updateColorInput(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.productForm.get('productColor')?.setValue(color);
  }

  showSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getTextColor(hexColor: string): string {
    const rgb = parseInt(hexColor.replace('#', ''), 16); // Convert hex to RGB
    const r = (rgb >> 16) & 0xff; // Extract red
    const g = (rgb >> 8) & 0xff; // Extract green
    const b = rgb & 0xff; // Extract blue
    const brightness = (r * 299 + g * 587 + b * 114) / 1000; // Calculate brightness
    return brightness > 125 ? 'black' : 'white'; // Return contrasting color
  }
}
