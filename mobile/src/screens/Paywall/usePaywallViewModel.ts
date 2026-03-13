import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PRODUCT_IDS,
} from '../../lib/purchasesService';
import { useSubscription } from '../../contexts/SubscriptionContext';
import t from '../../locales/en';

export type PlanKey = 'monthly' | 'annual' | 'lifetime';

export interface PricingPlan {
  key: PlanKey;
  label: string;
  price: string;
  period: string;
  priceLocal: string;
  perMonth?: string;
  productId: string;
  isBestValue?: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    key: 'monthly',
    label: t.paywall.monthly.label,
    price: t.paywall.monthly.price,
    period: t.paywall.monthly.period,
    priceLocal: t.paywall.monthly.priceUsd,
    productId: PRODUCT_IDS.monthly,
  },
  {
    key: 'annual',
    label: t.paywall.annual.label,
    price: t.paywall.annual.price,
    period: t.paywall.annual.period,
    priceLocal: t.paywall.annual.priceUsd,
    perMonth: t.paywall.annual.perMonth,
    productId: PRODUCT_IDS.annual,
    isBestValue: true,
  },
  {
    key: 'lifetime',
    label: t.paywall.lifetime.label,
    price: t.paywall.lifetime.price,
    period: t.paywall.lifetime.period,
    priceLocal: t.paywall.lifetime.priceUsd,
    perMonth: t.paywall.lifetime.perMonth,
    productId: PRODUCT_IDS.lifetime,
  },
];

interface UsePaywallViewModelReturn {
  selectedPlan: PlanKey;
  setSelectedPlan: (key: PlanKey) => void;
  offerings: PurchasesOfferings | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  handlePurchase: () => Promise<void>;
  handleRestore: () => Promise<void>;
}

export function usePaywallViewModel(
  onSuccess: () => void,
): UsePaywallViewModelReturn {
  const { refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    getOfferings().then(setOfferings).catch(() => {});
  }, []);

  const findPackage = useCallback((): PurchasesPackage | undefined => {
    if (!offerings?.current) return undefined;
    const plan = PLANS.find(p => p.key === selectedPlan);
    if (!plan) return undefined;
    return offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === plan.productId,
    );
  }, [offerings, selectedPlan]);

  const handlePurchase = useCallback(async () => {
    const pkg = findPackage();
    if (!pkg) {
      // RevenueCat not configured yet — show info alert
      Alert.alert(
        t.paywall.title,
        'In-app purchases are not configured yet. Please contact support.',
        [{ text: t.common.ok }],
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const info = await purchasePackage(pkg);
      if (info) {
        await refresh();
        Alert.alert(t.paywall.successTitle, t.paywall.successBody, [
          { text: t.common.ok, onPress: onSuccess },
        ]);
      }
    } catch {
      Alert.alert(t.common.error, t.paywall.errorPurchase, [{ text: t.common.ok }]);
    } finally {
      setIsPurchasing(false);
    }
  }, [findPackage, refresh, onSuccess]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const info = await restorePurchases();
      const hasPlus = !!info.entitlements.active['plus'];
      if (hasPlus) {
        await refresh();
        Alert.alert(t.paywall.successTitle, t.paywall.successBody, [
          { text: t.common.ok, onPress: onSuccess },
        ]);
      } else {
        Alert.alert(t.common.error, t.paywall.errorRestore, [{ text: t.common.ok }]);
      }
    } catch {
      Alert.alert(t.common.error, t.paywall.errorRestore, [{ text: t.common.ok }]);
    } finally {
      setIsRestoring(false);
    }
  }, [refresh, onSuccess]);

  return {
    selectedPlan,
    setSelectedPlan,
    offerings,
    isPurchasing,
    isRestoring,
    handlePurchase,
    handleRestore,
  };
}
