# FoodExpress Food Ordering Application

A full-stack food ordering web application built with **React** (frontend) and **Spring Boot** (backend), featuring JWT authentication, role-based access control, real-time order tracking, and a complete restaurant management dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running with Docker](#running-with-docker)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)

---

## Features

### Customer

- Browse and search restaurants by name, cuisine, or location
- View menus with Today's Specials and Most Popular items
- Add items to cart and place orders
- Real-time order tracking (Pending → Preparing → Ready → Completed)
- Order history with search and reorder
- Save cuisine preferences and dietary restrictions

### Restaurant Owner

- Register and manage restaurant details
- Full CRUD on menu items
- Mark items as "Today's Special" or "Deal of the Day"
- Auto-detected "Mostly Ordered" items (by order count)
- Dashboard with revenue, pending orders, and popular items
- Update order status in real time

### System

- JWT authentication with role-based access control
- Swagger UI API documentation at `/swagger-ui.html`
- Dockerised frontend and backend
- Azure-ready deployment configuration
- 15 unit/integration tests

---

## Tech Stack

| Layer     | Technology                                          |
| --------- | --------------------------------------------------- |
| Frontend  | React 18, React Router v6, Axios, React Hot Toast   |
| Backend   | Spring Boot 3.2, Spring Security, Spring Data JPA   |
| Database  | MySQL 8                                             |
| Auth      | JWT (jjwt 0.12)                                     |
| API Docs  | SpringDoc OpenAPI 3 / Swagger UI                    |
| Container | Docker, Docker Compose                              |
| Cloud     | Microsoft Azure (App Service + Container Instances) |

---

## Project Structure

```
foodexpress/
├── frontend/                  # React application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Navbar, ProtectedRoute
│   │   ├── context/           # AuthContext, CartContext
│   │   ├── pages/             # LoginPage, BrowsePage, MenuPage,
│   │   │                      # CartPage, OrderPages, PreferencesPage,
│   │   │                      # OwnerDashboard
│   │   ├── services/          # Axios API service layer
│   │   └── App.js             # Router + provider tree
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                   # Spring Boot application
│   ├── src/main/java/com/foodexpress/
│   │   ├── controller/        # AuthController, RestaurantController,
│   │   │                      # OrderController, CustomerController
│   │   ├── model/             # User, Restaurant, MenuItem, Order, OrderItem
│   │   ├── repository/        # JPA repositories
│   │   ├── security/          # JwtUtils, JwtAuthFilter
│   │   └── config/            # SecurityConfig, OpenApiConfig, DataSeeder
│   ├── src/test/              # 15 integration tests
│   ├── Dockerfile
│   └── pom.xml
│
├── docker-compose.yml
├── README.md
└── AI_USAGE.md
```

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.9+
- Docker (optional)

### 1. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8083`

- Swagger UI: `http://localhost:8083/swagger-ui.html`

> Requires a running MySQL 8 instance with database `foodapp`, user `capstone` / password `casptone123` (configured in `application.properties`). With Docker Compose, MySQL is started automatically.

### Configuring email (password reset)

Forgot-password codes are sent by real SMTP email rather than returned by the API. Set these environment variables before starting the backend (a `.env` file works with Docker Compose):

```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=your-app-password   # use an app password, not your normal login password
MAIL_FROM=no-reply@foodexpress.local
```

If these aren't set, `/api/auth/forgot-password` will return a 502 ("couldn't send the reset email") whenever a real account requests a reset — the app is otherwise fully functional without email configured.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000` (Vite dev server, with API calls proxied to the backend).

---

## Running with Docker

```bash
# Build and run everything
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

To stop:

```bash
docker-compose down
```

---

## API Documentation

Full interactive Swagger UI available at:

```
http://localhost:8080/swagger-ui.html
```

### Key Endpoints

| Method | Endpoint                              | Role     | Description             |
| ------ | ------------------------------------- | -------- | ----------------------- |
| POST   | `/api/auth/register`                  | Public   | Register new user       |
| POST   | `/api/auth/login`                     | Public   | Login, receive JWT      |
| GET    | `/api/restaurants`                    | All      | List/search restaurants |
| GET    | `/api/restaurants/{id}/menu`          | All      | Get menu                |
| POST   | `/api/restaurants`                    | OWNER    | Create restaurant       |
| POST   | `/api/restaurants/{id}/menu`          | OWNER    | Add menu item           |
| PUT    | `/api/restaurants/{id}/menu/{itemId}` | OWNER    | Update menu item        |
| DELETE | `/api/restaurants/{id}/menu/{itemId}` | OWNER    | Delete menu item        |
| POST   | `/api/orders`                         | CUSTOMER | Place order             |
| GET    | `/api/orders/my`                      | CUSTOMER | Order history           |
| GET    | `/api/orders/{id}`                    | All      | Order details           |
| GET    | `/api/orders/restaurant/{id}`         | OWNER    | Restaurant's orders     |
| PUT    | `/api/orders/{id}/status`             | OWNER    | Update order status     |
| GET    | `/api/customers/preferences`          | CUSTOMER | Get preferences         |
| PUT    | `/api/customers/preferences`          | CUSTOMER | Save preferences        |

All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## Running Tests

```bash
cd backend
mvn test
```

The test suite includes ** tests** covering:

- User registration and login
- Invalid credential rejection
- Role-based access control (customer vs owner)
- Restaurant CRUD operations
- Menu item management
- Order placement and status updates
- Customer preferences
- Unauthenticated request rejection
- MenuItem order count and "mostly ordered" auto-flagging

---
