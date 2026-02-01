# Blackbird Tattoo Backend – Structure & Flow

This document describes the project structure, data flow, and API behavior for the Blackbird Tattoo backend. Use it when handing off to another Cursor instance or onboarding.

---

## 1. Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken), bcrypt for passwords
- **Other:** dotenv, cors, axios (WhatsApp), uuid

---

## 2. Project Structure

```
backend/
├── server.js                    # Entry point: DB connect, seed admin, mount routes
├── package.json
├── .env                         # Not committed; see .env.example / README
├── README.md
├── STRUCTURE_AND_FLOW.md        # This file
│
├── postman/
│   ├── blackbird-tattoo.postman_collection.json   # All APIs + demo responses
│   └── blackbird-tattoo.postman_environment.json   # baseUrl, token, etc.
│
└── src/
    ├── config/
    │   ├── database.js          # Mongoose connect + events
    │   └── constants.js         # ROLES, JWT_CONFIG, MESSAGES, PAYMENT_METHODS, etc.
    │
    ├── models/
    │   ├── admin.model.js       # Admin: name, email, password, role
    │   ├── employee.model.js    # Employee: fullName, email, phoneNumber, employeeNumber, branchId, etc.
    │   ├── branch.model.js      # Branch: name, address, branchNumber, employeeCount
    │   ├── user.model.js        # User (customer): fullName, phone, email, totalOrders, totalAmount
    │   └── booking.model.js     # Booking (invoice): phone, fullName, amount, size, artistName, paymentMethod, branchId, employeeId (creator), userId
    │
    ├── services/
    │   ├── admin.service.js     # Admin CRUD / findByEmail
    │   ├── employee.service.js  # Employee CRUD + branch count updates
    │   ├── branch.service.js    # Branch CRUD + employee count
    │   ├── user.service.js      # User (customer) CRUD + stats
│   ├── booking.service.js   # Create booking, find by branch, WhatsApp trigger
│   ├── auth.service.js      # Login (admin/employee), verifyUser
│   ├── dashboard.service.js # getDashboardData(startDate, endDate)
│   └── whatsapp.service.js  # Send template message (blackbird_invoice)
    │
    ├── controllers/
    │   ├── auth.controller.js   # login, getCurrentUser
    │   ├── employee.controller.js
    │   ├── branch.controller.js
│   ├── booking.controller.js
│   ├── user.controller.js
│   ├── dashboard.controller.js
│   └── ...
    │
    ├── middlewares/
    │   ├── auth.middleware.js   # JWT verify, set req.user, optional refresh
    │   ├── admin.middleware.js # req.user.role === 'admin'
    │   └── error.middleware.js  # Global error + 404
    │
    ├── routes/
    │   ├── auth.routes.js       # POST /login, GET /me
    │   ├── employee.routes.js   # CRUD + search (admin only)
    │   ├── branch.routes.js     # Create, get all, update (admin only)
│   ├── booking.routes.js    # Create, get (admin all / employee by branch)
│   ├── user.routes.js       # GET all users (admin only)
│   └── dashboard.routes.js  # GET dashboard (admin only, startDate, endDate)
    │
    ├── utils/
    │   ├── response.js          # successResponse, createdResponse, notFoundResponse, etc.
    │   ├── jwt.js               # generateToken, verifyToken, shouldRefreshToken
    │   ├── passwordHash.js      # hashPassword, comparePassword
    │   └── whatsappTemplates.js # buildTemplatePayload, getBlackbirdInvoicePayload
    │
    └── scripts/
        └── seedAdmin.js         # On startup: create admin from .env if not exists
```

---

## 3. Standard API Response Format

Every API returns:

```json
{
  "message": "Human-readable message",
  "data": { ... }
}
```

- Success: `message` describes the action; `data` holds the result (object or array).
- Error: `message` describes the error; `data` may be `null` or validation details.

---

## 4. Authentication & Authorization

### 4.1 Two roles

