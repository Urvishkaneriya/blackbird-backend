# Postman Collection for Blackbird Tattoo API

Complete Postman collection with environment variables and automatic token management.

## 📦 Files

1. **blackbird-tattoo.postman_collection.json** - API collection with all endpoints
2. **blackbird-tattoo.postman_environment.json** - Environment variables (local setup)
3. **README.md** - This file

## 🚀 Quick Start

### 1. Import Collection

In Postman:
1. Click **Import** button
2. Drag and drop `blackbird-tattoo.postman_collection.json`
3. Collection will appear in your workspace

### 2. Import Environment

1. Click **Import** button again
2. Drag and drop `blackbird-tattoo.postman_environment.json`
3. Select **Blackbird Tattoo - Local** from environment dropdown (top right)

### 3. Test the API

Run requests in this order:

1. **Health Check** - Verify server is running
2. **Login - Admin** - Get admin token (auto-saved)
3. **Create Employee** - Create a test employee
4. **Get All Employees** - List all employees
5. **Update Employee** - Update the employee
6. **Delete Employee** - Delete the employee

## ✨ Features

### Auto Token Management

- **Login saves token automatically** - No manual copy/paste needed
- **Token applied to all requests** - Uses `{{token}}` variable
- **Auto-refresh detection** - Picks up `X-New-Token` header automatically
- **Separate tokens** - Admin token and employee token stored separately

### Pre-Request Scripts

- Server health check before requests
- Environment variable validation

### Test Scripts

Each request includes tests that:
- ✅ Verify status codes
- ✅ Validate response structure
- ✅ Auto-save important IDs (employee IDs, tokens)
- ✅ Log success messages to console

### Environment Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | No |
| `token` | Current auth token | Yes (on login) |
| `adminEmail` | Admin email | No |
| `adminPassword` | Admin password | No |
| `adminId` | Admin user ID | Yes (on login) |
| `employeeToken` | Employee token | Yes (on employee login) |
| `employeeId` | Employee user ID | Yes |
| `lastCreatedEmployeeId` | Last created employee ID | Yes (on create) |

## 📋 API Endpoints Included

### Public
- `GET /health` - Health check

### Authentication
- `POST /api/auth/login` - Login (admin/employee)
- `GET /api/auth/me` - Get current user

### Employee Management (Admin Only)
- `POST /api/employees` - Create employee
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/search?q=term` - Search employees

## 🔧 Configuration

### Change Base URL

Edit environment variable:
```
baseUrl: http://localhost:5000
```

For production:
```
baseUrl: https://api.yourproduction.com
```

### Change Admin Credentials

Edit environment variables:
```
adminEmail: your-admin@email.com
adminPassword: your-password
```

## 🧪 Testing Workflow

### Complete Test Run

1. **Health Check**
   - Ensures server is running
   - No auth required

2. **Login as Admin**
   - Uses `{{adminEmail}}` and `{{adminPassword}}`
   - Saves token to `{{token}}`
   - All subsequent requests use this token

3. **Create Employee**
   - Creates test employee
   - Saves employee ID to `{{lastCreatedEmployeeId}}`

4. **Get All Employees**
   - Lists all employees
   - Shows count

5. **Get Employee by ID**
   - Uses `{{lastCreatedEmployeeId}}`
   - Shows full employee details

6. **Update Employee**
   - Updates the test employee
   - Changes name and phone

7. **Search Employees**
   - Search by "john"
   - Tests search functionality

8. **Login as Employee** (optional)
   - Login with employee credentials
   - Saves to `{{employeeToken}}`

9. **Delete Employee**
   - Removes test employee
   - Cleanup

### Run All Tests

Postman Runner:
1. Click collection name
2. Click **Run** button
3. Select all requests
4. Click **Run Blackbird Tattoo API**
5. Watch all tests execute automatically

## 💡 Tips

### View Console Logs

Open Postman Console (View → Show Postman Console) to see:
- Token saved messages
- Employee IDs
- Test results

### Token Auto-Refresh

The collection automatically detects and saves refreshed tokens from the `X-New-Token` header. No action needed!

### Manual Token Override

If needed, you can manually set the token in environment:
```
token: your-jwt-token-here
```

### Testing Error Cases

Try these scenarios:
- Login with wrong password
- Create employee with duplicate email
- Update non-existent employee
- Access employee endpoints without token

## 🔒 Security Notes

- Never commit environment file with real tokens to version control
- Use separate environments for dev/staging/production
- Tokens are stored as "secret" type in Postman
- Change default admin credentials in production

## 🆘 Troubleshooting

### Token not working
- Check if server is running
- Re-login to get fresh token
- Verify environment is selected (top right)

### Variables not found
- Ensure environment is selected
- Check variable names match (case-sensitive)
- Re-import environment file

### Tests failing
- Check server is running (`GET /health`)
- Verify MongoDB is connected
- Check console for error details

## 📞 Support

For issues or questions about the API, refer to the main README.md in the project root.

Happy Testing! 🚀
