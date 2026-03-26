---
name: RN tab navigation must go through MainTabs
description: Navigating to tab screens from AppStack level requires MainTabs wrapper or it silently fails
type: feedback
---

Always wrap tab screen navigations in MainTabs when calling from AppStack context (e.g. NotificationsScreen, PhotoBooth):

```ts
// WRONG — silently fails from AppStack level
navigation.navigate('MomentsTab', { screen: 'MomentDetail', params: { momentId } });

// CORRECT
navigation.navigate('MainTabs', {
  screen: 'MomentsTab',
  params: { screen: 'MomentDetail', params: { momentId } },
});
```

**Why:** Tab screens (MomentsTab, LettersTab, Dashboard, etc.) are children of MainTabs, not direct children of AppStack. AppStack doesn't know about them directly.

**How to apply:** Any `navigation.navigate()` call targeting a tab screen must go through `MainTabs` first. Direct children of AppStack (NotificationsTab, Paywall, ShareViewer) do NOT need the wrapper.
