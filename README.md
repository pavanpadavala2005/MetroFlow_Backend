# MetroFlow API Documentation

> **Project:** MetroFlow – Smart Metro Rail Management System  
> **Backend:** Node.js, Express.js, MySQL  
> **Authentication:** JWT Bearer tokens  
> **Real-time updates:** Socket.IO  
> **API prefix:** `/api`

This document describes the REST endpoints generated for MetroFlow along with request formats, response examples, authentication requirements, and Socket.IO events.

## 1. Important notes

- Examples use the local development base URL. Replace it with the deployed API URL when deploying.
- All JSON request bodies should use `Content-Type: application/json`.
- Protected REST endpoints require `Authorization: Bearer <JWT>`.
- Obtain a JWT by logging in through `POST /api/auth/login`.
- The JWT contains the user's ID and role. If an account's role is changed directly in MySQL, log in again to obtain a token containing the updated role.
- Public registration creates a `PASSENGER` account. Admin/operator roles must be assigned through a trusted administrative process.
- The train simulator uses illustrative/simulated data. It is not connected to live Hyderabad Metro telemetry.
- Fare calculation and station distances are demo values, not official Hyderabad Metro fares or surveyed distances.
- The request/response examples below illustrate the intended API contract. Dynamic IDs, dates, fare values, and fields can differ at runtime.

## 2. Authentication and authorization

### Bearer token

For protected requests, add this HTTP header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

In Postman:

1. Open the request.
2. Select **Authorization**.
3. Choose **Bearer Token**.
4. Paste the JWT returned by the login endpoint.

Do not include the word `Bearer` in the token field when using Postman's Bearer Token authorization type; Postman adds it automatically.

### Roles

| Role        | Intended access                                                                |
| ----------- | ------------------------------------------------------------------------------ |
| `PASSENGER` | Passenger profile, own tickets, own journey history, ticket booking            |
| `OPERATOR`  | Gate entry and exit scanning; operator-level train operations where authorized |
| `ADMIN`     | Admin dashboard and management operations                                      |

### Register

**POST** `/api/auth/register`  
**Authentication:** Not required

Request:

```json
{
  "fullName": "Alex Passenger",
  "email": "alex@example.com",
  "phone": "9876543210",
  "password": "StrongPassword123"
}
```

`phone` is optional if the registration controller permits it. Registration assigns the `PASSENGER` role; clients must not be able to self-select `ADMIN` or `OPERATOR`.

Example success response:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": 12,
    "fullName": "Alex Passenger",
    "email": "alex@example.com",
    "role": "PASSENGER"
  }
}
```

### Login

**POST** `/api/auth/login`  
**Authentication:** Not required

Request:

```json
{
  "email": "alex@example.com",
  "password": "StrongPassword123"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 12,
      "fullName": "Alex Passenger",
      "email": "alex@example.com",
      "role": "PASSENGER"
    },
    "token": "YOUR_JWT_TOKEN"
  }
}
```

Use the returned token in subsequent protected requests.

### Get current user

**GET** `/api/auth/me`  
**Authentication:** Required

Example response:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "fullName": "Alex Passenger",
    "email": "alex@example.com",
    "role": "PASSENGER"
  }
}
```

## 3. Admin

### Admin dashboard

**GET** `/api/admin/dashboard`  
**Authentication:** Required  
**Allowed roles:** `ADMIN`

Returns the admin dashboard summary. The exact dashboard fields depend on the current controller implementation.

## 4. Stations

Base path: `/api/stations`

| Method | Endpoint            | Authentication | Access | Description                        |
| ------ | ------------------- | -------------- | ------ | ---------------------------------- |
| GET    | `/api/stations`     | No             | Public | List stations                      |
| GET    | `/api/stations/:id` | No             | Public | Get one station                    |
| POST   | `/api/stations`     | Yes            | ADMIN  | Create a station                   |
| PUT    | `/api/stations/:id` | Yes            | ADMIN  | Update a station                   |
| DELETE | `/api/stations/:id` | Yes            | ADMIN  | Deactivate a station (soft delete) |

### List stations

**GET** `/api/stations`

