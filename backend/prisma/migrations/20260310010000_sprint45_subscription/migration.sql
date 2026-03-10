-- Sprint 45: Subscription model for RevenueCat integration
CREATE TYPE "SubscriptionStatus" AS ENUM ('free', 'active', 'expired', 'cancelled', 'grace_period');

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "platform" TEXT,
    "productId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'free',
    "expiresAt" TIMESTAMP(3),
    "originalTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_coupleId_key" ON "subscriptions"("coupleId");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
