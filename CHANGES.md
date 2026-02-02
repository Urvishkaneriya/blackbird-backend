# Blackbird Tattoo Backend – Recent Changes

This document explains the changes added: **Settings API**, **self-invoice to your number**, **reminder cron**, **branch filter**, **pagination**, and **date filter** on list APIs.

---

## 1. Settings API (Admin Only)

Settings are stored in the database (single document) and control WhatsApp and reminder behaviour.

### Endpoints

| Method | Endpoint        | Description                | Access   |
|--------|-----------------|----------------------------|----------|
| GET    | `/api/settings` | Get current settings       | Admin    |
| PUT    | `/api/settings` | Update settings            | Admin    |

### Settings Fields

| Field                     | Type    | Default | Description |
|---------------------------|---------|---------|-------------|
| `whatsappEnabled`         | boolean | `true`  | Send invoice/reminder via WhatsApp when enabled. |
| `reminderEnabled`        | boolean | `true`  | Allow reminder cron to send checkup reminders. |
| `reminderTimeDays`       | number  | `60`    | Send reminder this many days after tattoo session (min: 1). |
| `selfInvoiceMessageEnabled` | boolean | `true` | Send a copy of the invoice to `WHATSAPP_NUM` when a booking is created. |

### Example Responses

**GET /api/settings** (200)

