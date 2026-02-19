# Booking + Product + Split Payment Changes (UI Integration Guide)

This document describes the latest backend changes for booking/invoice creation and dashboard.
Use this as the source of truth for frontend implementation.

## 1. What Changed

1. Booking creation now uses **product line items** instead of a single amount field.
2. Payment now supports:
   1. full cash
   2. full UPI
   3. split cash + UPI
3. Added admin-managed **Product** module.
4. Default product `Tattoo` is auto-seeded on startup.
5. WhatsApp invoice payload now supports split payment display.
6. Dashboard now includes:
   1. `byPaymentMode` (`CASH | UPI | SPLIT`)
   2. `topProducts`
   3. revenue based on `payment.totalAmount`

## 2. Product Rules

1. There is always one default product: `Tattoo` (`isDefault=true`).
2. Default `Tattoo` cannot be deactivated.
3. Admin can create additional products.
4. For non-default (admin-created) products, booking line price is fixed from product `basePrice`.
5. For default `Tattoo`, booking line `unitPrice` is editable per booking.
6. Currency is INR only.

## 3. New/Updated APIs

### 3.1 Product APIs (Admin only)

1. `GET /api/products`
2. `POST /api/products`
3. `PUT /api/products/:id`
4. `PATCH /api/products/:id/status`

#### Product shape

```json
{
  "_id": "678p0002",
  "name": "Aftercare Kit",
  "basePrice": 400,
  "isDefault": false,
  "isActive": true
}
```

### 3.2 Create Booking (updated)

`POST /api/bookings`

#### Request body

```json
{
  "phone": "9876543210",
  "email": "customer@example.com",
  "fullName": "Jane Customer",
  "artistName": "Mike Tattoo Artist",
  "size": 5,
  "branchId": "678b001",
  "items": [
    {
      "productId": "678p0001",
      "quantity": 1,
      "unitPrice": 300
    },
    {
      "productId": "678p0002",
      "quantity": 1
    }
  ],
  "payment": {
    "cashAmount": 300,
    "upiAmount": 400
  }
}
```

#### Response body (201)

```json
{
  "message": "Booking created successfully",
  "data": {
    "_id": "678bk001",
    "bookingNumber": "INV0001",
    "phone": "9876543210",
    "fullName": "Jane Customer",
    "artistName": "Mike Tattoo Artist",
    "size": 5,
    "items": [
      {
        "productId": "678p0001",
        "productName": "Tattoo",
        "quantity": 1,
        "unitPrice": 300,
        "lineTotal": 300
      },
      {
        "productId": "678p0002",
        "productName": "Aftercare Kit",
        "quantity": 1,
        "unitPrice": 400,
        "lineTotal": 400
      }
    ],
    "payment": {
      "cashAmount": 300,
      "upiAmount": 400,
      "totalAmount": 700,
      "paymentMode": "SPLIT"
    },
    "amount": 700,
    "paymentMethod": "CASH + UPI"
  }
}
```

### 3.3 Get Bookings (updated)

`GET /api/bookings`

Each booking now includes:
1. `items[]`
2. `payment` object
3. compatibility fields `amount` and `paymentMethod`

## 4. Validation Rules (Important for UI)

1. `items` must contain at least 1 row.
2. Each item requires `productId` and integer `quantity >= 1`.
3. For `Tattoo` (default product), `unitPrice` is required and editable.
4. For non-default products, frontend may send `unitPrice` but backend ignores it and uses catalog `basePrice`.
5. Payment rules:
   1. `cashAmount >= 0`
   2. `upiAmount >= 0`
   3. at least one must be > 0
   4. `cashAmount + upiAmount` must exactly match sum of item totals

## 5. WhatsApp Invoice Formatting

Invoice payload now supports:

1. `Payment Method`
   1. `CASH`
   2. `UPI`
   3. `CASH + UPI`
2. `Amount Paid`
   1. `₹300 CASH`
   2. `₹400 UPI`
   3. `₹300 CASH + ₹400 UPI`

## 6. Dashboard Changes

`GET /api/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

### New fields

1. `byPaymentMode`: booking count + revenue by `CASH | UPI | SPLIT`
2. `topProducts`: top 10 products by revenue in selected date range

### Existing fields retained

1. `summary`
2. `byBranch` (admin)
3. `byPaymentMethod`
4. `totals` (admin)
5. `branchInfo` (employee view)

## 7. Frontend Implementation Order

1. Load products (`GET /api/products`) and store:
   1. default Tattoo id
   2. admin product list
2. Booking form:
   1. add/remove line items
   2. for Tattoo line allow price input
   3. for admin product line show fixed catalog price (read-only)
3. Payment section:
   1. cash input
   2. upi input
   3. show computed total and mismatch error if not equal to item total
4. Submit booking using new payload.
5. Dashboard UI:
   1. add `byPaymentMode` card/table
   2. add `topProducts` chart/table

## 8. Postman Updated

Postman collection has been updated with:

1. Product Management folder
2. New booking payload examples (`items` + `payment`)
3. Updated dashboard examples (`byPaymentMode`, `topProducts`)
4. Environment vars:
   1. `defaultProductId`
   2. `lastCreatedProductId`
