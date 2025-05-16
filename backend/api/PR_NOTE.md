# PR: Add sTSLA Redemption APIs and Platform Price Endpoint

## Summary
This PR introduces new backend features for sTSLA redemption, redemption history tracking, and exposes the current platform sTSLA price.

## Key Changes
- **RedemptionHistory Entity**: Persists sTSLA redemption events.
- **RedemptionService**: Handles sTSLA redemption logic and user redemption history retrieval.
- **RedemptionController**: Provides endpoints to:
  - Redeem sTSLA (`POST /redemption`)
  - Fetch a user's redemption history (`GET /redemption/:userAddress/history`)
- **MarketModule Registration**: Registers the new entity, service, and controller.
- **Indexing**: Adds an index on `userAddress` for efficient redemption history queries.
- **PriceService Extension**: Adds a method to fetch the current platform sTSLA price.
- **MarketController Endpoint**: Adds `GET /market/price/sTSLA/current` to fetch the current sTSLA price.

## Note
Blockchain interaction for actual sTSLA burning is stubbed and should be implemented in the service. 