```json
{
  "message": "Settings fetched successfully",
  "data": {
    "_id": "678s001",
    "whatsappEnabled": true,
    "reminderEnabled": true,
    "reminderTimeDays": 60,
    "selfInvoiceMessageEnabled": true,
    "createdAt": "2026-01-19T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

**PUT /api/settings** (200)  
Body: `{ "reminderTimeDays": 45, "selfInvoiceMessageEnabled": false }`

```json
{
  "message": "Settings updated successfully",
  "data": {
    "_id": "678s001",
    "whatsappEnabled": true,
    "reminderEnabled": true,
    "reminderTimeDays": 45,
    "selfInvoiceMessageEnabled": false,
    "createdAt": "2026-01-19T10:00:00.000Z",
    "updatedAt": "2026-01-19T12:00:00.000Z"
  }
}
```

- Default settings are created on server startup if no document exists.
- Only admins can call GET/PUT settings.

---

## 2. Self-Invoice to Your Number

When a booking is created:

1. If **settings.whatsappEnabled** is true, the invoice is sent to the **customer** phone via WhatsApp (`blackbird_invoice` template).
2. If **settings.selfInvoiceMessageEnabled** is true and **env `WHATSAPP_NUM`** is set, the **same invoice** is sent to that number (your number).

### Configuration

- Add to `.env`:
  - `WHATSAPP_NUM=9876543210` (your 10-digit number; no +91 needed in env).

### Behaviour

- Self-invoice is sent only when both:
  - `selfInvoiceMessageEnabled` is true (from GET/PUT settings), and  
  - `WHATSAPP_NUM` is present in `.env`.
- If WhatsApp send fails, the booking is still created; errors are logged.

---

## 3. Reminder Cron (Checkup Reminder)

A cron job runs **every 12 hours** and sends a post-service checkup reminder via WhatsApp to customers whose tattoo session is old enough and who haven’t received a reminder yet.

### Logic

1. Read settings: if `reminderEnabled` is false, do nothing.
2. Find bookings where:
   - `date` is at least **`reminderTimeDays`** days ago, and  
   - `reminderSentAt` is null.
3. For each such booking, send WhatsApp template **`blackbird_checkup_reminder`** to the customer phone with:
   - **{{1}}** = customer name  
   - **{{2}}** = days since session  
4. On successful send, set **`reminderSentAt`** to current time so we don’t send again.

### Template (Meta WhatsApp)

- **Name:** `blackbird_checkup_reminder`
- **Body (example):**  
  `Hello {{1}}, Post-service care update. {{2}} days have passed since the tattoo session. Follow-up checkup status: pending. Thank you.`

### Booking Model Change

- **`reminderSentAt`** (Date, optional): set when reminder is sent; `null` until then.

### Cron Schedule

- Runs at **0:00 and 12:00** (every 12 hours), timezone `Asia/Kolkata`.
- Implemented in `src/jobs/reminderCron.js` and started from `server.js` after DB connect.

---

## 4. Branch Filter on List APIs

List APIs support an optional **`branchId`** query parameter to restrict results to one branch.

### Employees

- **GET /api/employees?branchId=**`<branchId>`
- Returns only employees assigned to that branch.
- Admin only.

### Users (Customers)

- **GET /api/users?branchId=**`<branchId>`
- Returns only **users (customers) who have at least one booking** at that branch.
- Admin only.

### Bookings

- **GET /api/bookings?branchId=**`<branchId>`
- **Admin:** optional; when provided, returns only bookings for that branch.
- **Employee:** always scoped to their branch; `branchId` is ignored (they only see their branch).

---

## 5. Pagination on List APIs

All list APIs now support **`page`** and **`limit`** and return **`total`**, **`page`**, and **`limit`** in the response.

### Query Parameters

| Param  | Type   | Default | Max   | Description        |
|--------|--------|--------|------|--------------------|
| `page` | number | 1      | -    | Page number (1-based). |
| `limit`| number | 10     | 100  | Items per page.     |

### Response Shape

List responses now include:

- **`count`** – number of items in the current page.
- **`total`** – total number of items matching the query.
- **`page`** – current page.
- **`limit`** – limit used.

### Affected Endpoints

| Endpoint              | Pagination      | Example query                    |
|-----------------------|-----------------|----------------------------------|
| GET /api/bookings     | page, limit     | `?page=1&limit=20`               |
| GET /api/users        | page, limit     | `?page=1&limit=10`               |
| GET /api/employees    | page, limit     | `?page=1&limit=10`               |

### Example Response (Bookings)

**GET /api/bookings?page=1&limit=10** (200)

```json
{
  "message": "Bookings fetched successfully",
  "data": {
    "count": 10,
    "total": 45,
    "page": 1,
    "limit": 10,
    "bookings": [
      {
        "_id": "678bk001",
        "bookingNumber": "INV0001",
        "phone": "9876543210",
        "fullName": "Jane Customer",
        "amount": 5000,
        "size": 5,
        "artistName": "Mike Tattoo Artist",
        "paymentMethod": "CASH",
        "branchId": { "name": "Downtown Branch", "branchNumber": "BRANCH0001" },
        "userId": { "fullName": "Jane Customer", "phone": "9876543210", "email": "customer@example.com" },
        "date": "2026-01-19T10:00:00.000Z",
        "reminderSentAt": null
      }
    ]
  }
}
```

Similar structure applies to **GET /api/users** and **GET /api/employees** (`users` / `employees` array plus `count`, `total`, `page`, `limit`).

---

## 6. Date Filter on Bookings

**GET /api/bookings** supports filtering by booking date.

### Query Parameters

| Param       | Type   | Format     | Description                    |
|------------|--------|------------|--------------------------------|
| `startDate`| string | YYYY-MM-DD | Start of date range (inclusive). |
| `endDate`  | string | YYYY-MM-DD | End of date range (inclusive).  |

### Example

- **GET /api/bookings?startDate=2026-01-01&endDate=2026-01-31**  
  Returns only bookings whose `date` falls in January 2026.

- Can be combined with **branchId**, **page**, and **limit**:  
  `?branchId=678b001&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20`

---

## 7. Summary Table

| Feature              | Endpoint / Area      | Change |
|----------------------|----------------------|--------|
| Settings             | GET/PUT /api/settings | New; single doc in DB; admin only. |
| Self-invoice         | Booking creation     | New; send invoice to WHATSAPP_NUM when enabled. |
| Reminder cron        | Server job           | New; every 12h; template blackbird_checkup_reminder; reminderSentAt on Booking. |
| Branch filter        | GET /employees, /users, /bookings | New optional `branchId` query. |
| Pagination           | GET /bookings, /users, /employees | New `page`, `limit`; response has `count`, `total`, `page`, `limit`. |
| Date filter          | GET /bookings        | New `startDate`, `endDate` (YYYY-MM-DD). |

---

## 8. Postman Collection

The Postman collection has been updated with:

- **Settings** folder: **Get Settings** and **Update Settings** with example requests and responses.
- **Get Bookings**: URL and description updated for `branchId`, `startDate`, `endDate`, `page`, `limit`; response example includes `total`, `page`, `limit`, and `reminderSentAt`.
- **Get All Employees**: URL and description for `branchId`, `page`, `limit`; response example includes `total`, `page`, `limit`.
- **Get All Users**: URL and description for `branchId`, `page`, `limit`; response example includes `total`, `page`, `limit`.

Use the examples in the collection to see the exact request query params and response shape for each API.
