# Onboarding photo credits

All images are from [Unsplash](https://unsplash.com) and used under the
[Unsplash License](https://unsplash.com/license) (free to use, no attribution
required — credits below are courtesy).

Sourced via T297 (Sprint 60) for the Welcome + Intro polaroids.

## Welcome screen (3 polaroids)

| File            | Photo page                                          | Photographer    | CDN ID                                  |
| --------------- | --------------------------------------------------- | --------------- | --------------------------------------- |
| `welcome-1.jpg` | https://unsplash.com/photos/lcRQjHtVb34             | Howen           | `photo-1747020083914-fd8cfa7da44c`      |
| `welcome-2.jpg` | https://unsplash.com/photos/dRhCKvW1XKs             | Klara Kulikova  | `photo-1758712508625-d8e047c49239`      |
| `welcome-3.jpg` | https://unsplash.com/photos/I3DzlSvZEOE             | JETBU           | `photo-1682314012856-bee23e87c39b`      |

## Intro · Moments slide (3 polaroids)

| File                   | Photo page                              | Photographer | CDN ID                              |
| ---------------------- | --------------------------------------- | ------------ | ----------------------------------- |
| `intro-moments-1.jpg`  | https://unsplash.com/photos/F4McD1sKrIg | —            | `photo-1763713512968-fef8805cc6cf`  |
| `intro-moments-2.jpg`  | https://unsplash.com/photos/sCAN9M2uaS0 | Vu Nguyen    | `photo-1647169953827-a7c85f324caf`  |
| `intro-moments-3.jpg`  | (CDN-only, editorial)                   | —            | `photo-1509042239860-f550ce710b93`  |

## CDN URL pattern

```
https://images.unsplash.com/{CDN_ID}?w={W}&h={H}&fit=crop&crop=entropy&q=85&fm=jpg
```

Welcome polaroids served at 372×440. Intro polaroids served at 320×400. Locally
saved variants are downsized JPEGs bundled via `require()`.
