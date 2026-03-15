import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PRODUCT_IDS,
} from '../../lib/purchasesService';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
export type PlanKey = 'monthly' | 'annual' | 'lifetime';

export interface PricingPlan {
  key: PlanKey;
  label: string;
  price: string;
  period: string;
  priceUsd: string;
  perMonth?: string;
  productId: string;
  isBestValue?: boolean;
}

interface UsePaywallViewModelReturn {
  selectedPlan: PlanKey;
  setSelectedPlan: (key: PlanKey) => void;
  offerings: PurchasesOfferings | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  plans: PricingPlan[];
  handlePurchase: () => Promise<void>;
  handleRestore: () => Promise<void>;
}

export function usePaywallViewModel(
  onSuccess: () => void,
): UsePaywallViewModelReturn {
  const { t } = useTranslation();
  const { refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const plans = useMemo<PricingPlan[]>(() => [
    {
      key: 'monthly',
      label: t('paywall.monthly.label'),
      price: t('paywall.monthly.price'),
      period: t('paywall.monthly.period'),
      priceUsd: t('paywall.monthly.priceUsd'),
      productId: PRODUCT_IDS.monthly,
    },
    {
      key: 'annual',
      label: t('paywall.annual.label'),
      price: t('paywall.annual.price'),
      period: t('paywall.annual.period'),
      priceUsd: t('paywall.annual.priceUsd'),
      perMonth: t('paywall.annual.perMonth'),
      productId: PRODUCT_IDS.annual,
      isBestValue: true,
    },
    {
      key: 'lifetime',
      label: t('paywall.lifetime.label'),
      price: t('paywall.lifetime.price'),
      period: t('paywall.lifetime.period'),
      priceUsd: t('paywall.lifetime.priceUsd'),
      perMonth: t('paywall.lifetime.perMonth'),
      productId: PRODUCT_IDS.lifetime,
    },
  ], [t]);

  useEffect(() => {
    getOfferings().then(setOfferings).catch(() => {});
  }, []);

  const findPackage = useCallback((): PurchasesPackage | undefined => {
    if (!offerings?.current) return undefined;
    const plan = plans.find(p => p.key === selectedPlan);
    if (!plan) return undefined;
    return offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === plan.productId,
    );
  }, [offerings, selectedPlan, plans]);

  const handlePurchase = useCallback(async () => {
    const pkg = findPackage();
    if (!pkg) {
      Alert.alert(
        t('paywall.title'),
        'In-app purchases are not configured yet. Please contact support.',
        [{ text: t('common.ok') }],
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const info = await purchasePackage(pkg);
      if (info) {
        await refresh();
        Alert.alert(t('paywall.successTitle'), t('paywall.successBody'), [
          { text: t('common.ok'), onPress: onSuccess },
        ]);
      }
    } catch {
      Alert.alert(t('common.error'), t('paywall.errorPurchase'), [{ text: t('common.ok') }]);
    } finally {
      setIsPurchasing(false);
    }
  }, [findPackage, refresh, onSuccess, t]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const info = await restorePurchases();
      const hasPlus = !!info.entitlements.active['plus'];
      if (hasPlus) {
        await refresh();
        Alert.alert(t('paywall.successTitle'), t('paywall.successBody'), [
          { text: t('common.ok'), onPress: onSuccess },
        ]);
      } else {
        Alert.alert(t('common.error'), t('paywall.errorRestore'), [{ text: t('common.ok') }]);
      }
    } catch {
      Alert.alert(t('common.error'), t('paywall.errorRestore'), [{ text: t('common.ok') }]);
    } finally {
      setIsRestoring(false);
    }
  }, [refresh, onSuccess, t]);

  return {
    selectedPlan,
    setSelectedPlan,
    offerings,
    isPurchasing,
    isRestoring,
    plans,
    handlePurchase,
    handleRestore,
  };
}
