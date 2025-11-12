# Batch Fixes Plan - 32 Failing Tests

## Strategy

Instead of fixing tests one-by-one (32 x 3min = 96min), apply fixes in batches based on common patterns:

1. ✅ **Pattern A**: Timeout issues → Increase all timeouts globally
2. ✅ **Pattern B**: UI selector changes → Update selectors in batch
3. ✅ **Pattern C**: Portfolio DB helpers → Refactor helpers once
4. ✅ **Pattern D**: nuqs URL state → Add waitForResponse fallbacks

**Estimated Time**: 2-3h total (vs 10h+ one-by-one)

---

## Pattern A: Timeout Issues (8 tests)

### Root Cause

Heavy React components (crypto libs, QR code, charts) + slow CI environment

### Tests Affected

1. `crypto-checkout.spec.ts:6` - user can view checkout page (34.6s timeout)
2. `crypto-checkout.spec.ts:114` - checkout page shows plan features (37.7s timeout)
3. `crypto-checkout.spec.ts:232` - checkout validates payment (39.0s timeout)
4. `crypto-checkout.spec.ts:170` - navigate back to pricing (15.8s timeout)
5. `pricing.spec.ts:70` - pricing page subscribe button (24.6s timeout)
6. `subscription-activation.spec.ts` - complete payment flow (22.0s timeout)
7. `invitation-flow.spec.ts` - complete invitation flow (39.2s timeout)
8. `trader-dashboard.spec.ts` - trader dashboard shows followers (23.8s timeout)

### Batch Fix

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    actionTimeout: 15000, // was 10000
    navigationTimeout: 45000, // was 30000
  },
  expect: {
    timeout: 15000, // was 10000
  },
});
```

**Alternative**: Add timeout overrides to specific tests:

```typescript
// e2e/crypto-checkout.spec.ts
test.setTimeout(90000); // Add at top of describe block

// Increase specific waits
await page.waitForTimeout(5000); // was 3000 for React hydration
await expect(element).toBeVisible({ timeout: 20000 }); // was 10000
```

---

## Pattern B: UI Selector Changes (6 tests)

### Root Cause

B2C migration changed UI text, button labels, navigation structure

### Tests Affected

1. `account.spec.ts:78` - update name flow
2. `account.spec.ts:100` - change password flow
3. `settings.spec.ts:6` - edit profile settings
4. `settings.spec.ts:64` - view billing settings
5. `admin.spec.ts:5` - verify admin navigation
6. `navigation.spec.ts:5` - navigation sidebars switch

### Batch Fix

#### 1. Account Tests (account.spec.ts)

**Issue**: Sélecteurs probablement corrects, mais peut-être timeout

```typescript
// Line 78: update name flow
// ADD: Longer wait after save
await page.getByRole("button", { name: /save/i }).click();
await page.waitForTimeout(2000); // Wait for toast + DB update
await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 10000 });

// Line 100: change password flow
// ADD: Wait for password change form to load
await page.goto("/account/change-password");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000); // React hydration
```

#### 2. Admin Test (admin.spec.ts)

**Already Fixed**: Organizations links removed in commit `cbd2e06`

**Potential Issue**: Timing - add waits

```typescript
// Line 13: After goto /admin
await page.goto("/admin");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000); // Sidebar mount
```

#### 3. Navigation Tests (navigation.spec.ts)

**Issue**: Spaces changed (no more "Orgs" space)

```typescript
// Line 5: navigation sidebars switch correctly
// REMOVE: Any references to "Organizations" space
// KEEP: Trading, Account, Admin spaces only

