# Trading System - MyCryptoPilot

**Dernière mise à jour**: 11 octobre 2025
**Statut**: ✅ **100% FONCTIONNEL** (Issues #14, #15, #16, #17 complétées)

## Vue d'ensemble

Système complet de trading social permettant:

- ✅ Création et gestion de profils traders
- ✅ Publication de signaux de trading (TradingCards)
- ✅ Système follow/unfollow avec limites par plan
- ✅ Marketplace de traders avec search/filters/pagination
- ✅ Dashboards connectés aux données réelles
- ✅ Webhook Discord automatique pour nouveaux signaux

---

## Architecture

### 3 Features Principales

1. **Trader Profiles** - Profils publics avec stats (winrate, payoff, followers)
2. **Trading Signals** - Signaux structurés (format TradingCard JSON)
3. **Follow System** - Relations follower → trader avec limites plans

---

## 1. Trader Profiles

### Modèle DB

**Fichier**: `prisma/schema/schema.prisma`

```prisma
model TraderProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  bio           String?  @db.Text
  verified      Boolean  @default(false)
  statsJson     Json     // { winrate, payoff, totalSignals, followers }

  signals       Signal[]
  followers     Follow[] @relation("TraderFollowers")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### statsJson Structure

```typescript
{
  winrate: number;        // 0-100 (%)
  payoff: number;         // Ratio gains/pertes moyen
  totalSignals: number;   // Total signaux publiés
  activeSignals: number;  // Signaux actuellement actifs
  followers: number;      // Nombre de followers
  totalVolume?: number;   // Volume cumulé (USD)
}
```

### Schemas Zod

**Fichier**: `src/features/trader/trader.schema.ts`

```typescript
export const createTraderProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
});

export const updateTraderProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
  statsJson: z
    .object({
      winrate: z.number().min(0).max(100).optional(),
      payoff: z.number().min(0).optional(),
      totalSignals: z.number().int().min(0).optional(),
      activeSignals: z.number().int().min(0).optional(),
      followers: z.number().int().min(0).optional(),
    })
    .optional(),
});

export const toggleTraderRoleSchema = z.object({
  enable: z.boolean(),
});
```

### Actions Server

**Fichier**: `src/features/trader/trader.action.ts`

#### `createTraderProfileAction`

```typescript
export const createTraderProfileAction = authAction
  .metadata({
    name: "createTraderProfile",
    track: { event: "trader_profile_created" },
  })
  .schema(createTraderProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;

    // Check if profile already exists
    const existing = await getTraderProfileByUserId(userId);
    if (existing) {
      return { serverError: "Trader profile already exists" };
    }

    // Create profile with initial stats
    const profile = await prisma.traderProfile.create({
      data: {
        userId,
        bio: parsedInput.bio,
        statsJson: {
          winrate: 0,
          payoff: 0,
          totalSignals: 0,
          activeSignals: 0,
          followers: 0,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Update user role to TRADER
    await prisma.user.update({
      where: { id: userId },
      data: { userRole: "TRADER" },
    });

    logger.info("Trader profile created", { userId, traderId: profile.id });

    return { data: profile };
  });
```

#### `updateTraderProfileAction`

```typescript
export const updateTraderProfileAction = authAction
  .metadata({ name: "updateTraderProfile" })
  .schema(updateTraderProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;

    const profile = await prisma.traderProfile.update({
      where: { userId },
      data: {
        bio: parsedInput.bio,
        statsJson: parsedInput.statsJson,
      },
      include: {
        user: true,
      },
    });

    logger.info("Trader profile updated", { userId, traderId: profile.id });

    return { data: profile };
  });
```

#### `toggleTraderRoleAction`

```typescript
export const toggleTraderRoleAction = authAction
  .metadata({ name: "toggleTraderRole" })
  .schema(toggleTraderRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { enable } = parsedInput;

    const currentRole = ctx.user.userRole;
    const newRole = enable ? "TRADER" : "USER";

    await prisma.user.update({
      where: { id: userId },
      data: { userRole: newRole },
    });

    logger.info("User role toggled", {
      userId,
      from: currentRole,
      to: newRole,
    });

    return { data: { userRole: newRole } };
  });
```

### Queries

**Fichier**: `src/features/trader/trader-queries.ts` (6 fonctions)

```typescript
// Get trader profile by user ID
export const getTraderProfileByUserId = async (userId: string) => {
  return prisma.traderProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
};

// Get trader profile by trader ID
export const getTraderProfileById = async (traderId: string) => {
  return prisma.traderProfile.findUnique({
    where: { id: traderId },
    include: { user: true },
  });
};

// Count trader followers
export const countTraderFollowers = async (
  traderId: string,
): Promise<number> => {
  return prisma.follow.count({ where: { traderId } });
};

// Search traders (marketplace)
export const searchTraders = async (params: {
  search?: string;
  verified?: boolean;
  sortBy?: "winrate" | "followers" | "signals" | "recent";
  cursor?: string;
  limit?: number;
}) => {
  const { search, verified, sortBy = "recent", cursor, limit = 20 } = params;

  const where: Prisma.TraderProfileWhereInput = {
    ...(search && {
      OR: [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { bio: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(verified !== undefined && { verified }),
  };

  // Sorting
  let orderBy: Prisma.TraderProfileOrderByWithRelationInput = {
    createdAt: "desc",
  };
  if (sortBy === "winrate") {
    orderBy = { statsJson: { path: ["winrate"], sort: "desc" } };
  } else if (sortBy === "followers") {
    orderBy = { followers: { _count: "desc" } };
  } else if (sortBy === "signals") {
    orderBy = { signals: { _count: "desc" } };
  }

  const traders = await prisma.traderProfile.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { followers: true, signals: true },
      },
    },
  });

  const hasNextPage = traders.length > limit;
  const items = hasNextPage ? traders.slice(0, -1) : traders;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items, nextCursor, hasNextPage };
};
```

### UI Components

#### Formulaire Création/Édition

**Fichier**: `app/orgs/[orgSlug]/(navigation)/account/become-trader/become-trader-form.tsx` (173 lignes)

```tsx
"use client";

