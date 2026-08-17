# Morya Stationery Store – README

## Project Overview

**Morya Stationery Store** is a full-stack e-commerce web application that allows users to purchase stationery products online and upload custom printing designs.

The website provides a complete online shopping experience, including user authentication, product browsing, shopping cart management, wishlist management, order placement, payment processing, and order tracking.

---

## Features

### User Features

* User registration
* User login
* Google/Firebase login
* Session-based authentication
* Product search
* Product browsing
* Add to cart
* Wishlist management
* Place orders
* Order history
* Order tracking
* Invoice generation
* Custom design upload
* Address management

---

### Admin Features

* Admin login
* Product management
* Order management
* View customer orders
* Manage uploaded files

---

### Custom Printing Features

Users can upload their own documents for printing.


### Payment Features

* Stripe payment integration
* Secure checkout
* Online payment processing

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Font Awesome

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* Express Session
* Bcrypt
* Firebase Authentication

### Third-Party Services

* Stripe
* Fast2SMS

### File Upload

* Multer

### PDF Generation

* PDFKit


## API Endpoints

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| POST   | `/api/register`        | User registration                  |
| POST   | `/api/login`           | User login                         |
| POST   | `/api/logout`          | User logout                        |
| GET    | `/api/check-auth`      | Check authentication               |
| GET    | `/api/products`        | Get products                       |
| GET    | `/api/products/search` | Search products                    |
| POST   | `/api/order`           | Place an order                     |
| GET    | `/api/orders`          | Get user orders                    |
| POST   | `/api/custom-upload`   | Upload a custom design             |
| GET    | `/api/wishlist`        | Get wishlist                       |
| POST   | `/api/wishlist/add`    | Add a product to the wishlist      |
| POST   | `/api/wishlist/remove` | Remove a product from the wishlist |
| POST   | `/api/admin/login`     | Admin login                        |
| GET    | `/api/admin/orders`    | Get all orders                     |

---

## Future Improvements

* Email notifications
* OTP verification
* UPI payments
* Product reviews
* Order status notifications
* Mobile application
* AI-based product recommendations

---

## Author

**Riddhi Rajesh Gurav**

**Project:** Morya Stationery Store

**GitHub Repository:** `https://github.com/Learnspoint11/stationery-store`
