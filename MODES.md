# Application Modes Documentation

This document describes how the application mode system works and how to use it in your components.

## Overview

The application supports multiple modes that allow for different UI layouts and behaviors. Currently, there are two modes:

- **DEFAULT**: Standard chat mode with general-purpose features
- **RP**: Role-playing mode with UI elements optimized for character interactions

## Important: Per-Session State

**The mode is stored per chat session**, not globally. This means:
- Each chat session can have its own mode
- When you switch between chat sessions, the mode will change to match that session's mode
- New chat sessions default to DEFAULT mode

## Using Modes in Components

### Import the necessary utilities

```typescript
import { AppMode, currentChatMode } from "path/to/lib/chatSession/chatSession"
import { chatSetCurrentMode } from "path/to/lib/chatSession/chatActions"
```

### React to mode changes

```svelte
<script>
    import { AppMode, currentChatMode } from "../../lib/chatSession/chatSession"

    // Reactive statement that updates when mode changes
    $: isRPMode = $currentChatMode === AppMode.RP
</script>

<!-- Conditional rendering based on mode -->
{#if isRPMode}
    <div class="rp-specific-content">
        <!-- RP mode UI elements -->
    </div>
{:else}
    <div class="default-content">
        <!-- Default mode UI elements -->
    </div>
{/if}

<!-- CSS classes based on mode -->
<div class="container" class:rp-mode={isRPMode}>
    <!-- Content that styles differently in RP mode -->
</div>
```

### Change the mode programmatically

```typescript
import { chatSetCurrentMode } from "path/to/lib/chatSession/chatActions"
import { AppMode } from "path/to/lib/chatSession/chatSession"

function switchToRPMode() {
    chatSetCurrentMode(AppMode.RP)
}

function switchToDefaultMode() {
    chatSetCurrentMode(AppMode.DEFAULT)
}
```

### Using the utility functions

```typescript
import { isRPMode, isDefaultMode, setCurrentMode } from "path/to/lib/modes/modeUtils"

// Check current mode
if (isRPMode()) {
    console.log("We're in RP mode!")
}

// Change mode
setCurrentMode(AppMode.RP)
```

## Adding New Modes

To add a new mode:

1. Add it to the `AppMode` enum in `/src/lib/chatSession/chatSession.ts`
2. Update the `getModeDisplayName` function in the ModeSelector component
3. Add any mode-specific styling or behavior to your components

## Components that React to Modes

- **ModeSelector**: Dropdown in the status bar to switch between modes
- **App.svelte**: Root-level styling changes based on mode
- **ModeIndicator**: Visual indicator showing current mode in the chat header

## Styling Conventions

Use CSS classes with the `rp-mode` suffix for RP-specific styling:

```scss
.my-component {
    background: var(--default-bg);

    &.rp-mode {
        background: var(--rp-bg);
        border-left: 3px solid var(--color-accent-complement);
    }
}
```

## Future Considerations

- Consider adding mode-specific keyboard shortcuts
- Add mode-specific presets or configurations
- Consider mode-specific chat templates or system prompts
- Add mode-specific input commands or tools