Example response:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "station_code": "MYP",
      "station_name": "Miyapur",
      "is_active": 1
    },
    {
      "id": 2,
      "station_code": "JNTU",
      "station_name": "JNTU College",
      "is_active": 1
    }
  ]
}
```

### Get station by ID

**GET** `/api/stations/1`

### Create station

**POST** `/api/stations`  
**Authentication:** Bearer token  
**Allowed roles:** `ADMIN`

Example request (confirm exact accepted fields in `station.controller.js`):

```json
{
  "stationCode": "NEW",
  "stationName": "New Metro Station",
  "address": "Hyderabad, Telangana",
  "latitude": 17.45,
  "longitude": 78.38
}
```

### Update station

**PUT** `/api/stations/1`  
**Authentication:** Bearer token  
**Allowed roles:** `ADMIN`

Send the fields to update in the format expected by the station controller.

### Deactivate station

**DELETE** `/api/stations/1`  
**Authentication:** Bearer token  
**Allowed roles:** `ADMIN`

This is a soft delete using the station's active flag; it is not intended to physically remove historical station records.

## 5. Metro lines

Base path: `/api/lines`

| Method | Endpoint                  | Authentication | Access | Description                         |
| ------ | ------------------------- | -------------- | ------ | ----------------------------------- |
| GET    | `/api/lines`              | No             | Public | List metro lines                    |
| GET    | `/api/lines/:id`          | No             | Public | Get one line                        |
| GET    | `/api/lines/:id/stations` | No             | Public | List stations on a line in sequence |
| POST   | `/api/lines`              | Yes            | ADMIN  | Create a line                       |
| POST   | `/api/lines/:id/stations` | Yes            | ADMIN  | Assign a station to a line          |

### Create line

**POST** `/api/lines`

Example request (field names should be checked against `line.controller.js`):

```json
{
  "lineCode": "BLUE",
  "lineName": "Hyderabad Metro Blue Line",
  "color": "#0000FF"
}
```

### Assign station to line

**POST** `/api/lines/1/stations`

Example request:

```json
{
  "stationId": 12,
  "sequenceNumber": 12,
  "distanceFromOriginKm": 18
}
```

The sequence number determines the station order along the line. Distance values in the seed data are illustrative.

## 6. Trains

Base path: `/api/trains`

| Method | Endpoint                    | Authentication | Access           | Description                                |
| ------ | --------------------------- | -------------- | ---------------- | ------------------------------------------ |
| GET    | `/api/trains`               | No             | Public           | List trains                                |
| GET    | `/api/trains/:id`           | No             | Public           | Get one train                              |
| POST   | `/api/trains`               | Yes            | ADMIN            | Create a train and initialize its position |
| PUT    | `/api/trains/:id`           | Yes            | ADMIN            | Update train details                       |
| PATCH  | `/api/trains/:id/status`    | Yes            | ADMIN / OPERATOR | Update train status                        |
| GET    | `/api/trains/:id/schedules` | No             | Public           | Get schedules for a train                  |
| POST   | `/api/trains/:id/schedules` | Yes            | ADMIN            | Create a train schedule                    |

### Create train

**POST** `/api/trains`

Example request (verify exact field names in `train.controller.js`):

```json
{
  "trainCode": "HYD-RED-103",
  "lineId": 1,
  "capacity": 900
}
```

The generated model initializes a position for the new train using the first two active stations on its line, provided the line has at least two active stations.

### Update train status

**PATCH** `/api/trains/1/status`

Example request:

```json
{
  "status": "DELAYED"
}
```

Supported database status values:

- `RUNNING`
- `IDLE`
- `DELAYED`
- `OUT_OF_SERVICE`

### Create schedule

**POST** `/api/trains/1/schedules`

Example request (verify exact field names and accepted service-day format in `schedule.controller.js`):

```json
{
  "originStationId": 1,
  "destinationStationId": 11,
  "departureTime": "08:00:00",
  "arrivalTime": "08:30:00",
  "serviceDays": ["MON", "TUE", "WED", "THU", "FRI"]
}
```

## 7. Route discovery

**GET** `/api/routes/journey`  
**Authentication:** Not required

Query parameters:

| Parameter              | Required | Description            |
| ---------------------- | -------- | ---------------------- |
| `sourceStationId`      | Yes      | Source station ID      |
| `destinationStationId` | Yes      | Destination station ID |

Example:

```http
GET /api/routes/journey?sourceStationId=1&destinationStationId=11
```

The current generated route finder supports a direct journey on a common line. Interchange/multi-line route planning is not implemented in this version.

## 8. Real-time train tracking

Base path: `/api/tracking`

| Method | Endpoint                        | Authentication | Description                        |
| ------ | ------------------------------- | -------------- | ---------------------------------- |
| GET    | `/api/tracking/positions`       | No             | Get all train positions            |
| GET    | `/api/tracking/trains/:trainId` | No             | Get one train's position           |
| GET    | `/api/tracking/upcoming`        | No             | Find upcoming trains for a journey |

### Get all train positions

**GET** `/api/tracking/positions`

### Get one train position

**GET** `/api/tracking/trains/1`

### Get upcoming trains

**GET** `/api/tracking/upcoming?sourceStationId=1&destinationStationId=11`

Required query parameters:

- `sourceStationId`
- `destinationStationId`

The response includes the number of upcoming trains and estimated arrival information calculated by the simulator. Estimates are illustrative and depend on the configured simulation travel time.

## 9. Ticket booking and QR codes

Base path: `/api/tickets`

All ticket endpoints require a valid passenger JWT. The ticket history and ticket detail endpoints return only tickets belonging to the authenticated user.

| Method | Endpoint                        | Authentication | Description                               |
| ------ | ------------------------------- | -------------- | ----------------------------------------- |
| POST   | `/api/tickets/book`             | Yes            | Book a ticket                             |
| GET    | `/api/tickets/my`               | Yes            | List current passenger's tickets          |
| GET    | `/api/tickets/:ticketId`        | Yes            | Get one of current passenger's tickets    |
| GET    | `/api/tickets/:ticketId/qr`     | Yes            | Regenerate QR code for an eligible ticket |
| PATCH  | `/api/tickets/:ticketId/cancel` | Yes            | Cancel an eligible booked ticket          |

### Book ticket

**POST** `/api/tickets/book`

Request:

```json
{
  "sourceStationId": 1,
  "destinationStationId": 11
}
```

Example response structure:

```json
{
  "success": true,
  "message": "Ticket booked successfully",
  "data": {
    "ticket": {
      "id": 1,
      "ticket_code": "MF-EXAMPLE",
      "source_station": "Miyapur",
      "destination_station": "Ameerpet",
      "fare": 45,
      "status": "BOOKED"
    },
    "distanceKm": 16,
    "qrCode": "data:image/png;base64,..."
  }
}
```

The fare uses the demo calculation in the ticket service. The QR code is a Base64 data URL and should be rendered as an image by the client.

### List my tickets

**GET** `/api/tickets/my`

### Get one ticket

**GET** `/api/tickets/1`

### Regenerate QR code

**GET** `/api/tickets/1/qr`

The endpoint regenerates the QR image for a valid booked ticket. The QR token is not stored as plaintext in the database; the database stores its SHA-256 hash.

### Cancel ticket

**PATCH** `/api/tickets/1/cancel`

No request body is required. The generated implementation permits cancellation only while the ticket is `BOOKED` and has not expired.

## 10. Journey management and gate scanning

Base path: `/api/journeys`

| Method | Endpoint              | Authentication | Allowed roles           | Description                                     |
| ------ | --------------------- | -------------- | ----------------------- | ----------------------------------------------- |
| POST   | `/api/journeys/entry` | Yes            | ADMIN, OPERATOR         | Validate QR and start journey at source         |
| POST   | `/api/journeys/exit`  | Yes            | ADMIN, OPERATOR         | Validate QR and complete journey at destination |
| GET    | `/api/journeys/my`    | Yes            | Authenticated passenger | Get current passenger's journey history         |

### Entry gate scan

**POST** `/api/journeys/entry`

Request:

```json
{
  "ticketId": 1,
  "stationId": 1,
  "token": "64_CHARACTER_QR_TOKEN"
}
```

The `token` must be extracted from the actual QR payload. Do not generate or guess it manually.

Example success response:

```json
{
  "success": true,
  "data": {
    "journeyId": 1,
    "ticketId": 1,
    "ticketCode": "MF-EXAMPLE",
    "entryStationId": 1,
    "status": "IN_PROGRESS",
    "message": "Entry successful. Journey started."
  }
}
```

Validation includes ticket existence, QR token, ticket status, expiry, and matching source station.

### Exit gate scan

**POST** `/api/journeys/exit`

Request:

```json
{
  "ticketId": 1,
  "stationId": 11,
  "token": "64_CHARACTER_QR_TOKEN"
}
```

The same QR token is used. The exit station must match the ticket's booked destination.

Example success response:

```json
{
  "success": true,
  "data": {
    "journeyId": 1,
    "ticketId": 1,
    "ticketCode": "MF-EXAMPLE",
    "entryStationId": 1,
    "exitStationId": 11,
    "status": "COMPLETED",
    "message": "Exit successful. Journey completed."
  }
}
```

### Passenger journey history

**GET** `/api/journeys/my`

Returns journey records for the authenticated passenger.

## 11. Socket.IO real-time events

Socket.IO is not a REST endpoint. Connect to the backend origin:

```text
http://localhost:5000
```

The Socket.IO server uses the configured `CLIENT_URL` for CORS.

### Server events

| Event                    | Direction       | Description                                |
| ------------------------ | --------------- | ------------------------------------------ |
| `socket:ready`           | Server → client | Sent after a client connects               |
| `station:subscribed`     | Server → client | A station room subscription was accepted   |
| `train:position_updated` | Server → client | A train position update was emitted        |
| `socket:error`           | Server → client | Invalid subscription input or socket error |

### Client events

| Event                 | Direction       | Payload              |
| --------------------- | --------------- | -------------------- |
| `station:subscribe`   | Client → server | `{ "stationId": 1 }` |
| `station:unsubscribe` | Client → server | `{ "stationId": 1 }` |
| `line:subscribe`      | Client → server | `{ "lineId": 1 }`    |
| `line:unsubscribe`    | Client → server | `{ "lineId": 1 }`    |

Example client-side usage:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("socket:ready", (data) => {
  console.log("Connected:", data);
});

socket.emit("station:subscribe", { stationId: 1 });

socket.on("station:subscribed", (data) => {
  console.log("Subscribed:", data);
});

socket.on("train:position_updated", (data) => {
  console.log("Train position updated:", data);
});
```

