# BACKUP - Upgrade Button Design

**Date**: February 17, 2026
**Purpose**: Backup design upgrade button sebelum diubah ke ChatGPT minimalist style

## Original Design State

### UpgradeProButton Component
**Location**: `components/upgrade-pro-button.tsx`

**Current Style**:
```tsx
<Button
  onClick={() => setOpen(true)}
  className="relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
  size="sm"
>
  <CrownIcon className="mr-2 h-4 w-4" />
  <span>Upgrade Plan</span>
</Button>
```

**Visual Characteristics**:
- Background: Gradient (indigo-500 to purple-600)
- Icon: Crown icon di kiri
- Text: "Upgrade Plan" 
- Size: sm
- Style: Colorful, eye-catching, gradient background

## New ChatGPT Minimalist Style

**Spesifikasi Desain Baru**:
1. Background: `bg-transparent` atau `bg-white/5`
2. Border: `border border-white/20`
3. Shape: `rounded-full` (pill shape)
4. Typography: `text-xs font-medium text-gray-300`
5. Padding: `px-3 py-1`
6. Hover: `hover:bg-white/10 hover:text-white transition-colors duration-200`
7. Position: Di sidebar footer, sejajar dengan user info

## Rollback Instructions

Jika perlu rollback ke design original:

1. Gunakan backup ini untuk restore button style yang colorful/gradient
2. Restore implementation di `components/sidebar-user-nav.tsx` 
3. Restore usage di `components/chat-context-header.tsx` jika diubah

## Files Modified
- `components/sidebar-user-nav.tsx` - Add minimalist upgrade button
- `components/upgrade-pro-button.tsx` - Original preserved (dialog content unchanged)
