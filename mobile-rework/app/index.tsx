import { Redirect } from 'expo-router';

// Root of the app. For Sprint 59 smoke-testing we land on the sprint-59 demo
// screen (T279). Real auth-gated routing (→ /(auth)/welcome or /(tabs)) lands
// in a later sprint once authStore + onboarding screens are real.
export default function Index() {
  return <Redirect href="/sprint-59-demo" />;
}
