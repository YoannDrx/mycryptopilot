# Checkout Page - Implementation Guide

**Issue**: #34  
**Branch**: `issue-34-ui-checkout-crypto`  
**Estimation**: 5-6 jours

## 📁 Directory Structure

```
checkout/[plan]/
├── page.tsx                 # Main page (✅ scaffold created)
├── checkout-form.tsx        # Main checkout UI (TODO)
├── qr-code-display.tsx      # QR codes component (TODO)
├── countdown-timer.tsx      # 15 min timer (TODO)
├── payment-status.tsx       # Status watcher (TODO)
└── README.md               # This file
```

## 🔧 Implementation Phases

### Phase 1: Setup (4h) - ⏳ TODO

- [ ] Install `qrcode` + `react-countdown`
- [ ] Test page route works (http://localhost:3000/orgs/test/checkout/pro)
- [ ] Test API routes respond

### Phase 2: Address Generation (8h) - ⏳ TODO

- [ ] Implement `generateAddressAction`
- [ ] Connect to HD wallet functions
- [ ] Store addresses in DB
- [ ] Test address generation

### Phase 3-8: See Issue #34

## 🧪 Testing Locally

```bash
# Start dev server
pnpm dev

# Visit checkout page
http://localhost:3000/orgs/test/checkout/pro
http://localhost:3000/orgs/test/checkout/ultra

# Test API routes
curl -X POST http://localhost:3000/api/crypto/generate-address \
  -H "Content-Type: application/json" \
  -d '{"plan":"PRO"}'
```

## 📚 Resources

- [Issue #34](https://github.com/YoannDrx/mycryptopilot/issues/34) - Full spec
- `src/lib/crypto/address-generator.ts` - HD wallet functions
- `src/lib/crypto/payment-watcher.ts` - RPC monitoring
- `src/lib/crypto/mycryptopilot-plans.ts` - Plans config

## ✅ Acceptance Criteria

User can:

1. Visit `/checkout/pro` or `/checkout/ultra`
2. See unique crypto addresses (Base + Tron)
3. Scan QR codes for mobile payment
4. See countdown timer (15 min)
5. Payment auto-detected → Subscription activated
6. Redirect to dashboard with success toast