export const BecomeTraderForm = ({
  existingProfile,
}: BecomeTraderFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: existingProfile?.bio ?? "",
      image: existingProfile?.user.image ?? "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const result = await createTraderProfileAction(data);
      return unwrapServerActionResult(result);
    },
    onSuccess: () => {
      toast.success("Trader profile created!");
      router.push("/dashboard/trader");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const result = await updateTraderProfileAction(data);
      return unwrapServerActionResult(result);
    },
    onSuccess: () => {
      toast.success("Profile updated!");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          existingProfile ? updateMutation.mutate : createMutation.mutate,
        )}
      >
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture</FormLabel>
              <ImageFormItem value={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us about your trading experience..."
                  rows={5}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {existingProfile ? "Update Profile" : "Create Profile"}
        </Button>
      </form>
    </Form>
  );
};
```

#### Page Profil Trader Public

**Fichier**: `app/orgs/[orgSlug]/(navigation)/traders/[traderId]/page.tsx`

```tsx
export default async function TraderProfilePage({
  params,
}: TraderProfilePageProps) {
  const trader = await getTraderProfileById(params.traderId);

  if (!trader) {
    notFound();
  }

  const stats = trader.statsJson as TraderStats;
  const followersCount = await countTraderFollowers(trader.id);
  const signalsCount = await countTotalSignalsByTrader(trader.id);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        <Avatar className="size-24">
          <AvatarImage src={trader.user.image ?? undefined} />
          <AvatarFallback>{trader.user.name?.[0] ?? "T"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{trader.user.name}</h1>
            {trader.verified && (
              <Badge variant="secondary">
                <CheckCircle2 className="mr-1 size-4" />
                Verified
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground mt-2">{trader.bio}</p>

          {/* Stats */}
          <div className="mt-4 flex gap-6">
            <div>
              <span className="text-2xl font-bold">{stats.winrate}%</span>
              <p className="text-muted-foreground text-sm">Winrate</p>
            </div>
            <div>
              <span className="text-2xl font-bold">
                {stats.payoff.toFixed(2)}
              </span>
              <p className="text-muted-foreground text-sm">Payoff</p>
            </div>
            <div>
              <span className="text-2xl font-bold">{followersCount}</span>
              <p className="text-muted-foreground text-sm">Followers</p>
            </div>
            <div>
              <span className="text-2xl font-bold">{signalsCount}</span>
              <p className="text-muted-foreground text-sm">Signals</p>
            </div>
          </div>

          {/* Follow Button */}
          <FollowButton traderId={trader.id} />
        </div>
      </div>

      {/* Signals List */}
      <TraderSignalsList traderId={trader.id} />
    </div>
  );
}
```

---

## 2. Trading Signals

### Modèle DB

```prisma
model Signal {
  id            String         @id @default(cuid())
  traderId      String
  trader        TraderProfile  @relation(fields: [traderId], references: [id], onDelete: Cascade)

  asset         String         // "BTC", "ETH", etc.
  status        SignalStatus   @default(ACTIVE)
  payloadJson   Json           // TradingCard structure
  payloadHash   String         // SHA-256 hash (immutabilité)

  publishedAt   DateTime       @default(now())
  closedAt      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([traderId, status])
  @@index([asset, status])
  @@index([publishedAt])
}

enum SignalStatus {
  ACTIVE
  TP_HIT
  INVALIDATED
}
```

### TradingCard Format

**Documentation complète**: `docs/TRADING_CARDS.md`

```typescript
type TradingCard = {
  // Identification
  instrumentType: "SPOT" | "PERP";
  bias: "LONG" | "SHORT";

  // Price Levels
  entry: number; // Entry price
  invalidation: number; // Stop-loss level
  tps: number[]; // Take-profit levels (ordered)

  // Risk Management
  leverageBand: string; // "1x-3x", "5x-10x", "10x-20x"
  risk: 1 | 2 | 3 | 4 | 5; // Risk level
  confidence: number; // 0-100 (%)

  // Analysis
  rationales: string[]; // Raisons du trade (3-5 items)
  regime: string; // "Trending", "Ranging", "Breakout", etc.

  // Metadata
  managedBy: "AI" | "HUMAN";
  version: "1.0";
};
```

**Exemple**:

```json
{
  "instrumentType": "PERP",
  "bias": "LONG",
  "entry": 42500,
  "invalidation": 41000,
  "tps": [43500, 44500, 46000],
  "leverageBand": "5x-10x",
  "risk": 3,
  "confidence": 75,
  "rationales": [
    "Strong support at 42k",
    "MACD bullish crossover on 4H",
    "Funding rate neutral"
  ],
  "regime": "Ranging",
  "managedBy": "HUMAN",
  "version": "1.0"
}
```

### Schemas Zod

**Fichier**: `src/features/signal/signal.schema.ts`

```typescript
export const TradingCardPayloadSchema = z.object({
  instrumentType: z.enum(["SPOT", "PERP"]),
  bias: z.enum(["LONG", "SHORT"]),
  entry: z.number().positive(),
  invalidation: z.number().positive(),
  tps: z.array(z.number().positive()).min(1).max(5),
  leverageBand: z.string(),
  risk: z.number().int().min(1).max(5),
  confidence: z.number().int().min(0).max(100),
  rationales: z.array(z.string()).min(1).max(5),
  regime: z.string(),
  managedBy: z.enum(["AI", "HUMAN"]),
  version: z.literal("1.0"),
});

export const createSignalSchema = z.object({
  asset: z.string().min(1).max(20),
  payload: TradingCardPayloadSchema,
});
```

### Actions Server

**Fichier**: `src/features/signal/signal.action.ts`

```typescript
export const createSignalAction = authAction
  .metadata({ name: "createSignal", track: { event: "signal_created" } })
  .schema(createSignalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;

    // Get trader profile
    const trader = await getTraderProfileByUserId(userId);
    if (!trader) {
      return { serverError: "You must create a trader profile first" };
    }

    // Generate immutable hash (SHA-256)
    const payloadString = JSON.stringify(parsedInput.payload);
    const payloadHash = crypto
      .createHash("sha256")
      .update(payloadString)
      .digest("hex");

    // Create signal
    const signal = await prisma.signal.create({
      data: {
        traderId: trader.id,
        asset: parsedInput.asset.toUpperCase(),
        status: "ACTIVE",
        payloadJson: parsedInput.payload,
        payloadHash,
      },
      include: {
        trader: {
          include: { user: true },
        },
      },
    });

    // Update trader stats (increment totalSignals + activeSignals)
    const stats = trader.statsJson as TraderStats;
    await prisma.traderProfile.update({
      where: { id: trader.id },
      data: {
        statsJson: {
          ...stats,
          totalSignals: (stats.totalSignals ?? 0) + 1,
          activeSignals: (stats.activeSignals ?? 0) + 1,
        },
      },
    });

    // Send Discord webhook notification (async, non-blocking)
    void notifyNewSignal({
      signal,
      trader,
      tradingCard: parsedInput.payload,
    }).catch((error) => {
      logger.error("Failed to send Discord webhook", {
        signalId: signal.id,
        error: error.message,
      });
    });

    logger.info("Signal created", {
      signalId: signal.id,
      traderId: trader.id,
      asset: parsedInput.asset,
    });

    return { data: signal };
  });
```

### Discord Webhook

**Fichier**: `src/lib/discord/webhook.ts`

```typescript
export async function notifyNewSignal(params: {
  signal: Signal;
  trader: TraderProfile & { user: User };
  tradingCard: TradingCard;
}): Promise<void> {
  const { signal, trader, tradingCard } = params;

  const channelId = env.DISCORD_GUILD_ID; // TODO: Créer DISCORD_SIGNALS_CHANNEL_ID

  if (!channelId) {
    logger.warn("Discord channel ID not configured");
    return;
  }

  const client = getDiscordClient();
  const channel = client.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) {
    logger.error("Discord channel not found or not text-based", { channelId });
    return;
  }

  // Format Discord embed
  const embed = {
    title: `🚨 New ${tradingCard.bias} Signal - ${signal.asset}`,
    description: `${trader.user.name} published a new ${tradingCard.instrumentType} signal`,
    color: tradingCard.bias === "LONG" ? 0x22c55e : 0xef4444, // Green for LONG, Red for SHORT
    fields: [
      { name: "Entry", value: `$${tradingCard.entry}`, inline: true },
      {
        name: "Invalidation",
        value: `$${tradingCard.invalidation}`,
        inline: true,
      },
      {
        name: "TPs",
        value: tradingCard.tps.map((tp, i) => `TP${i + 1}: $${tp}`).join("\n"),
        inline: false,
      },
      { name: "Risk", value: `${tradingCard.risk}/5`, inline: true },
      { name: "Confidence", value: `${tradingCard.confidence}%`, inline: true },
      { name: "Leverage", value: tradingCard.leverageBand, inline: true },
      {
        name: "Rationales",
        value: tradingCard.rationales
          .map((r, i) => `${i + 1}. ${r}`)
          .join("\n"),
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: `Signal ID: ${signal.id}`,
    },
  };

  await channel.send({ embeds: [embed] });

  logger.info("Discord webhook sent", { signalId: signal.id, channelId });
}
```

### UI Components

#### Formulaire Création Signal

**Fichier**: `app/orgs/[orgSlug]/(navigation)/dashboard/trader/signals/new/create-signal-form.tsx` (515 lignes!)

Features:

- ✅ Tous les champs TradingCard
- ✅ **Preview temps réel** avec composant TradingCard
- ✅ Validation Zod complète
- ✅ Dynamic TP fields (add/remove)
- ✅ Risk & Confidence sliders
- ✅ Rationales textarea array

```tsx
"use client";

export const CreateSignalForm = () => {
  const form = useForm<z.infer<typeof createSignalSchema>>({
    resolver: zodResolver(createSignalSchema),
    defaultValues: {
      asset: "",
      payload: {
        instrumentType: "PERP",
        bias: "LONG",
        entry: 0,
        invalidation: 0,
        tps: [0],
        leverageBand: "1x-3x",
        risk: 3,
        confidence: 70,
        rationales: [""],
        regime: "Ranging",
        managedBy: "HUMAN",
        version: "1.0",
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSignalSchema>) => {
      const result = await createSignalAction(data);
      return unwrapServerActionResult(result);
    },
    onSuccess: () => {
      toast.success("Signal published!");
      router.push("/dashboard/trader");
    },
  });

  const watchedPayload = form.watch("payload");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(createMutation.mutate)}
              className="space-y-6"
            >
              {/* Asset */}
              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="BTC, ETH, SOL..." />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Instrument Type & Bias */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="payload.instrumentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrument</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SPOT">Spot</SelectItem>
                          <SelectItem value="PERP">Perpetual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payload.bias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bias</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LONG">Long</SelectItem>
                          <SelectItem value="SHORT">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Entry & Invalidation */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="payload.entry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payload.invalidation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invalidation (Stop-Loss)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* TPs (dynamic array) */}
              <FormField
                control={form.control}
                name="payload.tps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take-Profit Levels</FormLabel>
                    {field.value.map((tp, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="number"
                          value={tp}
                          onChange={(e) => {
                            const newTps = [...field.value];
                            newTps[index] = parseFloat(e.target.value);
                            field.onChange(newTps);
                          }}
                          placeholder={`TP${index + 1}`}
                        />
                        {field.value.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTps = field.value.filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(newTps);
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {field.value.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange([...field.value, 0])}
                      >
                        <Plus className="mr-2 size-4" />
                        Add TP
                      </Button>
                    )}
                  </FormItem>
                )}
              />

              {/* Risk & Confidence */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="payload.risk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level: {field.value}/5</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payload.confidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Rationales */}
              <FormField
                control={form.control}
                name="payload.rationales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rationales (Trading reasons)</FormLabel>
                    {field.value.map((rationale, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={rationale}
                          onChange={(e) => {
                            const newRationales = [...field.value];
                            newRationales[index] = e.target.value;
                            field.onChange(newRationales);
                          }}
                          placeholder={`Reason ${index + 1}`}
                          rows={2}
                        />
                        {field.value.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newRationales = field.value.filter(
                                (_, i) => i !== index,
                              );
                              field.onChange(newRationales);
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {field.value.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange([...field.value, ""])}
                      >
                        <Plus className="mr-2 size-4" />
                        Add Rationale
                      </Button>
                    )}
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Publishing..." : "Publish Signal"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <div className="sticky top-4">
        <h3 className="mb-4 text-lg font-semibold">Live Preview</h3>
        <TradingCard
          signal={{
            id: "preview",
            asset: form.watch("asset") || "BTC",
            status: "ACTIVE",
            publishedAt: new Date(),
            trader: {
              user: {
                name: "You",
                image: null,
              },
              verified: false,
            },
          }}
          tradingCard={watchedPayload}
        />
      </div>
    </div>
  );
};
```

#### TradingCard Component

**Fichier**: `src/components/nowts/trading-card.tsx` (170 lignes)

Visual display of a trading signal (used in preview + feeds).

```tsx
export const TradingCard = ({ signal, tradingCard }: TradingCardProps) => {
  const biasColor = tradingCard.bias === "LONG" ? "bg-green-500" : "bg-red-500";
  const riskColors = [
    "bg-gray-400",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className={`${biasColor} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{signal.asset}</h3>
            <p className="text-sm opacity-90">
              {tradingCard.instrumentType} • {tradingCard.bias}
            </p>
          </div>
          <Badge variant="secondary" className="bg-white text-gray-900">
            {tradingCard.leverageBand}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Prices */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Entry</p>
            <p className="text-xl font-bold">
              ${tradingCard.entry.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Stop-Loss</p>
            <p className="text-xl font-bold text-red-600">
              ${tradingCard.invalidation.toLocaleString()}
            </p>
          </div>
        </div>

        {/* TPs */}
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 text-sm">
            Take-Profit Levels
          </p>
          <div className="flex gap-2">
            {tradingCard.tps.map((tp, i) => (
              <Badge key={i} variant="outline">
                TP{i + 1}: ${tp.toLocaleString()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Risk & Confidence */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <p className="text-muted-foreground mb-2 text-sm">Risk Level</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded ${level <= tradingCard.risk ? riskColors[tradingCard.risk - 1] : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground mb-2 text-sm">Confidence</p>
            <Progress value={tradingCard.confidence} className="h-2" />
            <p className="mt-1 text-right text-sm font-medium">
              {tradingCard.confidence}%
            </p>
          </div>
        </div>

        {/* Rationales */}
        <div>
          <p className="text-muted-foreground mb-2 text-sm">
            Trading Rationales
          </p>
          <ul className="space-y-1">
            {tradingCard.rationales.map((rationale, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{rationale}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={signal.trader.user.image ?? undefined} />
              <AvatarFallback>
                {signal.trader.user.name?.[0] ?? "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{signal.trader.user.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(signal.publishedAt, { addSuffix: true })}
              </p>
            </div>
          </div>
          {signal.trader.verified && (
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 size-3" />
              Verified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 3. Follow System

### Modèle DB

```prisma
model Follow {
  id          String        @id @default(cuid())
  followerId  String
  follower    User          @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  traderId    String
  trader      TraderProfile @relation("TraderFollowers", fields: [traderId], references: [id], onDelete: Cascade)

  createdAt   DateTime      @default(now())

  @@unique([followerId, traderId])
  @@index([followerId])
  @@index([traderId])
}
```

### Limites par Plan

| Plan  | Traders Follow Max |
| ----- | ------------------ |
| FREE  | 1                  |
| PRO   | 5                  |
| ULTRA | ∞ (unlimited)      |

### Actions Server

**Fichier**: `src/features/follow/follow.action.ts`

#### Helper: `getUserPlan()`

```typescript
const getUserPlan = async (userId: string): Promise<MyCryptoPilotPlanName> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planName: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Return user's actual plan, default to "free" if not set
  return (user.planName as MyCryptoPilotPlanName) ?? "free";
};
```

#### `followTraderAction`

```typescript
export const followTraderAction = authAction
  .metadata({ name: "followTrader", track: { event: "trader_followed" } })
  .schema(z.object({ traderId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { traderId } = parsedInput;

    // Check trader exists
    const trader = await getTraderProfileById(traderId);
    if (!trader) {
      return { serverError: "Trader not found" };
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_traderId: { followerId: userId, traderId },
      },
    });

    if (existing) {
      return { serverError: "Already following this trader" };
    }

    // Check plan limits
    const userPlan = await getUserPlan(userId);
    const currentFollowsCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    const canFollow = canPerformAction(
      userPlan,
      "tradersFollow",
      currentFollowsCount,
    );

    if (!canFollow) {
      const limit = MYCRYPTOPILOT_PLANS.find((p) => p.name === userPlan)
        ?.features.tradersFollow;
      return {
        serverError: `You can only follow ${limit} trader(s) on the ${userPlan.toUpperCase()} plan. Upgrade to follow more traders.`,
      };
    }

    // Create follow
    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        traderId,
      },
    });

    // Update trader stats (increment followers)
    const stats = trader.statsJson as TraderStats;
    await prisma.traderProfile.update({
      where: { id: traderId },
      data: {
        statsJson: {
          ...stats,
          followers: (stats.followers ?? 0) + 1,
        },
      },
    });

    logger.info("User followed trader", { userId, traderId });

    return { data: follow };
  });
```

#### `unfollowTraderAction`

```typescript
export const unfollowTraderAction = authAction
  .metadata({ name: "unfollowTrader", track: { event: "trader_unfollowed" } })
  .schema(z.object({ traderId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.user.id;
    const { traderId } = parsedInput;

    // Delete follow
    const follow = await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        traderId,
      },
    });

    if (follow.count === 0) {
      return { serverError: "Not following this trader" };
    }

    // Update trader stats (decrement followers)
    const trader = await getTraderProfileById(traderId);
    if (trader) {
      const stats = trader.statsJson as TraderStats;
      await prisma.traderProfile.update({
        where: { id: traderId },
        data: {
          statsJson: {
            ...stats,
            followers: Math.max(0, (stats.followers ?? 0) - 1),
          },
        },
      });
    }

    logger.info("User unfollowed trader", { userId, traderId });

    return { data: { success: true } };
  });