- **admin** – From `Admin` collection; seeded from `.env` (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
- **employee** – From `Employee` collection; created by admin, belongs to a branch.

### 4.2 Login (single endpoint for both)

- **POST /api/auth/login**  
  Body: `{ "email", "password" }`.  
  Checks Admin first, then Employee. Returns JWT and user info.  
  Token payload: `{ id, email, role }`. **User id and role are never passed in other APIs; they come only from the token.**

### 4.3 Protected routes

- **JWT:** `Authorization: Bearer <token>`.
- **Middleware:** `auth.middleware.js` verifies token, sets `req.user = { id, email, role }`, optionally sends refreshed token in `X-New-Token`.
- **Admin-only:** `admin.middleware.js` after auth; returns 403 if `req.user.role !== 'admin'`.

### 4.4 Who can do what

| Area              | Admin | Employee |
|-------------------|-------|----------|
| Login             | ✅    | ✅       |
| GET /auth/me      | ✅    | ✅       |
| Branches CRUD     | ✅    | ❌       |
| Employees CRUD    | ✅    | ❌       |
| Create booking    | ✅    | ✅       |
| Get bookings      | ✅ All | ✅ Own branch only |
| Get all users     | ✅    | ❌       |
| Get dashboard     | ✅ (full) | ✅ (branch) |

---

## 5. Main Flows

### 5.1 Startup

1. Load `.env`.
2. Connect MongoDB (`config/database.js`).
3. Run `seedAdmin.js`: if no admin with `ADMIN_EMAIL`, create one from `.env`.
4. Start Express on `PORT`, mount routes.

### 5.2 Create booking (invoice)

1. **POST /api/bookings** (auth required, admin or employee).
2. Body: `phone`, `fullName`, `amount`, `size`, `artistName`, `paymentMethod`, `branchId`. Optional: `email`.
3. **Creator:** `employeeId` on booking is set from token: `req.user.id` (admin or employee). Not sent in body.
4. Branch and user (customer) are validated/created/updated:
   - Find or create **User** by `phone`; update `totalOrders` and `totalAmount`.
5. Booking is saved with `userId`, `branchId`, `employeeId` (creator), etc.
6. WhatsApp: if enabled, send template `blackbird_invoice` via `whatsapp.service.js` (template built in `whatsappTemplates.js`). Failure does not fail the booking.

### 5.3 Get bookings

- **GET /api/bookings** (auth required).
- **Admin:** all bookings.
- **Employee:** only bookings for their branch (`employee.branchId` from `req.user.id`).

### 5.4 Employee & branch counts

- Creating an employee increments branch `employeeCount`.
- Updating employee’s branch: decrement old branch, increment new branch.
- Deleting an employee decrements branch `employeeCount`.
- No branch delete API.

### 5.5 Dashboard (admin or employee)

- **GET /api/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD**
- Query params: **startDate**, **endDate** (required, format YYYY-MM-DD).
- Uses **booking.date** for filtering (invoice date).
- **Admin:** returns full dashboard:
  - **dateRange:** echoed start/end dates.
  - **summary:** totalBookings, totalRevenue, uniqueCustomersInRange, averageOrderValue (in range).
  - **byBranch:** per-branch bookingCount, revenue, branchName, branchNumber, employeeCount (in range).
  - **byPaymentMethod:** per payment method (CASH, UPI) count and totalAmount (in range).
  - **totals:** totalBranches, totalEmployees, totalCustomers (snapshot, not date filtered).
- **Employee:** returns branch dashboard for their assigned branch only:
  - **dateRange:** echoed start/end dates.
  - **branchInfo:** branchId, branchName, branchNumber, employeeCount.
  - **summary:** totalBookings, totalRevenue, uniqueCustomersInRange, averageOrderValue (for that branch in range).
  - **byPaymentMethod:** per payment method (CASH, UPI) count and totalAmount (for that branch in range).
  - No **byBranch** or **totals** (single-branch view).

### 5.6 Users (customers)

- **User** is created/updated when a booking is created (by phone).
- **GET /api/users** (admin only): list all users (customers) with basic fields.

---

## 6. Database Collections (high level)

| Collection  | Purpose |
|------------|---------|
| admins     | Admin users (name, email, hashed password, role). |
| employees  | Staff: fullName, email, phoneNumber, employeeNumber, branchId, etc. |
| branches   | name, address, branchNumber, employeeCount. |
| users      | Customers: fullName, phone, email, totalOrders, totalAmount. |
| bookings   | Invoices: customer info, amount, size, artistName, paymentMethod, branchId, employeeId (creator), userId, date. |

- **booking.employeeId** = creator of the invoice (admin or employee id from token).
- **booking.userId** = customer (User) linked to the booking.

---

## 7. WhatsApp

- **Config:** `.env`: WHATSAPP_ENABLED, WHATSAPP_TOKEN, TEST_NUM_ID, etc.
- **Template:** `blackbird_invoice` (name/language/parameters defined in `whatsappTemplates.js`).
- **Trigger:** After a booking is created; phone is normalized (e.g. +91 prefix in code).
- **Utility:** `utils/whatsappTemplates.js` – template names, `buildTemplatePayload`, `getBlackbirdInvoicePayload` for consistent, maintainable template usage.

---

## 8. Postman Collection

- **File:** `postman/blackbird-tattoo.postman_collection.json`.
- **Environment:** `postman/blackbird-tattoo.postman_environment.json` (baseUrl, token, adminEmail, adminPassword, lastCreatedBranchId, lastCreatedEmployeeId, testCustomerPhone, etc.).
- **Auth:** Collection uses Bearer `{{token}}`. Login requests save token to env; no API requires sending current user id in body/query.
- **Demo responses:** Every request has at least one example response (success, 200/201) with sample `message` and `data` so another Cursor instance can see the exact response structure and status codes.

**Suggested order for testing:**

1. Health Check  
2. Login – Admin (saves token)  
3. Create Branch → Get All Branches → Update Branch  
4. Create Employee → Get All Employees → Get Employee by ID → Update Employee (optional: Search, Delete)  
5. Create Booking → Get Bookings  
6. Get All Users  
7. (Optional) Login – Employee, then Get Bookings again to see branch-scoped result  

---

## 9. Environment Variables (summary)

- `MONGO_URL` – MongoDB connection string.
- `PORT`, `NODE_ENV`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` – for seeding admin.
- `JWT_SECRET`
- WhatsApp: `WHATSAPP_ENABLED`, `WHATSAPP_TOKEN`, `TEST_NUM_ID`, etc.

---

## 10. Handoff Notes for Another Cursor Instance

- All **user identity** (id, role) comes from the **JWT**; never add “current user id” to body or query.
- **Resource ids** (e.g. which employee to update, which branch) are passed in URL or body as needed.
- **Response format** is always `{ message, data }`.
- **Errors** go through `error.middleware.js`; validation and duplicate-key errors are normalized.
- **Postman** collection includes demo responses for every API to reflect real response shape and codes.
