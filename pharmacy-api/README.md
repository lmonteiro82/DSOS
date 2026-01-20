# Pharmacy REST API

REST API for pharmacy integration with the Rodas&Bengalas nursing home management system.

## 🚀 Features

- **Order Management**: Create single or batch orders, track status, and cancel orders
- **Order Status Tracking**: SENT_TO_PHARMACY → PROCESSING → SENT_TO_NURSING_HOME → RECEIVED (or CANCELLED)
- **History Queries**: View order history by patient, nursing home, or medication with date range filtering
- **Invoice Generation**: Generate detailed invoices with tax calculations (23% IVA)
- **Authentication**: API key-based authentication for secure access
- **Data Protection**: Input validation, SQL injection prevention, and security headers

## 📋 Requirements

- Node.js 14+ 
- MySQL 5.7+ or MariaDB 10.3+
- phpMyAdmin (opcional, para interface gráfica)
- npm or yarn

## ⚙️ Installation

1. **Clone or navigate to the project directory**
```bash
cd pharmacy-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=pharmacy_db
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3001
```

4. **Create MySQL database**

Opção 1 - Usando phpMyAdmin:
- Acesse phpMyAdmin (geralmente http://localhost/phpmyadmin)
- Clique em "New" ou "Novo"
- Nome da base de dados: `pharmacy_db`
- Collation: `utf8mb4_unicode_ci`
- Clique em "Create" ou "Criar"

Opção 2 - Usando linha de comando:
```bash
mysql -u root -p
CREATE DATABASE pharmacy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

5. **Initialize database with sample data**
```bash
npm run init-db
```

This will create all tables and populate them with sample nursing homes, patients, and medications. **Important**: Save the API keys displayed - you'll need them for authentication.

## 🏃 Running the API

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The API will be available at `http://localhost:3000/api`

## 📚 API Endpoints

### Order Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create single order | API Key |
| POST | `/api/orders/batch` | Create multiple orders | API Key |
| GET | `/api/orders/:orderId` | Get order status | API Key |
| PUT | `/api/orders/:orderId/cancel` | Cancel order* | API Key |
| PUT | `/api/orders/:orderId/status` | Update order status | API Key |

*Only orders with status `SENT_TO_PHARMACY` can be cancelled

### History Queries

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/history/patient/:patientId` | Patient order history | API Key |
| GET | `/api/history/nursing-home/:nursingHomeId` | Nursing home order history | API Key |
| GET | `/api/history/medication/:medicationId` | Medication order history | API Key |

Query parameters: `?startDate=2024-01-01&endDate=2024-12-31` (optional)

### Invoices

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/invoices/:orderId` | Get order invoice | API Key |
| GET | `/api/invoices/nursing-home/:nursingHomeId` | Get nursing home invoices | API Key |

## 🔐 Authentication

Include your API key in the request header:

```bash
x-api-key: YOUR_API_KEY_HERE
```

Example using curl:
```bash
curl -H "x-api-key: NH001-abc123..." http://localhost:3000/api/orders/1
```

## 📝 Example Requests

### Create Single Order

```bash
POST /api/orders
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "nursingHomeId": 1,
  "patientId": 1,
  "items": [
    {
      "medicationId": 1,
      "quantity": 2
    },
    {
      "medicationId": 3,
      "quantity": 1
    }
  ]
}
```

### Create Batch Orders

```bash
POST /api/orders/batch
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "orders": [
    {
      "nursingHomeId": 1,
      "patientId": 1,
      "items": [{"medicationId": 1, "quantity": 2}]
    },
    {
      "nursingHomeId": 1,
      "patientId": 2,
      "items": [{"medicationId": 2, "quantity": 1}]
    }
  ]
}
```

### Get Order Status

```bash
GET /api/orders/1
x-api-key: YOUR_API_KEY
```

### Cancel Order

```bash
PUT /api/orders/1/cancel
x-api-key: YOUR_API_KEY
```

### Get Patient History

```bash
GET /api/history/patient/1?startDate=2024-01-01&endDate=2024-12-31
x-api-key: YOUR_API_KEY
```

## 🏗️ Project Structure

```
pharmacy-api/
├── src/
│   ├── config/
│   │   ├── database.js       # Database connection
│   │   └── auth.js           # JWT configuration
│   ├── models/
│   │   ├── NursingHome.js    # Nursing home model
│   │   ├── Patient.js        # Patient model
│   │   ├── Medication.js     # Medication model
│   │   ├── Order.js          # Order model
│   │   ├── OrderItem.js      # Order items model
│   │   └── index.js          # Model relationships
│   ├── controllers/
│   │   ├── orderController.js    # Order business logic
│   │   ├── historyController.js  # History queries
│   │   └── invoiceController.js  # Invoice generation
│   ├── routes/
│   │   ├── orders.js         # Order endpoints
│   │   ├── history.js        # History endpoints
│   │   └── invoices.js       # Invoice endpoints
│   ├── middleware/
│   │   ├── auth.js           # Authentication
│   │   ├── validation.js     # Request validation
│   │   └── errorHandler.js   # Error handling
│   ├── validators/
│   │   └── orderValidators.js # Input validators
│   ├── app.js                # Main application
│   └── init-db.js            # Database initialization
├── .env                      # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔄 Order Status Flow

```
SENT_TO_PHARMACY → PROCESSING → SENT_TO_NURSING_HOME → RECEIVED
       ↓
   CANCELLED (only from SENT_TO_PHARMACY)
```

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Express-validator for request validation
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries
- **API Key Authentication**: Secure service-to-service communication
- **Request Size Limits**: Protection against large payload attacks

## 📊 Database Schema

- **nursing_homes**: Nursing home information and API keys
- **patients**: Patient records linked to nursing homes
- **medications**: Medication catalog with pricing
- **orders**: Order records with status tracking
- **order_items**: Individual line items for each order

## 🧪 Testing

Check API health:
```bash
curl http://localhost:3000/health
```

View API documentation:
```bash
curl http://localhost:3000/api
```

## 📄 License

ISC
