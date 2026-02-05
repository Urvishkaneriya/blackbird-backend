# Blackbird Tattoo Backend – Marketing Templates Feature

This document explains the **Dynamic Marketing Templates** feature that allows admins to create, manage, and send WhatsApp marketing messages with dynamic parameters.

---

## Overview

The Marketing Templates feature enables you to:
- **Create reusable WhatsApp templates** stored in the database
- **Define dynamic parameters** (e.g., customer name, discount, expiry date)
- **Send marketing messages** to different audiences (single phone, list, branch customers, all customers)
- **Filter audiences by date** (e.g., customers with bookings in a date range)
- **Use per-user parameters** (e.g., automatically use each customer's name)
- **Track send jobs** with success/failure statistics

---

## 1. Marketing Template Model

Templates are stored in the `marketing_templates` collection with the following structure:

### Fields

| Field                 | Type     | Required | Description |
|-----------------------|----------|----------|-------------|
| `name`                | String   | Yes      | Internal unique key (uppercase, e.g., `WELCOME_DISCOUNT`) |
| `displayName`         | String   | Yes      | Human-friendly name (e.g., `Welcome Discount Offer`) |
| `channel`             | String   | Yes      | Currently only `"whatsapp"` |
| `whatsappTemplateName`| String   | Yes      | Exact name from Meta WhatsApp Business (e.g., `blackbird_welcome_discount`) |
| `languageCode`        | String   | No       | Language code (default: `"en"`) |
| `bodyExample`         | String   | No       | Example text showing how template looks (e.g., `Hello {{1}}, enjoy {{2}}% discount until {{3}}!`) |
| `parameters`          | Array    | No       | Array of parameter definitions (see below) |
| `isActive`            | Boolean  | No       | Whether template can be used (default: `true`) |
| `createdBy`           | ObjectId | Yes      | Admin ID who created it |

### Parameter Definition

Each parameter in the `parameters` array has:

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `key`         | String  | Yes      | Parameter key (e.g., `"customer_name"`, `"discount_percent"`) |
| `position`    | Number  | Yes      | Position in template (1 = {{1}}, 2 = {{2}}, etc.) |
| `type`        | String  | No       | `"string"`, `"number"`, or `"date"` (default: `"string"`) |
| `required`    | Boolean | No       | Whether parameter is required (default: `false`) |
| `description` | String  | No       | Description for UI/documentation |

**Note:** Template creation is simple - just define parameters. When **sending**, admin can either **type a value** OR **select from enum dropdown** (like `user_fullName`, `branch_name`) to get values from database automatically.

**Important:** Parameter positions must be **contiguous starting from 1** (1, 2, 3... not 1, 3, 5).

### Example Template Document

```json
{
  "_id": "tpl_abc123",
  "name": "WELCOME_DISCOUNT",
  "displayName": "Welcome Discount Offer",
  "channel": "whatsapp",
  "whatsappTemplateName": "blackbird_welcome_discount",
  "languageCode": "en",
  "bodyExample": "Hello {{1}}, enjoy a {{2}}% discount until {{3}}!",
  "parameters": [
    {
      "key": "name",
      "position": 1,
      "type": "string",
      "required": true,
      "description": "Customer name"
    },
    {
      "key": "percent",
      "position": 2,
      "type": "number",
      "required": true,
      "description": "Discount percentage"
    },
    {
      "key": "days",
      "position": 3,
      "type": "number",
      "required": true,
      "description": "Days"
    }
  ],
  "isActive": true,
  "createdBy": "678a123",
  "createdAt": "2026-01-19T10:00:00.000Z",
  "updatedAt": "2026-01-19T10:00:00.000Z"
}
```

---

## 2. Template Management APIs

All template APIs are **admin-only** (require authentication + admin role).

### 2.1 Create Template

**POST** `/api/marketing/templates`

**Request Body:**
```json
{
  "name": "WELCOME_DISCOUNT",
  "displayName": "Welcome Discount Offer",
  "channel": "whatsapp",
  "whatsappTemplateName": "blackbird_welcome_discount",
  "languageCode": "en",
  "bodyExample": "Hello {{1}}, enjoy a {{2}}% discount until {{3}}!",
  "parameters": [
    {
      "key": "customer_name",
      "position": 1,
      "type": "string",
      "required": true
    },
    {
      "key": "discount_percent",
      "position": 2,
      "type": "number",
      "required": true
    },
    {
      "key": "expiry_date",
      "position": 3,
      "type": "string",
      "required": true
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Marketing template created successfully",
  "data": {
    "_id": "tpl_abc123",
    "name": "WELCOME_DISCOUNT",
    "displayName": "Welcome Discount Offer",
    "channel": "whatsapp",
    "whatsappTemplateName": "blackbird_welcome_discount",
    "languageCode": "en",
    "bodyExample": "Hello {{1}}, enjoy a {{2}}% discount until {{3}}!",
    "parameters": [...],
    "isActive": true,
    "createdBy": { "name": "Admin", "email": "admin@example.com" },
    "createdAt": "2026-01-19T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

**Validation:**
- `name`, `displayName`, `whatsappTemplateName` are required
- `name` must be unique (stored uppercase)
- Parameter positions must be contiguous (1, 2, 3...)

---

### 2.2 List Templates

**GET** `/api/marketing/templates?channel=whatsapp&isActive=true&page=1&limit=10`

**Query Parameters:**
- `channel` (optional): Filter by channel (e.g., `whatsapp`)
- `isActive` (optional): Filter by active status (`true`/`false`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response (200):**
```json
{
  "message": "Templates fetched successfully",
  "data": {
    "count": 2,
    "total": 2,
    "page": 1,
    "limit": 10,
    "templates": [
      {
        "_id": "tpl_abc123",
        "name": "WELCOME_DISCOUNT",
        "displayName": "Welcome Discount Offer",
        "channel": "whatsapp",
        "whatsappTemplateName": "blackbird_welcome_discount",
        "isActive": true,
        "createdBy": { "name": "Admin", "email": "admin@example.com" },
        "createdAt": "2026-01-19T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.3 Get Template by ID

**GET** `/api/marketing/templates/:id`

**Response (200):**
```json
{
  "message": "Template fetched successfully",
  "data": {
    "_id": "tpl_abc123",
    "name": "WELCOME_DISCOUNT",
    "displayName": "Welcome Discount Offer",
    "channel": "whatsapp",
    "whatsappTemplateName": "blackbird_welcome_discount",
    "languageCode": "en",
    "bodyExample": "Hello {{1}}, enjoy a {{2}}% discount until {{3}}!",
    "parameters": [...],
    "isActive": true,
    "createdBy": { "name": "Admin", "email": "admin@example.com" },
    "createdAt": "2026-01-19T10:00:00.000Z",
    "updatedAt": "2026-01-19T10:00:00.000Z"
  }
}
```

---

### 2.4 Update Template

**PUT** `/api/marketing/templates/:id`

**Request Body:** Any fields to update (e.g., `{ "isActive": false }` or `{ "parameters": [...] }`)

**Response (200):** Updated template document

---

### 2.5 Delete Template

**DELETE** `/api/marketing/templates/:id`

**Response (200):**
```json
{
  "message": "Template deleted successfully",
  "data": {
    "deletedTemplate": {
      "id": "tpl_abc123",
      "name": "WELCOME_DISCOUNT",
      "displayName": "Welcome Discount Offer"
    }
  }
}
```

---

## 3. Preview & Send APIs

### 3.1 Preview Template

**POST** `/api/marketing/templates/:id/preview`

Preview how a template will look with given parameters **without sending**.

**Request Body:**
```json
{
  "parameters": {
    "customer_name": "John",
    "discount_percent": 20,
    "expiry_date": "31 Jan 2026"
  }
}
```

**Response (200):**
```json
{
  "message": "Preview generated successfully",
  "data": {
    "renderedText": "Hello John, enjoy a 20% discount until 31 Jan 2026!",
    "whatsappTemplateName": "blackbird_welcome_discount",
    "languageCode": "en",
    "mappedParameters": ["John", "20", "31 Jan 2026"]
  }
}
```

**Note:** You can provide typed values OR enum values (like `"user_fullName"`). Enum values will show as empty in preview since no user data is available - they're resolved when actually sending.

**How it works:**
1. Loads template from database
2. For each parameter:
   - If value is an enum (like `"user_fullName"`) → resolves to empty string (preview doesn't have user data)
   - Otherwise → uses provided value as-is
   - If `source: "static"` → uses value from `parameters` object
3. Maps to ordered array based on `position` (1→{{1}}, 2→{{2}}, etc.)
4. Replaces `{{n}}` in `bodyExample` with actual values
5. Returns preview text and the ordered array that will be sent to WhatsApp

---

### 3.2 Send Marketing Message

**POST** `/api/marketing/templates/:id/send`

Sends marketing messages to an audience using the template.

**Request Body Structure:**
```json
{
  "audience": {
    "type": "single" | "list" | "branch_customers" | "all_customers",
    // ... audience-specific fields (see below)
  },
  "parameters": {
    "name": "user_fullName",    // ← Enum value (resolved from database)
    "percent": 20,               // ← Typed value
    "days": 30                   // ← Typed value
  }
}
```

**Parameter Values:**
- **Type a value** (string/number) → Used as-is
- **OR select enum** (like `"user_fullName"`, `"branch_name"`) → System resolves from database automatically

**Available Enum Values:** Get via `GET /api/marketing/dynamic-fields`
- `user_fullName` - Customer's full name
- `user_phone` - Customer's phone
- `user_email` - Customer's email
- `branch_name` - Branch name
- `branch_number` - Branch number

---

## 4. Audience Types

### 4.1 Single Phone

Send to one phone number.

**Request:**
```json
{
  "audience": {
    "type": "single",
    "phone": "9876543210"
  },
  "parameters": {
    "discount_percent": 20,
    "expiry_date": "31 Jan 2026"
  }
}
```

**How it works:**
- Sends one message to the specified phone number
- If parameter value is an enum (like `"user_fullName"`), system tries to find user by phone and resolves the value
- Otherwise, uses typed value as-is

---

### 4.2 List of Phones

Send to multiple phone numbers (same message for all).

**Request:**
```json
{
  "audience": {
    "type": "list",
    "phones": ["9876543210", "9123456789", "9988776655"]
  },
  "parameters": {
    "discount_percent": 15,
    "expiry_date": "15 Feb 2026"
  }
}
```

**How it works:**
- Sends the same message to all phones in the array
- If parameter value is an enum (like `"user_fullName"`), system tries to resolve from database for each phone
- Otherwise, uses typed value for all recipients

---

### 4.3 Branch Customers (with Date Filter)

Send to all customers who have bookings at a specific branch, optionally filtered by booking date.

**Request:**
```json
{
  "audience": {
    "type": "branch_customers",
    "branchId": "678b001",
    "dateFilter": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
  },
  "parameters": {
    "name": "user_fullName",    // ← Enum: auto-filled from each customer
    "percent": 15,               // ← Typed value: same for all
    "days": 30                   // ← Typed value: same for all
  }
}
```

**How it works:**
1. Queries `Booking` collection:
   - Filters by `branchId = "678b001"`
   - If `dateFilter` provided: filters by `date` between `startDate` and `endDate`
   - Gets distinct `userId` values
2. Loads `User` documents for those `userId`s
3. Loads `Branch` document for `branchId` (for resolving `branch_*` enum values)
4. For each user:
   - Checks each parameter value:
     - If enum (like `"user_fullName"`) → resolves from `user` or `branch` object
     - Otherwise → uses typed value as-is
   - Builds ordered parameter array
   - Sends WhatsApp message to `user.phone`
5. Returns send job with stats

**Date Filter:**
- If `dateFilter` is provided: only customers with bookings in that date range
- If omitted: all customers who have bookings at that branch

**Enum Resolution:**
- `"user_fullName"` → Gets `user.fullName` for each customer
- `"branch_name"` → Gets `branch.name` (same for all customers in branch)
- Typed values → Used as-is for all customers

---

### 4.4 All Customers (with Date Filter)

Send to all customers in the system, optionally filtered by booking date.

**Request:**
```json
{
  "audience": {
    "type": "all_customers",
    "dateFilter": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
  },
  "parameters": {
    "name": "user_fullName",    // ← Enum: auto-filled from each customer
    "percent": 10,               // ← Typed value: same for all
    "days": 30                   // ← Typed value: same for all
  }
}
```

**How it works:**
1. Queries `Booking` collection:
   - If `dateFilter` provided: filters by `date` between `startDate` and `endDate`
   - Gets distinct `userId` values
2. If no `dateFilter`: gets all `User` documents
3. For each user:
   - Checks each parameter value:
     - If enum (like `"user_fullName"`) → resolves from `user` object
     - Otherwise → uses typed value as-is
   - Builds ordered parameter array and sends WhatsApp message

**Date Filter:**
- If provided: only customers with bookings in that date range
- If omitted: all customers in the system

---

## 5. Send Job Tracking

Every send operation creates a **MarketingSend** document that tracks the job.

### Send Job Fields

| Field             | Type     | Description |
|-------------------|----------|-------------|
| `templateId`      | ObjectId | Template used |
| `triggeredBy`     | ObjectId | Admin who triggered it |
| `audienceType`    | String   | `single`, `list`, `branch_customers`, `all_customers` |
| `audienceFilter`  | Object   | Audience configuration (type, phone, branchId, dateFilter, etc.) |
| `parameters`      | Object   | Parameters used (can include enum values like `"user_fullName"`) |
| `status`          | String   | `pending`, `running`, `completed`, `failed`, `partial` |
| `stats`           | Object   | `{ total, success, failed }` |
| `completedAt`     | Date     | When job finished |

### Send Response

**POST** `/api/marketing/templates/:id/send` returns immediately:

```json
{
  "message": "Marketing send started",
  "data": {
    "_id": "ms_123",
    "templateId": "tpl_abc123",
    "triggeredBy": "678a123",
    "audienceType": "branch_customers",
    "audienceFilter": {
      "type": "branch_customers",
      "branchId": "678b001",
      "dateFilter": { "startDate": "2026-01-01", "endDate": "2026-01-31" }
    },
    "parameters": { "name": "user_fullName", "percent": 15, "days": 30 },
    "status": "pending",
    "stats": { "total": 0, "success": 0, "failed": 0 },
    "createdAt": "2026-01-19T10:00:00.000Z"
  }
}
```

The job runs **synchronously** (sends all messages before returning), so the response includes final stats.

---

## 6. Send Job APIs

### 6.1 Get Send Job by ID

**GET** `/api/marketing/sends/:id`

**Response (200):**
```json
{
  "message": "Send job fetched successfully",
  "data": {
    "_id": "ms_123",
    "templateId": {
      "_id": "tpl_abc123",
      "name": "WELCOME_DISCOUNT",
      "displayName": "Welcome Discount Offer",
      "whatsappTemplateName": "blackbird_welcome_discount"
    },
    "triggeredBy": {
      "_id": "678a123",
      "name": "Admin",
      "email": "admin@example.com"
    },
    "audienceType": "branch_customers",
    "audienceFilter": {...},
    "parameters": { "name": "user_fullName", "percent": 15, "days": 30 },
    "status": "completed",
    "stats": {
      "total": 120,
      "success": 115,
      "failed": 5
    },
    "completedAt": "2026-01-19T10:05:00.000Z",
    "createdAt": "2026-01-19T10:00:00.000Z"
  }
}
```

---

### 6.2 List Send Jobs

**GET** `/api/marketing/sends?page=1&limit=10`

**Response (200):**
```json
{
  "message": "Send jobs fetched successfully",
  "data": {
    "count": 10,
    "total": 25,
    "page": 1,
    "limit": 10,
    "sends": [
      {
        "_id": "ms_123",
        "templateId": {
          "name": "WELCOME_DISCOUNT",
          "displayName": "Welcome Discount Offer"
        },
        "triggeredBy": {
          "name": "Admin",
          "email": "admin@example.com"
        },
        "audienceType": "branch_customers",
        "status": "completed",
        "stats": { "total": 120, "success": 115, "failed": 5 },
        "createdAt": "2026-01-19T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 7. How It Works Internally

### 7.1 Parameter Mapping

When you send a message:

1. **Load template** from database (includes `parameters` array with `position` and `source` values)
2. **Build ordered array:**
   - Sort parameters by `position` (1, 2, 3...)
   - For each parameter:
     - If `source: "user"` → get value from `user[userField]` (e.g., `user.fullName`)
     - If `source: "static"` → get value from `parameters` object using `key`
     - Convert to string (numbers converted to string)
     - Add to ordered array
3. **Send to WhatsApp:**
   - Uses `buildTemplatePayload(templateName, orderedArray, languageCode)`
   - Calls Meta WhatsApp API with template name and ordered parameters

**Example:**
- Template has: `[{ key: "customer_name", position: 1 }, { key: "discount_percent", position: 2 }]`
- You provide: `{ customer_name: "John", discount_percent: 20 }`
- Ordered array: `["John", "20"]`
- WhatsApp receives: `{{1}} = "John"`, `{{2}} = "20"`

---

### 7.2 Audience Resolution

**For `branch_customers` and `all_customers`:**

1. **Query bookings:**
   ```javascript
   const query = {};
   if (branchId) query.branchId = branchId;
   if (dateFilter) {
     query.date = { $gte: startDate, $lte: endDate };
   }
   const userIds = await Booking.distinct('userId', query);
   ```

2. **Load users:**
   ```javascript
   const users = await User.find({ _id: { $in: userIds } });
   ```

3. **Load branch** (if `branchId` provided, for resolving `branch_*` enum values)
4. **Send to each:**
   - For each user, build parameters (resolve enum values from `user`/`branch` objects)
   - Send WhatsApp message to `user.phone`

---

### 7.3 WhatsApp Integration

- Uses existing `whatsapp.service.js` with new `sendMarketingMessage()` method
- Respects `settings.whatsappEnabled` (if disabled, send fails)
- Uses `buildTemplatePayload()` from `whatsappTemplates.js` (already generic)
- Phone numbers are formatted: removes non-digits, ensures `+91` prefix

---

## 8. Validation & Error Handling

### Template Creation
- `name` must be unique
- Parameter positions must be contiguous (1, 2, 3...)
- `whatsappTemplateName` must match Meta template name exactly

### Sending
- Template must exist and be `isActive`
- `whatsappEnabled` must be `true` in settings
- Provide all **required parameters** (can be typed values OR enum values)
- Enum values (like `"user_fullName"`) are resolved from database automatically
- Get available enum options via `GET /api/marketing/dynamic-fields`
- Audience validation:
  - `single`: `phone` required
  - `list`: `phones` array required
  - `branch_customers`: `branchId` required
- Date filter: `startDate` and `endDate` must be valid YYYY-MM-DD format

---

## 9. Summary

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Create template | POST `/api/marketing/templates` | Create new marketing template |
| List templates | GET `/api/marketing/templates` | List with filters + pagination |
| Get template | GET `/api/marketing/templates/:id` | Get single template |
| Update template | PUT `/api/marketing/templates/:id` | Update template fields |
| Delete template | DELETE `/api/marketing/templates/:id` | Delete template |
| Get dynamic fields | GET `/api/marketing/dynamic-fields` | Get enum options for dropdown |
| Preview | POST `/api/marketing/templates/:id/preview` | Preview with parameters |
| Send | POST `/api/marketing/templates/:id/send` | Send to audience |
| Get send job | GET `/api/marketing/sends/:id` | Get send job details |
| List send jobs | GET `/api/marketing/sends` | List send jobs with pagination |

**All endpoints are admin-only** (require authentication + admin role).

---

## 10. Postman Collection

The Postman collection includes all marketing template endpoints with:
- Example request bodies
- Example responses (success cases)
- Test scripts for validation

Use the collection to test template creation, preview, and sending to different audience types.
