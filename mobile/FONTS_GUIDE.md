# Be Vietnam Pro - Font Usage Guide

**Font Family:** Be Vietnam Pro
**Designer:** Bùi Huy Hoàng
**License:** SIL Open Font License
**Purpose:** Specifically designed for Vietnamese with excellent diacritics support

---

## Why Be Vietnam Pro?

✅ **Vietnamese-optimized** - Beautiful diacritic rendering
✅ **Youthful & Modern** - Perfect for 22-30yo couples
✅ **Warm & Friendly** - Matches "Companion" brand archetype
✅ **9 weights** - Thin to Black for full flexibility
✅ **Free & Open Source** - No licensing concerns

---

## Font Weights Available

| Weight | File | Tailwind Class | Use For |
|--------|------|----------------|---------|
| 100 | BeVietnamPro-Thin.ttf | - | Decorative only |
| 200 | BeVietnamPro-ExtraLight.ttf | - | Light overlays |
| 300 | BeVietnamPro-Light.ttf | `font-bodyLight` | Secondary text |
| 400 | BeVietnamPro-Regular.ttf | `font-body` | Body text (default) |
| 500 | BeVietnamPro-Medium.ttf | `font-bodyMedium` | Labels, emphasized text |
| 600 | BeVietnamPro-SemiBold.ttf | `font-headingSemi` | Subtitles, section headers |
| 700 | BeVietnamPro-Bold.ttf | `font-heading` | Titles, headers |
| 800 | BeVietnamPro-ExtraBold.ttf | - | Extra emphasis |
| 900 | BeVietnamPro-Black.ttf | - | Hero text only |

---

## Usage Examples

### Tailwind CSS (NativeWind)

```tsx
// Large title
<Text className="text-2xl font-heading text-textDark">
  Khoảnh Khắc Yêu Thương
</Text>

// Subtitle
<Text className="text-sm font-headingSemi text-textMid">
  DAILY QUESTIONS
</Text>

// Body text
<Text className="text-sm font-body text-textDark">
  Hôm nay bạn cảm thấy thế nào về chúng ta?
</Text>

// Emphasized label
<Text className="text-xs font-bodyMedium text-primary">
  My Answer
</Text>

// Secondary text
<Text className="text-xs font-bodyLight text-textLight">
  2 hours ago
</Text>
```

### Direct Style (when Tailwind not available)

```tsx
import { AppTheme } from '../navigation/theme';

<Text style={{
  fontFamily: AppTheme.fonts.heading,  // Bold
  fontSize: 28,
  color: AppTheme.colors.textDark
}}>
  Dashboard
</Text>

<Text style={{
  fontFamily: AppTheme.fonts.body,  // Regular
  fontSize: 14,
  color: AppTheme.colors.textMid
}}>
  Bạn và người ấy đã bên nhau được 365 ngày
</Text>
```

---

## Default Text Styling

All `<Text>` components automatically use **BeVietnamPro-Regular** unless specified otherwise.

To change default:
```tsx
// In your Text components, add className
<Text className="font-body">Default body text</Text>
```

---

## Vietnamese Diacritics Test

The font renders Vietnamese beautifully:

- **Titles:** "Khoảnh Khắc Đáng Nhớ"
- **Questions:** "Điều gì làm bạn hạnh phúc nhất hôm nay?"
- **Labels:** "Người yêu của tôi", "Kỷ niệm chung"
- **Dates:** "Ngày 11 tháng 3 năm 2026"

---

## Migration from Old Fonts

**Before (PlayfairDisplay + Inter):**
```tsx
className="font-heading"  // PlayfairDisplay-Bold
className="font-body"     // Inter-Regular
```

**After (Be Vietnam Pro):**
```tsx
className="font-heading"      // BeVietnamPro-Bold
className="font-headingSemi"  // BeVietnamPro-SemiBold (NEW!)
className="font-body"         // BeVietnamPro-Regular
className="font-bodyMedium"   // BeVietnamPro-Medium (NEW!)
className="font-bodyLight"    // BeVietnamPro-Light (NEW!)
```

---

## Best Practices

1. **Titles & Headers:** Use `font-heading` (Bold 700)
2. **Subtitles:** Use `font-headingSemi` (SemiBold 600)
3. **Body Text:** Use `font-body` (Regular 400) - default
4. **Labels & Tags:** Use `font-bodyMedium` (Medium 500)
5. **Secondary Info:** Use `font-bodyLight` (Light 300)

**Avoid:**
- Don't mix too many weights in one screen (max 3)
- Don't use ExtraBold/Black for body text
- Don't use Thin/ExtraLight for important text

---

## Platform Notes

### iOS
- Fonts auto-linked via `Info.plist` (UIAppFonts)
- Run `cd ios && pod install` after font changes
- Font names: `BeVietnamPro-Regular`, `BeVietnamPro-Bold`, etc.

### Android
- Fonts in `android/app/src/main/assets/fonts/`
- Auto-detected by React Native
- No extra configuration needed

---

## Troubleshooting

**Font not showing:**
1. Clean build: `cd ios && pod install && cd ..`
2. Restart Metro: `npm start -- --reset-cache`
3. Rebuild app: `npm run ios` or `npm run android`

**Diacritics broken:**
- Ensure using `.ttf` files (not `.otf`)
- Verify font file integrity
- Check React Native version (0.76+ recommended)

---

**Last Updated:** 2026-03-11
**Font Version:** Be Vietnam Pro (Google Fonts)
