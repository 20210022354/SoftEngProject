# SoftEngProject
DTL INVENORY AS OUR PROJECT FOR SOFTWARE ENGINEERING

# DTL Inventory System - Prototype

This is a prototype for the Downtown Lounge (DTL) Inventory Management System, built with React, TypeScript, and Firebase. This prototype is focused on core functionalities: **user authentication, product management, and stock transactions.**

**Live Demo URL:** `[Your V-ercel URL, e.g., softengproject.vercel.app]`

---

## 1. Features

This prototype demonstrates the following key features:

* **User Authentication:** Secure login using Firebase Authentication. The app is protected, and no pages can be accessed without logging in.
* **Product Management (CRUD):**
    * **Create:** Add new products to the inventory via a form.
    * **Read:** View a real-time list of all inventory products.
    * **Update:** Edit existing product details.
    * **Delete:** Remove products from the inventory.
* **Stock Transactions:**
    * Record stock movements (In, Out, or Adjustment) for any product.
    * Uses a **batched write** to update product quantity and create a transaction log simultaneously, ensuring data integrity.


## 2. Tech Stack & Architecture

This project was built with a modern, scalable tech stack:

* **Frontend:** React (Vite), TypeScript, Tailwind CSS
* **Backend (BaaS):** Firebase
    * **Authentication:** Manages user login (Email/Password).
    * **Firestore:** NoSQL database for `users`, `products`, `categories`, and `transactions` data.
* **Deployment:** Vercel (connected directly to the GitHub repository).

### Simple Architecture

The application flow is as follows:

1.  User visits the live URL.
2.  React Router renders the `Login` page.
3.  User logs in using credentials, which are verified by **Firebase Auth**.
4.  Upon success, the user is redirected to the `Products` page.
5.  The user can navigate between the `Products` and `Transactions` pages via the sidebar.
6.  All operations are sent from React to `storage.ts` and then to **Firestore**, which updates in real-time.


## 3. How to Use the Prototype

To test the live prototype, use the following administrator credentials:

* **Email:** `ram05sembrano@gmail.com`
* **Password:** `[Your Password]`

Upon logging in, you will be taken directly to the **Products** page. You can also navigate to the **Transactions** page using the sidebar to log stock changes.


## 4. Firebase Database Structure

To support the application, the Firestore database is structured into four main collections:

### `users`
* Stores user profile information.
* **Crucially, the Document ID is the same as the User's UID from Firebase Auth.**
* **Fields:** `id`, `email`, `fullName`, `role`

### `categories`
* Populates the dropdown menu in the "Add Product" form.
* **Fields:** `id`, `name`, `description`

### `products`
* Stores all individual inventory items.
* **Fields:** `id`, `name`, `sku`, `categoryId`, `categoryName`, `quantity`, `unitCost`, etc.

### `transactions`
* Stores a complete, real-time log of all stock movements.
* **Fields:** `id`, `productId`, `productName`, `quantity`, `transactionType`, `reason`, `transactionDate`, etc.


## 5. Deployment

This project is deployed live to **Vercel** and is connected to the `main` branch of this GitHub repository.

### Environment Variables
The Vercel project has been configured with the following environment variables (from the `.env` file) to connect to Firebase:

* `VITE_API_KEY`
* `VITE_AUTH_DOMAIN`
* `VITE_PROJECT_ID`
* `VITE_STORAGE_BUCKET`
* `VITE_MESSAGING_SENDER_ID`
* `VITE_APP_ID`
* `VITE_MEASUREMENT_ID`


### Firebase Auth Domain
To allow the Vercel URL to be a trusted login source, the live domain (`[your-url].vercel.app`) has been added to the **"Authorized domains"** list in the Firebase Authentication settings.
