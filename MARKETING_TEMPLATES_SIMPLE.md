# Marketing Templates - Simple Explanation

## What It Does

You create **reusable WhatsApp message templates** with placeholders (like `{{1}}`, `{{2}}`). When sending, you can either **type values** OR **select from dropdown** to automatically get values from database (like customer name, branch name).

---

## Step-by-Step Flow

### Step 1: Create a Template (One Time)

**What:** Define a template with placeholders. No need to mark which are static/dynamic - that's decided when sending!

**Example Template:**
- Template name: `WELCOME_DISCOUNT`
- WhatsApp template name: `blackbird_welcome_discount` (must match Meta)
- Message: `"Hello {{1}}, enjoy {{2}}% discount until {{3}}!"`

**Parameters:**
```json
[
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
]
```

**API:** `POST /api/marketing/templates`

---

### Step 2: Get Available Dynamic Fields (For Frontend Dropdown)

**API:** `GET /api/marketing/dynamic-fields`

**Response:**
```json
{
  "message": "Dynamic fields fetched successfully",
  "data": {
    "fields": [
      { "value": "user_fullName", "label": "user fullName" },
      { "value": "user_phone", "label": "user phone" },
      { "value": "user_email", "label": "user email" },
      { "value": "branch_name", "label": "branch name" },
      { "value": "branch_number", "label": "branch number" }
    ]
  }
}
```

**Use this in your frontend** to show a dropdown of available options!

---

### Step 3: Send Messages Using the Template

**What:** Pick template, for each parameter either **type a value** OR **select from dropdown** (enum).

**Example Send:**
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
    "name": "user_fullName",      // ← Selected from dropdown (enum)
    "percent": 20,                 // ← Typed value
    "days": 30                     // ← Typed value
  }
}
```

**What Happens:**
1. System finds customers at branch `678b001` (in date range)
2. For each customer (e.g., John):
   - Checks `name` parameter: value is `"user_fullName"` (enum) → gets `user.fullName` from database → `"John"`
   - Uses typed values: `percent: 20`, `days: 30`
   - Builds: `["John", "20", "30"]`
   - Sends: `"Hello John, enjoy 20% discount until 30!"`
3. Returns stats: `{ total: 25, success: 23, failed: 2 }`

**API:** `POST /api/marketing/templates/:id/send`

---

## How Parameters Work

### Option 1: Type a Value (Static)
```json
{
  "parameters": {
    "percent": 20,
    "days": 30
  }
}
```
→ Uses the value as-is: `20`, `30`

### Option 2: Select from Dropdown (Dynamic from Database)
```json
{
  "parameters": {
    "name": "user_fullName"    // ← Enum value
  }
}
```
→ System resolves: `"user_fullName"` → gets `user.fullName` from database → `"John"`

---

## Available Dynamic Fields (Enum)

| Enum Value | What It Gets |
|------------|--------------|
| `user_fullName` | Customer's full name |
| `user_phone` | Customer's phone number |
| `user_email` | Customer's email |
| `branch_name` | Branch name |
| `branch_number` | Branch number |

**Get the list:** `GET /api/marketing/dynamic-fields`

---

## Audience Types (Who to Send To)

### 1. Single Phone
```json
{
  "audience": {
    "type": "single",
    "phone": "9876543210"
  }
}
```
→ Sends to **one person**

---

### 2. List of Phones
```json
{
  "audience": {
    "type": "list",
    "phones": ["9876543210", "9123456789"]
  }
}
```
→ Sends to **multiple people** (same message for all)

---

### 3. Branch Customers (with Date Filter)
```json
{
  "audience": {
    "type": "branch_customers",
    "branchId": "678b001",
    "dateFilter": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
  }
}
```
→ Finds customers with bookings at that branch (optionally in date range)
→ Sends to each customer
→ **Automatically resolves enum values** (like `user_fullName`) from each customer's data

---

### 4. All Customers (with Date Filter)
```json
{
  "audience": {
    "type": "all_customers",
    "dateFilter": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-31"
    }
  }
}
```
→ Finds all customers (optionally filtered by booking date)
→ Sends to each customer
→ **Automatically resolves enum values** from each customer's data

---

## Complete Example

### 1. Create Template
```json
POST /api/marketing/templates
{
  "name": "WELCOME_DISCOUNT",
  "displayName": "Welcome Discount",
  "whatsappTemplateName": "blackbird_welcome_discount",
  "bodyExample": "Hello {{1}}, enjoy {{2}}% discount until {{3}}!",
  "parameters": [
    {
      "key": "name",
      "position": 1,
      "type": "string",
      "required": true
    },
    {
      "key": "percent",
      "position": 2,
      "type": "number",
      "required": true
    },
    {
      "key": "days",
      "position": 3,
      "type": "number",
      "required": true
    }
  ]
}
```

### 2. Send to Branch Customers
```json
POST /api/marketing/templates/tpl_abc123/send
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
    "name": "user_fullName",    // ← Dropdown selection
    "percent": 15,               // ← Typed value
    "days": 30                   // ← Typed value
  }
}
```

**What Happens:**
- Finds 25 customers at branch `678b001` in Jan 2026
- For customer "John":
  - Resolves `"user_fullName"` → gets `"John"` from database
  - Uses typed values: `percent: 15`, `days: 30`
  - Sends: `"Hello John, enjoy 15% discount until 30!"`
- For customer "Jane":
  - Resolves `"user_fullName"` → gets `"Jane"` from database
  - Uses same typed values: `percent: 15`, `days: 30`
  - Sends: `"Hello Jane, enjoy 15% discount until 30!"`
- Returns: `{ total: 25, success: 23, failed: 2 }`

---

## APIs Summary

| What | API | When |
|------|-----|------|
| Get dynamic fields | `GET /api/marketing/dynamic-fields` | Get enum options for dropdown |
| Create template | `POST /api/marketing/templates` | One time setup |
| List templates | `GET /api/marketing/templates` | See all templates |
| Preview | `POST /api/marketing/templates/:id/preview` | Test before sending |
| Send | `POST /api/marketing/templates/:id/send` | Send to audience |
| Check send status | `GET /api/marketing/sends/:id` | See results |

---

## Key Points

1. **Template creation is simple** - Just define parameters, no need to mark static/user

2. **When sending** - For each parameter:
   - **Type a value** → Use as-is
   - **OR select from dropdown** (enum like `user_fullName`) → System gets from database

3. **Frontend integration** - Call `GET /api/marketing/dynamic-fields` to get dropdown options

4. **Simple for admins** - They see dropdown with options like "User Full Name", "Branch Name" etc. - no technical syntax!

---

## That's It!

1. **Create** template (simple - just parameters)
2. **Get enum options** for frontend dropdown
3. **Send** - type values OR select from dropdown
4. **Track** results via send job

Simple! 🎯
