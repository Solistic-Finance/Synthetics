# Synthetics Backend API

This is the backend API for the Synthetics Protocol, providing market data and blockchain interactions.

## API Endpoints

### Market Data

#### Get Latest Price

```
GET /market/price/:symbol
```

Returns the latest price for a synthetic asset, e.g., sTSLA.

**Example Response:**
```json
{
  "id": 1,
  "symbol": "sTSLA",
  "price": 750.25,
  "timestamp": "2025-05-14T10:30:00.000Z"
}
```

#### Get Price History

```
GET /market/price/:symbol/history?from=2025-05-01&to=2025-05-14
```

Returns the price history for a symbol within a date range.

**Query Parameters:**
- `from`: Start date (ISO format), defaults to 30 days ago
- `to`: End date (ISO format), defaults to current time

### Collateral Data

#### Get User Collateral Ratio

```
GET /market/collateral/:address
```

Returns the latest collateral ratio for a user.

**Example Response:**
```json
{
  "id": 1,
  "symbolPair": "SOL/sTSLA",
  "ratio": 2.5,
  "userAddress": "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "collateralAmount": 15.0,
  "syntheticAmount": 6.0,
  "timestamp": "2025-05-14T10:30:00.000Z"
}
```

#### Get Collateral Ratio History

```
GET /market/collateral/:address/history?from=2025-05-01&to=2025-05-14
```

Returns the collateral ratio history for a user.

**Query Parameters:**
- `from`: Start date (ISO format), defaults to 30 days ago
- `to`: End date (ISO format), defaults to current time

## Data Caching

The API uses Redis caching to optimize performance. Cache duration is configurable through the REDIS_TTL environment variable.

## Database

PostgreSQL is used to store historical price and collateral ratio data, enabling time-series analytics. 