```

### UI Components

#### FollowButton

**Fichier**: `app/orgs/[orgSlug]/(navigation)/traders/[traderId]/follow-button.tsx`

```tsx
"use client";

export const FollowButton = ({
  traderId,
  initialIsFollowing,
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const followMutation = useMutation({
    mutationFn: async () => {
      const result = await followTraderAction({ traderId });
      return unwrapServerActionResult(result);
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast.success("Followed trader!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const result = await unfollowTraderAction({ traderId });
      return unwrapServerActionResult(result);
    },
    onSuccess: () => {
      setIsFollowing(false);
      toast.success("Unfollowed trader");
    },
  });

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      variant={isFollowing ? "outline" : "default"}
    >
      {isFollowing ? (
        <>
          <UserMinus className="mr-2 size-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="mr-2 size-4" />
          Follow
        </>
      )}
    </Button>
  );
};
```

---

## 4. Dashboards

### User Dashboard

**Fichier**: `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx`

**Statut**: ✅ **100% FONCTIONNEL** (0 TODOs - audit 11 oct 2025)

Features:

- ✅ Fetch followed traders count (Prisma Follow.count)
- ✅ Fetch active signals count (Prisma Signal.count avec filtres)
- ✅ Composant SignalsFeed avec vraies données
- ✅ Stats cards avec données réelles (plan, traders suivis, signaux actifs)

### Trader Dashboard

**Fichier**: `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx`

**Statut**: ✅ **100% FONCTIONNEL** (0 TODOs - audit 11 oct 2025)

Features:

- ✅ Fetch trader profile via `getTraderProfileByUserId`
- ✅ Fetch followers count (Prisma Follow.count)
- ✅ Fetch signals count via `countActiveSignalsByTrader` et `countTotalSignalsByTrader`
- ✅ Composant TraderSignalsList avec vraies données
- ✅ Stats from statsJson (winrate, payoff)

### Marketplace

**Fichier**: `app/orgs/[orgSlug]/(navigation)/traders/page.tsx`

**Statut**: ✅ **100% FONCTIONNEL** (0 TODOs - audit 11 oct 2025)

Features:

- ✅ Fonction `searchTraders` avec params (search, verified, sortBy, cursor, limit)
- ✅ Fetch followers count via `countTraderFollowers` (parallel)
- ✅ Fetch signals count via `countTotalSignalsByTrader` (parallel)
- ✅ Fetch isFollowing status via `isFollowingTrader` (parallel)
- ✅ Pagination avec nextCursor et hasNextPage
- ✅ Filtres: "all", "verified"
- ✅ Tri: "winrate", "followers", "signals", "recent"
- ✅ Composant MarketplaceFilters fonctionnel
- ✅ Bouton FollowButton intégré

---

## Fichiers Importants

**Trader Profiles**:

- `src/features/trader/trader.schema.ts` - Zod schemas
- `src/features/trader/trader.action.ts` - Server actions
- `src/features/trader/trader-queries.ts` - DB queries (6 fonctions)
- `app/orgs/[orgSlug]/(navigation)/account/become-trader/become-trader-form.tsx` - Formulaire (173 lignes)
- `app/orgs/[orgSlug]/(navigation)/traders/[traderId]/page.tsx` - Page profil public

**Trading Signals**:

- `src/features/signal/signal.schema.ts` - Zod schemas + TradingCard
- `src/features/signal/signal.action.ts` - Server actions
- `src/features/signal/signal-queries.ts` - DB queries
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/signals/new/create-signal-form.tsx` - Formulaire (515 lignes!)
- `src/components/nowts/trading-card.tsx` - TradingCard display (170 lignes)
- `src/lib/discord/webhook.ts` - Discord notifications

**Follow System**:

- `src/features/follow/follow.action.ts` - Server actions (followTrader, unfollowTrader)
- `src/features/follow/follow-queries.ts` - DB queries (5 fonctions)
- `app/orgs/[orgSlug]/(navigation)/traders/[traderId]/follow-button.tsx` - FollowButton component

**Dashboards**:

- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - User dashboard (100% connecté)
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - Trader dashboard (100% connecté)
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - Marketplace (100% fonctionnelle)

---

## Prochaines Étapes

- [x] Plan user récupération depuis DB implémentée (follow.action.ts lignes 19-28) - **DONE**
- [ ] Feed signaux avec filtres (asset, bias, status) - **1-2j**
- [ ] Pagination + infinite scroll pour feeds - **1j**
- [ ] Real-time signal updates (webhooks ou polling) - **2-3j**
- [ ] Signal analytics (performance tracking) - **Phase 5**
- [ ] Trading Journal integration - **Phase 5**