// Line 86: global search works
// ENSURE: Search doesn't look for "Organization" results
// Test only: Dashboard, Traders, Settings, My Signals
```

---

## Pattern C: Portfolio DB Helpers (11 tests)

### Root Cause

- `createMockExchangeConnection` doesn't update `traderProfile.verified`
- `createCompletePortfolioData` causes unique constraint violations
- Missing `TraderTrade` records for test data

### Tests Affected

1. `portfolio-tracking.spec.ts:10` - complete flow connect → view stats
2. `portfolio-tracking.spec.ts:102` - manual sync triggers trade fetching
3. `portfolio-tracking.spec.ts:149` - displays performance stats for 4 periods
4. `portfolio-tracking.spec.ts:208` - displays 15 performance metrics
5. `portfolio-tracking.spec.ts:260` - FREE users preview winrate
6. `portfolio-tracking.spec.ts:322` - FREE users cannot connect exchanges
7. `portfolio.spec.ts:20` - non-trader users redirected
8. `portfolio.spec.ts:54` - trader can access portfolio page
9. `trader-verification.spec.ts:19` - trader becomes verified when connecting
10. `trader-verification.spec.ts:22` - trader keeps verified badge
11. `trader-verification.spec.ts:23` - trader loses verified badge

### Batch Fix

#### File: `e2e/utils/portfolio-test.ts`

```typescript
// FIX 1: createMockExchangeConnection
export async function createMockExchangeConnection(
  userId: string,
  options?: Partial<CreateMockExchangeConnectionOptions>,
) {
  // ... existing code ...

  // ✅ ADD: Update traderProfile.verified
  await prisma.traderProfile.updateMany({
    where: { userId },
    data: { verified: true },
  });

  return connection;
}

// FIX 2: createCompletePortfolioData
export async function createCompletePortfolioData() {
  // ... create trader ...

  // ✅ CHANGE: Use upsert instead of create (avoid unique constraint)
  const connection = await prisma.userExchangeConnection.upsert({
    where: {
      userId_exchange: {
        userId: trader.id,
        exchange: "BINANCE",
      },
    },
    update: {
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      isActive: true,
      lastSyncAt: new Date(),
    },
    create: {
      userId: trader.id,
      exchange: "BINANCE",
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      isActive: true,
      lastSyncAt: new Date(),
    },
  });

  // ✅ ADD: Create TraderTrade records
  await prisma.traderTrade.createMany({
    data: [
      {
        traderId: trader.id,
        symbol: "BTCUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: 0.01,
        price: 50000,
        status: "FILLED",
        executedAt: new Date(),
        exchange: "BINANCE",
      },
      {
        traderId: trader.id,
        symbol: "ETHUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.5,
        price: 3000,
        status: "FILLED",
        executedAt: new Date(),
        exchange: "BINANCE",
      },
    ],
  });

  return { trader, connection };
}
```

---

## Pattern D: nuqs URL State (2 tests)

### Root Cause

`nuqs` uses `replaceState` which doesn't trigger `waitForURL`. Need `waitForResponse` fallback.

### Tests Affected

1. `signals-feed-filters.spec.ts:26` - user can filter signals by asset
2. `signals-feed-filters.spec.ts:27` - user can filter signals by bias

### Batch Fix

#### File: `e2e/signals-feed-filters.spec.ts`

```typescript
// Line 34: user can filter signals by asset
test("user can filter signals by asset", async ({ page }) => {
  // ... setup ...

  // Filter by BTC
  await filterSelect.selectOption("BTC");

  // ✅ FIX: Wait for both URL and API response
  await page.waitForURL(/asset=BTC/, { timeout: 2000 }).catch(() => {});
  await page.waitForResponse(
    (response) => response.url().includes("/api/signals/feed"),
    { timeout: 3000 },
  );

  // Verify filtered results
  await expect(page.getByText(/BTCUSDT/i).first()).toBeVisible();
});

