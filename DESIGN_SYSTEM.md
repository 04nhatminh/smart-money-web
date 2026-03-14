# 🎨 Design System Documentation

This document explains the design system setup for the project, including i18n, theming, and component usage.

## 📋 Table of Contents

1. [Internationalization (i18n)](#internationalization-i18n)
2. [Theme & Colors](#theme--colors)
3. [Component System](#component-system)
4. [Usage Examples](#usage-examples)

---

## 📍 Internationalization (i18n)

### Setup

The project uses `next-intl` for multi-language support with **English (EN)** and **Vietnamese (VI)**.

### Translation Files

- Location: `/messages/`
  - `en.json` - English translations
  - `vi.json` - Vietnamese translations

### Using Translations in Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('common.home')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### Supported Locales

- `en` - English
- `vi` - Vietnamese

URLs will automatically support both locales:
- `/en/...` - English version
- `/vi/...` - Vietnamese version

---

## 🎨 Theme & Colors

### Two-Tone Theme System

The project supports both **Light** and **Dark** themes with comprehensive color definitions for each.

### Color Categories

1. **Background Colors** - Page and section backgrounds
2. **Text Colors** - Primary, secondary, tertiary text
3. **Surface Colors** - Elevated component backgrounds
4. **Interactive Colors** - Buttons, links, UI interactions
5. **State Colors** - Hover, active, disabled states
6. **Border Colors** - Component borders

### Using Theme Colors in Components

```tsx
'use client';

import { useTheme } from '@/context';

export function MyCard() {
  const { colors, colorScheme } = useTheme();
  
  return (
    <div
      style={{
        backgroundColor: colors.surface.primary,
        color: colors.text.primary,
        borderColor: colors.border.light,
      }}
    >
      {colorScheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </div>
  );
}
```

### Theme Colors Object Structure

#### Light Theme (`LIGHT_COLORS`)
- 🟡 Bright, minimal contrast shadows
- Light backgrounds with dark text
- Optimized for daytime use

#### Dark Theme (`DARK_COLORS`)
- 🌙 Strong, visible shadows
- Dark backgrounds with light text
- Optimized for nighttime use

### Toggling Theme

```tsx
'use client';

import { useTheme } from '@/context';

export function ThemeToggle() {
  const { toggleColorScheme, colorScheme } = useTheme();
  
  return (
    <button onClick={toggleColorScheme}>
      Current: {colorScheme} | Click to toggle
    </button>
  );
}
```

---

## 🧩 Component System

### Design Philosophy

All components follow these principles:

✨ **Elevation Through Shadows** - Components appear to float above the background
🎯 **Rounded Corners** - All components have soft, rounded corners (never sharp)
🎨 **Theme-Aware** - Components automatically adapt to light/dark themes
🔄 **Smooth Transitions** - Seamless animations and state changes

### Available Constants

#### Border Radius
```typescript
import { BORDER_RADIUS } from '@/constants';

BORDER_RADIUS.sm    // 4px
BORDER_RADIUS.md    // 6px
BORDER_RADIUS.lg    // 8px
BORDER_RADIUS.xl    // 12px
BORDER_RADIUS['2xl'] // 16px
BORDER_RADIUS.full  // Fully rounded
```

#### Shadows (Elevation)
```typescript
import { SHADOWS } from '@/constants';

SHADOWS.sm  // Subtle shadow (small elevation)
SHADOWS.md  // Medium shadow
SHADOWS.lg  // Large shadow
SHADOWS.xl  // Extra large shadow
SHADOWS['2xl'] // Maximum shadow
```

#### Spacing
```typescript
import { SPACING } from '@/constants';

SPACING.xs  // 4px
SPACING.sm  // 8px
SPACING.md  // 16px
SPACING.lg  // 24px
SPACING.xl  // 32px
SPACING['2xl'] // 48px
```

#### Typography
```typescript
import { FONT_SIZES, FONT_WEIGHTS } from '@/constants';

FONT_SIZES.sm      // 14px
FONT_SIZES.md      // 16px
FONT_SIZES.lg      // 18px
FONT_SIZES.xl      // 20px

FONT_WEIGHTS.normal // 400
FONT_WEIGHTS.medium // 500
FONT_WEIGHTS.bold   // 700
```

### Atom Components

#### Button Component

```tsx
import { Button } from '@/components/atoms';

// Default primary button
<Button>Click me</Button>

// Different variants
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Confirm</Button>
<Button variant="info">Info</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button> {/* default */}
<Button size="lg">Large</Button>

// Different elevation levels
<Button elevation="sm">Subtle</Button>
<Button elevation="md">Normal</Button> {/* default */}
<Button elevation="lg">Prominent</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

**Features:**
- ✅ Theme-aware colors
- ✅ Elevation shadows for depth
- ✅ Rounded corners (xl = 12px)
- ✅ Smooth transitions
- ✅ Focus ring states

---

#### Input Component

```tsx
import { Input } from '@/components/atoms';

// Basic input
<Input placeholder="Enter text..." />

// With label
<Input label="Email Address" type="email" />

// With error
<Input 
  label="Password"
  type="password"
  error="Password is required"
/>

// Custom elevation
<Input elevation="md" placeholder="Elevated input" />
```

**Features:**
- ✅ Theme-aware background and text
- ✅ Automatic border color change on error
- ✅ Elevation shadow for depth
- ✅ Rounded corners (lg = 8px)
- ✅ Smooth focus transitions

---

#### Text Component

```tsx
import { Text } from '@/components/atoms';

// Default body text
<Text>This is normal text</Text>

// Different variants
<Text variant="body">Default text - 16px</Text>
<Text variant="caption">Smaller caption - 14px</Text>
<Text variant="small">Tiny text - 12px</Text>
<Text variant="code">Code block</Text>

// Different weights
<Text weight="light">Light text</Text>
<Text weight="normal">Normal text</Text>
<Text weight="medium">Medium text</Text>
<Text weight="semibold">Semibold text</Text>
<Text weight="bold">Bold text</Text>

// Combined
<Text variant="caption" weight="bold">Bold caption</Text>
```

**Features:**
- ✅ Theme-aware colors
- ✅ Multiple variants for hierarchy
- ✅ Font weight control
- ✅ Code variant with background

---

#### Heading Component

```tsx
import { Heading } from '@/components/atoms';

// Different heading levels
<Heading level={1}>Main Heading</Heading>
<Heading level={2}>Subheading</Heading>
<Heading level={3}>Section Title</Heading>
<Heading level={4}>Subsection</Heading>
<Heading level={5}>Minor Heading</Heading>
<Heading level={6}>Minimal Heading</Heading>
```

**Features:**
- ✅ Theme-aware colors
- ✅ Semantic HTML (h1-h6)
- ✅ Automatic font sizing
- ✅ Consistent line height

---

## 💡 Usage Examples

### Complete Page Example

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '@/context';
import { Button, Heading, Text, Input } from '@/components/atoms';

export default function HomePage() {
  const t = useTranslations();
  const { colors, toggleColorScheme } = useTheme();

  return (
    <main
      style={{
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
      }}
      className="min-h-screen p-8"
    >
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-8">
        <Heading level={1}>{t('common.home')}</Heading>
        <Button onClick={toggleColorScheme}>
          {t('common.theme')}
        </Button>
      </div>

      {/* Form section */}
      <div className="space-y-4 max-w-md">
        <Input label={t('auth.email')} type="email" />
        <Input label={t('auth.password')} type="password" />
        
        <Button variant="primary" className="w-full">
          {t('auth.login')}
        </Button>
      </div>

      {/* Text content */}
      <section className="mt-12 space-y-3">
        <Heading level={2}>{t('common.about')}</Heading>
        <Text>
          This is a modern web application with full i18n and theme support.
        </Text>
      </section>
    </main>
  );
}
```

### Using Custom Theme Hook

```tsx
'use client';

import { useThemeColors, getElevationShadow } from '@/hooks';

export function CustomCard() {
  const { colors, isDark } = useThemeColors();

  return (
    <div
      style={{
        backgroundColor: colors.surface.primary,
        color: colors.text.primary,
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: getElevationShadow(3),
      }}
    >
      {isDark ? '🌙' : '☀️'}
      <h3>Custom styled card</h3>
      <p>Adapts to theme automatically!</p>
    </div>
  );
}
```

---

## 📚 Best Practices

### ✅ Do's

- Use theme colors from `useTheme()` for all styled elements
- Use defined constants for spacing, shadows, and border radius
- Wrap theme-dependent components with `'use client'`
- Use translations for all user-facing text
- Test components in both light and dark modes

### ❌ Don'ts

- Don't hardcode colors (always use theme colors)
- Don't use arbitrary shadow/border-radius values
- Don't forget to use `'use client'` in client components
- Don't forget translation keys for new UI text

---

## 🎯 Next Steps

1. Create more molecule components using the atoms
2. Create organism components combining molecules
3. Build templates using organisms
4. Create page-specific layouts

Remember: **Keep components theme-aware and use elevation with shadows for depth!**
