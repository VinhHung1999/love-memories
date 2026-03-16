---
name: xcode-scheme-preactions-crash
description: Xcode Dev scheme with PreActions ShellScriptExecutionAction crashes Xcode 26.3 on workspace open
type: project
---

Xcode 26.3 crashes (NSInternalInconsistencyException in DVTInvalidExtension) when parsing xcscheme files with PreActions containing ShellScriptExecutionAction (e.g., for copying .env files via react-native-config BuildXCConfig.rb).

**Why:** AI-generated scheme used PreActions format incompatible with newer Xcode. The ActionType identifier is not recognized, causing DVTXMLUnarchiver to crash.

**How to apply:** Never use PreActions in xcscheme for env file copying. Use Build Phase Run Script instead, or handle env selection via xcconfig includes. When generating iOS schemes, test on the actual Xcode version before committing.

**Additional:** When using build flavors (Dev Debug, Dev Release, Prod Debug, Prod Release), xcconfig files must `#include` the flavor-specific Pods configs (e.g., `Pods-LoveScrum.dev debug.xcconfig`) not the generic ones (`Pods-LoveScrum.debug.xcconfig`). CocoaPods generates separate configs per build configuration.

**PBXGroup path bug:** If a PBXGroup has `path = xcconfig`, child PBXFileReference paths are resolved relative to the group. Use just the filename (`path = Dev.debug.xcconfig`), NOT `path = xcconfig/Dev.debug.xcconfig` — the latter causes double path `xcconfig/xcconfig/Dev.debug.xcconfig`. Also add `project` declaration in Podfile mapping custom configs to `:debug`/`:release` so CocoaPods generates xcfilelists for all build configs.