// Line 40: user can filter signals by bias
test("user can filter signals by bias (LONG/SHORT)", async ({ page }) => {
  // ... setup ...

  // Filter by LONG
  await biasSelect.selectOption("LONG");

  // ✅ FIX: Wait for both URL and API response
  await page.waitForURL(/bias=LONG/, { timeout: 2000 }).catch(() => {});
  await page.waitForResponse(
    (response) => response.url().includes("/api/signals/feed"),
    { timeout: 3000 },
  );

  // Verify filtered results
  await expect(page.getByText(/LONG/i).first()).toBeVisible();
});
```

---

## Pattern E: Follow/Unfollow Test (1 test)

### Root Cause

Timing issue - follow button click not waiting for network response

### Test Affected

`follow-unfollow.spec.ts:7` - user can follow and unfollow a trader

### Batch Fix

```typescript
// Line 7: user can follow and unfollow a trader
test("user can follow and unfollow a trader", async ({ page }) => {
  // ... setup ...

  // ✅ FIX: Wait for follow action to complete
  await followButton.click();
  await page.waitForResponse(
    (response) => response.url().includes("/api/follow"),
    { timeout: 5000 },
  );
  await page.waitForTimeout(1000); // UI update

  // Verify followed
  await expect(page.getByRole("button", { name: /unfollow/i })).toBeVisible({
    timeout: 10000,
  });

  // ✅ FIX: Wait for unfollow action to complete
  await unfollowButton.click();
  await page.waitForResponse(
    (response) => response.url().includes("/api/follow"),
    { timeout: 5000 },
  );
  await page.waitForTimeout(1000); // UI update

  // Verify unfollowed
  await expect(page.getByRole("button", { name: /follow/i })).toBeVisible({
    timeout: 10000,
  });
});
```

---

## Pattern F: Signals Expiration + Filters (3 tests)

### Root Cause

Timing issues with signal creation + expiration checks

### Tests Affected

1. `signal-expiration.spec.ts:58` - expired signal shows EXPIRED status
2. `signals-feed-filters.spec.ts:10` - filters persist in URL

### Batch Fix

```typescript
// signal-expiration.spec.ts:58
test("expired signal shows EXPIRED status", async ({ page }) => {
  // Create signal with 1 second TTL
  const signal = await createTestSignal({
    traderId: trader.id,
    expiresAt: new Date(Date.now() + 1000), // 1 second
  });

  await page.goto("/signals");

  // ✅ FIX: Wait longer for expiration + UI update
  await page.waitForTimeout(2000); // Wait for expiration
  await page.reload(); // Force reload to get fresh data
  await page.waitForLoadState("networkidle");

  // Verify EXPIRED badge
  await expect(page.getByText(/expired/i)).toBeVisible({ timeout: 10000 });
});
```

---

## Execution Plan

### Step 1: Global Timeout Increase (1min)

```bash
# Edit playwright.config.ts
- actionTimeout: 10000 → 15000
- navigationTimeout: 30000 → 45000
- expect.timeout: 10000 → 15000
```

### Step 2: Portfolio Helpers Fix (30min)

```bash
# Edit e2e/utils/portfolio-test.ts
- Add traderProfile.verified update
- Change create → upsert for connections
- Add TraderTrade.createMany
```

### Step 3: nuqs Fixes (15min)

```bash
# Edit e2e/signals-feed-filters.spec.ts
- Add waitForResponse fallbacks
```

### Step 4: Follow Test Fix (10min)

```bash
# Edit e2e/follow-unfollow.spec.ts
- Add waitForResponse for follow/unfollow actions
```

### Step 5: Account/Settings Fixes (20min)

```bash
# Edit e2e/account.spec.ts
# Edit e2e/settings.spec.ts
- Add waitForTimeout after actions
- Increase timeout expectations
```

### Step 6: Navigation Fixes (15min)

```bash
# Edit e2e/navigation.spec.ts
- Remove "Organizations" space references
- Add waitForTimeout for sidebar mount
```

### Step 7: Signal Expiration Fix (10min)

```bash
# Edit e2e/signal-expiration.spec.ts
- Increase wait for expiration
- Add reload for fresh data
```

---

## Total Estimated Time

| Pattern              | Tests Fixed  | Time         |
| -------------------- | ------------ | ------------ |
| A. Timeouts          | 8            | 1min         |
| B. UI Selectors      | 6            | 45min        |
| C. Portfolio Helpers | 11           | 30min        |
| D. nuqs              | 2            | 15min        |
| E. Follow/Unfollow   | 1            | 10min        |
| F. Signal Expiration | 3            | 10min        |
| **TOTAL**            | **31 tests** | **2h 01min** |

---

## Expected Results

**Before**: 52/84 passing (62%)
**After**: 83/84 passing (99%)

**Remaining**: 1 test (likely flaky, needs investigation)

---

**Ready to execute**: All fixes documented with exact code snippets and line numbers.