The generated simulator emits updates to station and line rooms when a train reaches its next station. Avoid subscribing to both a station room and its line room in the same view unless the client deduplicates events, because it may receive the same update through both subscriptions.

## 12. Common HTTP status codes

| Status                      | Meaning                                             |
| --------------------------- | --------------------------------------------------- |
| `200 OK`                    | Request completed successfully                      |
| `201 Created`               | Resource created successfully                       |
| `400 Bad Request`           | Invalid input or business-rule validation failed    |
| `401 Unauthorized`          | Missing, invalid, or expired JWT / invalid QR token |
| `403 Forbidden`             | Authenticated user does not have the required role  |
| `404 Not Found`             | Requested resource does not exist                   |
| `409 Conflict`              | Resource conflict, where implemented                |
| `500 Internal Server Error` | Unexpected server error                             |

The exact status code and error response depend on the controller and global error handler for each endpoint.

## 13. Suggested Postman environment

Create a Postman environment with these variables:

| Variable               | Example                          |
| ---------------------- | -------------------------------- |
| `baseUrl`              | `http://localhost:5000`          |
| `passengerToken`       | JWT returned by passenger login  |
| `operatorToken`        | JWT returned by operator login   |
| `adminToken`           | JWT returned by admin login      |
| `ticketId`             | ID returned by booking           |
| `qrToken`              | Token decoded from the ticket QR |
| `sourceStationId`      | `1`                              |
| `destinationStationId` | `11`                             |

Example URL using a variable:

```text
{{baseUrl}}/api/tickets/my
```

## 14. Endpoint inventory

| Area                 | Endpoints |
| -------------------- | --------: |
| Authentication       |         3 |
| Admin                |         1 |
| Stations             |         5 |
| Metro lines          |         5 |
| Trains and schedules |         7 |
| Route discovery      |         1 |
| Train tracking       |         3 |
| Ticketing            |         5 |
| Journey management   |         3 |
| **REST total**       |    **33** |

Socket.IO events are documented separately and are not included in the REST total.

## 15. Before publishing this documentation

1. Start the backend and verify `/api/health`.
2. Test each endpoint in Postman using the actual current controller field names.
3. Confirm role restrictions using passenger, operator, and admin tokens.
4. Test ticket booking, QR regeneration, entry scan, and exit scan as one complete flow.
5. Update this document whenever a route, request field, response field, or authorization rule changes.
6. Never commit `.env`, JWT secrets, database passwords, or real QR tokens to GitHub.

---

Maintained alongside the MetroFlow backend source code.
