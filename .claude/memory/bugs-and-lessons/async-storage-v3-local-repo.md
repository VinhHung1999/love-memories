---
name: async-storage v3 Android local_repo
description: async-storage v3 needs local Maven repo added to allprojects in build.gradle for shared_storage module
type: project
---

`@react-native-async-storage/async-storage` v3 ships `org.asyncstorage.shared_storage:storage-android:1.0.0` as a local Maven artifact in `android/local_repo/`. Gradle can't resolve it from remote repos.

**Fix:** Add to `android/build.gradle` `allprojects.repositories` (NOT settings.gradle — RN autolinked projects ignore settings repos):
```gradle
maven {
    url "${rootProject.projectDir}/../node_modules/@react-native-async-storage/async-storage/android/local_repo"
}
```

**Why:** `dependencyResolutionManagement` in settings.gradle is overridden by project-level repos for autolinked RN libraries. Adding to settings.gradle or editing node_modules build.gradle both fail.

**How to apply:** When upgrading async-storage to v3+ or encountering `Could not find org.asyncstorage.shared_storage:storage-android` error.
