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
    │   ├── booking.model.js     # Booking (invoice): ..., reminderSentAt
    │   └── settings.model.js   # Single doc: whatsappEnabled, reminderEnabled, reminderTimeDays, selfInvoiceMessageEnabled
    │
    ├── services/
    │   ├── admin.service.js     # Admin CRUD / findByEmail
    │   ├── employee.service.js  # Employee CRUD + branch count updates
    │   ├── branch.service.js    # Branch CRUD + employee count
    │   ├── user.service.js      # User (customer) CRUD + stats
│   ├── booking.service.js   # Create booking, get all / by branch (filters, pagination)
│   ├── auth.service.js      # Login (admin/employee), verifyUser
│   ├── dashboard.service.js # getDashboardData, getBranchDashboardData
│   ├── settings.service.js  # getSettings, updateSettings, seedSettings
│   └── whatsapp.service.js  # sendInvoiceMessage, sendReminderMessage (blackbird_invoice, blackbird_checkup_reminder)
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
│   ├── dashboard.routes.js  # GET dashboard (admin/employee)
│   └── settings.routes.js   # GET/PUT settings (admin only)
    │
    ├── utils/
    │   ├── response.js          # successResponse, createdResponse, notFoundResponse, etc.
    │   ├── jwt.js               # generateToken, verifyToken, shouldRefreshToken
    │   ├── passwordHash.js      # hashPassword, comparePassword
    │   └── whatsappTemplates.js # buildTemplatePayload, getBlackbirdInvoicePayload, getBlackbirdCheckupReminderPayload
    │
    ├── jobs/
    │   └── reminderCron.js     # Every 12h: send checkup reminder (settings.reminderEnabled, reminderTimeDays)
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
| GET/PUT settings  | ✅        | ❌          |

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
6. WhatsApp (driven by **settings**): if `whatsappEnabled`, send template `blackbird_invoice` to customer. If `selfInvoiceMessageEnabled` and env `WHATSAPP_NUM` is set, send same invoice to that number (self). Failure does not fail the booking.

### 5.3 Get bookings

- **GET /api/bookings** (auth required). Query: **branchId** (admin only, optional), **startDate**, **endDate** (YYYY-MM-DD), **page**, **limit** (default 10, max 100).
- **Admin:** all bookings (optional branchId filter). **Employee:** only their branch; date filter and pagination apply.
- Response: `{ count, total, page, limit, bookings }`.

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
- **GET /api/users** (admin only): list users. Query: **branchId** (optional – users who have a booking at that branch), **page**, **limit**. Response: `{ count, total, page, limit, users }`.

### 5.7 Employees list

- **GET /api/employees** (admin only). Query: **branchId** (optional), **page**, **limit**. Response: `{ count, total, page, limit, employees }`.

### 5.8 Settings (admin only)

- **GET /api/settings** – returns single settings doc: `whatsappEnabled` (default true), `reminderEnabled` (default true), `reminderTimeDays` (default 60, min 1), `selfInvoiceMessageEnabled` (default true).
- **PUT /api/settings** – body: any of the above fields to update.
- Settings are seeded on startup if none exist.

### 5.9 Reminder cron

- **Cron:** every 12 hours (node-cron). Reads settings: if `reminderEnabled`, finds bookings where `date` is at least `reminderTimeDays` ago and `reminderSentAt` is null, sends WhatsApp template `blackbird_checkup_reminder` (params: customer name, days passed), then sets `reminderSentAt`.
- Template: "Hello {{1}}, Post-service care update. {{2}} days have passed since the tattoo session. Follow-up checkup status: pending. Thank you."

---

## 6. Database Collections (high level)

| Collection  | Purpose |
|------------|---------|
| admins     | Admin users (name, email, hashed password, role). |
| employees  | Staff: fullName, email, phoneNumber, employeeNumber, branchId, etc. |
| branches   | name, address, branchNumber, employeeCount. |
| users      | Customers: fullName, phone, email, totalOrders, totalAmount. |
| bookings   | Invoices: ..., date, reminderSentAt. |
| settings   | Single doc: whatsappEnabled, reminderEnabled, reminderTimeDays, selfInvoiceMessageEnabled. |

- **booking.employeeId** = creator of the invoice (admin or employee id from token).
- **booking.userId** = customer (User) linked to the booking.

---

## 7. WhatsApp

- **Config:** `.env`: WHATSAPP_TOKEN, TEST_NUM_ID, **WHATSAPP_NUM** (number to receive self-invoice copy). Enable/disable is controlled by DB settings only.
- **DB settings:** `whatsappEnabled`, `selfInvoiceMessageEnabled` – invoice to customer and to WHATSAPP_NUM only when enabled.
- **Templates:** `blackbird_invoice` (invoice), `blackbird_checkup_reminder` (reminder: {{1}} name, {{2}} days passed).
- **Trigger invoice:** After booking creation (if settings.whatsappEnabled; self copy if settings.selfInvoiceMessageEnabled and WHATSAPP_NUM).
- **Trigger reminder:** Cron every 12h; sends to customers whose booking is >= reminderTimeDays old and reminderSentAt is null.
- **Utility:** `utils/whatsappTemplates.js` – `getBlackbirdInvoicePayload`, `getBlackbirdCheckupReminderPayload`.

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
- WhatsApp: `WHATSAPP_TOKEN`, `TEST_NUM_ID`, `WHATSAPP_NUM` (self-invoice copy). Enable/disable via GET/PUT /api/settings.

---

## 10. Handoff Notes for Another Cursor Instance

- All **user identity** (id, role) comes from the **JWT**; never add “current user id” to body or query.
- **Resource ids** (e.g. which employee to update, which branch) are passed in URL or body as needed.
- **Response format** is always `{ message, data }`.
- **Errors** go through `error.middleware.js`; validation and duplicate-key errors are normalized.
- **Postman** collection includes demo responses for every API to reflect real response shape and codes.
