# BACKUP - Original Design State

**Date**: February 17, 2026
**Purpose**: Backup untuk rollback jika design baru tidak sesuai

## Original Files Structure

### 1. components/chat-header.tsx
- **Location**: Top of chat area (sticky)
- **Content**:
  - Left: VisibilitySelector (Private/Public) + ChatExportButton
  - Right: UpgradeProButton
- **Usage**: Imported di chat.tsx

### 2. components/greeting.tsx
- **Text**: "Halo, {username}!" dan "Apa yang bisa saya bantu hari ini?"

### 3. components/multimodal-input.tsx
- **Placeholder**: "Send a message..."

### 4. app/(chat)/layout.tsx
- **Structure**: SidebarProvider > AppSidebar + MainContentWrapper
- **No global header**: Header saat ini ada di dalam chat content

## Rollback Instructions

Jika perlu rollback ke design original:

1. Restore `chat-header.tsx` dengan content:
   - VisibilitySelector + ChatExportButton di kiri
   - UpgradeProButton di kanan

2. Restore `greeting.tsx` text:
   - "Halo, {username}!"  
   - "Apa yang bisa saya bantu hari ini?"

3. Restore `multimodal-input.tsx` placeholder:
   - "Send a message..."

4. Delete new components:
   - `global-header.tsx` (if created)
   - `chat-context-header.tsx` (if created)

5. Revert chat.tsx to use original ChatHeader

## Files to Watch
- components/chat-header.tsx
- components/chat.tsx  
- components/greeting.tsx
- components/multimodal-input.tsx
- app/(chat)/layout.tsx
