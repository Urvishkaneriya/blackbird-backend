# Blackbird Tattoo - Backend API

A complete authentication and employee management system built with Node.js, Express, and MongoDB.

## Features

- ✅ **Modular Architecture** - Clean separation of concerns (routes, controllers, services, models)
- ✅ **JWT Authentication** - Secure token-based authentication with auto-refresh
- ✅ **Role-Based Access Control** - Admin and Employee roles
- ✅ **Auto Admin Seeding** - Admin automatically created from environment variables on startup
- ✅ **Password Hashing** - Secure password storage with bcrypt
- ✅ **Standard API Responses** - Consistent response structure across all endpoints
- ✅ **Error Handling** - Global error handling middleware
- ✅ **Database Validation** - Mongoose schema validation
- ✅ **Health Check API** - Monitor server and database status

## Project Structure

```
backend/
├── server.js                          # Main entry point
├── package.json
├── .env                              # Environment variables
│
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   └── constants.js             # Application constants
│   │
│   ├── models/
│   │   ├── admin.model.js           # Admin schema
│   │   └── employee.model.js        # Employee schema
│   │
│   ├── services/
│   │   ├── admin.service.js         # Admin database operations
│   │   ├── employee.service.js      # Employee database operations
│   │   └── auth.service.js          # Authentication logic
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # Auth endpoints controller
│   │   └── employee.controller.js   # Employee CRUD controllers
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── admin.middleware.js      # Admin authorization
│   │   └── error.middleware.js      # Error handling
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # Auth routes
│   │   └── employee.routes.js       # Employee routes
│   │
│   ├── utils/
│   │   ├── response.js              # Response formatters
│   │   ├── jwt.js                   # JWT utilities
│   │   └── passwordHash.js          # Password hashing utilities
│   │
│   └── scripts/
│       └── seedAdmin.js             # Auto-create admin on startup
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/blackbird

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Credentials (auto-created on startup)
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@blackbird.com
ADMIN_PASSWORD=admin123456

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod
```

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The admin user will be automatically created from your `.env` credentials on first startup.

## API Documentation

### Response Format

All API responses follow this structure:

```json
{
  "message": "Success/Error message",
  "data": {
    // Response data
  }
}
```

### Authentication

#### Login (Admin/Employee)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@blackbird.com",
  "password": "admin123456"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Admin User",
      "email": "admin@blackbird.com",
      "role": "admin"
    }
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Employee Management (Admin Only)

All employee routes require admin authentication.

#### Create Employee
```http
POST /api/employees
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "Employee created successfully",
  "data": {
    "uniqueId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "employeeNumber": "EMP0001",
    "role": "employee",
    "createdAt": "2026-01-19T10:30:00.000Z",
    "updatedAt": "2026-01-19T10:30:00.000Z"
  }
}
```

#### Get All Employees
```http
GET /api/employees
Authorization: Bearer <admin-token>
```

#### Get Employee by ID
```http
GET /api/employees/:id
Authorization: Bearer <admin-token>
```

#### Update Employee
```http
PUT /api/employees/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "phoneNumber": "9876543210"
}
```

#### Delete Employee
```http
DELETE /api/employees/:id
Authorization: Bearer <admin-token>
```

#### Search Employees
```http
GET /api/employees/search?q=john
Authorization: Bearer <admin-token>
```

### Health Check
```http
GET /health
```

**Success Response (200):**
```json
{
  "message": "Server is healthy",
  "data": {
    "database": {
      "status": "connected",
      "name": "blackbird",
      "host": "localhost"
    },
    "server": {
      "uptime": 123.456,
      "environment": "development",
      "timestamp": "2026-01-19T10:30:00.000Z"
    }
  }
}
```

## JWT Token Auto-Refresh

The system automatically refreshes JWT tokens when they have less than 25 hours remaining:

- Tokens are valid for **50 hours**
- When less than **25 hours** remain, a new token is generated
- The new token is sent in the `X-New-Token` response header
- Frontend should check for this header and update the stored token

**Example:**
```javascript
// After making an authenticated request
const newToken = response.headers.get('X-New-Token');
if (newToken) {
  // Update your stored token
  localStorage.setItem('token', newToken);
}
```

## Database Models

### Admin
- `name` - String (required)
- `email` - String (required, unique, lowercase)
- `password` - String (required, hashed)
- `role` - String (default: "admin", immutable)
- `createdAt` - Date (auto)
- `updatedAt` - Date (auto)

### Employee
- `uniqueId` - UUID (auto-generated, immutable)
- `fullName` - String (required)
- `email` - String (required, unique, lowercase)
- `phoneNumber` - String (required, 10-15 digits)
- `employeeNumber` - String (auto-generated, e.g., "EMP0001")
- `password` - String (required, hashed)
- `role` - String (default: "employee", immutable)
- `createdAt` - Date (auto)
- `updatedAt` - Date (auto)

## Security Features

- 🔒 **Password Hashing** - Bcrypt with 10 salt rounds
- 🔑 **JWT Authentication** - Secure token-based auth
- 👤 **Role-Based Access** - Admin and employee roles
- ✅ **Email Validation** - Regex pattern validation
- 🔄 **Auto Token Refresh** - Seamless token renewal
- 🚫 **Immutable Fields** - Protected fields (role, employeeNumber, uniqueId)

## Error Handling

The API handles errors gracefully with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email/data)
- `500` - Internal Server Error

**Example Error Response:**
```json
{
  "message": "Email already exists",
  "data": null
}
```

## Testing the API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blackbird.com","password":"admin123456"}'
```

**Create Employee:**
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"fullName":"John Doe","email":"john@example.com","phoneNumber":"1234567890","password":"password123"}'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for token
3. Test each endpoint with appropriate payloads

## License

ISC
