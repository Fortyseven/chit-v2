# Codebase Structure & Chat Process Overview

## Project Architecture

### Root Structure
```
/desktop          # Electron shell application
/src             # Main Svelte application
  /app           # Svelte components
  /lib           # Utilities and core logic
/public          # Static assets for Svelte app
```

### Technology Stack
- **Frontend**: Svelte with TypeScript
- **Desktop**: Electron wrapper
- **Build**: Vite
- **Styling**: SCSS
- **State Management**: Svelte stores

## Core Application Structure

### `/src/app` - UI Components
```
/Chat
  /Timeline
    /Regular
      ChatLogRegular.svelte           # Main chat timeline
      ChatLogRegular_User.svelte      # User message display
      ChatLogRegular_Assistant.svelte # AI response display
      ChatLogRegular_ReferencesInUse.svelte # Active references
      FloatingImage.svelte            # Expandable image viewer
```

### `/src/lib` - Core Logic
```
/appState         # Global application state
/chatSession      # Chat management and state
  chatActions.ts  # Chat operations (streaming, etc.)
  chatAttachments.ts # Media handling
  chatSession.ts  # Chat store and state
/memoizeBlob.ts   # Blob URL caching utility
```

## Chat Process Flow

### 1. Chat State Management
- **Store**: `chats` - Array of all chat sessions
- **Store**: `currentChat` - Currently active chat
- **Store**: `appState.activeChatId` - ID of active chat

### 2. Message Structure
```typescript
interface Message {
  role: "user" | "assistant" | "system"
  content: string
  thoughts?: string        // AI internal reasoning
  media?: MediaAttachment[] // Images, text files, etc.
}
```

### 3. Chat Timeline Rendering

#### User Messages (`ChatLogRegular_User`)
- Text content display
- Media attachments (images, text files)
- Reference indicators for most recent message

#### Assistant Messages (`ChatLogRegular_Assistant`)
- Thoughts display (internal AI reasoning)
- Response content
- Inline editing capabilities
- Streaming support for real-time responses

### 4. Media Handling
- **Types**: Images (`ChatMediaType.IMAGE`), Text files (`ChatMediaType.TEXT`)
- **Storage**: Blob data with memoized URLs for performance
- **Display**: Inline thumbnails with floating overlay option
- **Interaction**: Click to expand images in floating viewer

### 5. Streaming Process
1. User submits message → added to chat messages
2. `chatInProgressWithId()` tracks active streaming
3. `chatGetStreamingPending()` provides real-time content
4. Stream completes → final message replaces pending content

### 6. Message Updates
- **Function**: `updateChatMessage(index, message)`
- **Process**: Immutable updates to chat store
- **Trigger**: User edits, streaming completion, etc.

## Key Features

### Real-time Streaming
- Live AI response display during generation
- Pending state management
- Seamless transition from streaming to final content

### Media Attachments
- Image upload and display
- Text file attachment
- Expandable floating image viewer
- Blob URL memoization for performance

### Message Management
- Inline editing of AI responses
- Immutable state updates
- Message indexing and identification

### References System
- Active reference display for recent user messages
- Context-aware reference management

## Data Flow

### Message Creation
```
User Input → Media Processing → Message Object → Chat Store Update → UI Render
```

### Streaming Response
```
API Call → Stream Start → Real-time Updates → Stream Complete → Final Message
```

### Media Display
```
Blob Data → Memoized URL → Component Render → User Interaction → Floating Display
```

## State Management Pattern

### Svelte Stores
- **Reactive**: Automatic UI updates on state changes
- **Immutable**: State updates create new objects
- **Centralized**: Core state in `/lib` modules

### Update Pattern
```typescript
store.update(current => ({
  ...current,
  // modifications
}))
```

## Component Communication

### Props Down
- Parent components pass data via props
- Media data, message content, indices

### Events Up
- Child components emit events for updates
- `onUpdatedContent` for message edits
- Custom events for floating image management

### Store Subscription
- Components subscribe to relevant stores
- Automatic reactivity on state changes

## Performance Considerations

### Memoization
- Blob URLs cached to prevent recreation
- `memoizeBlobUrl()` utility for efficient media handling

### Virtual Scrolling
- Timeline handles large message histories
- Efficient rendering of message components

### Event Cleanup
- Proper event listener cleanup in `onMount`
- Memory leak prevention

## Development Guidelines

### Component Responsibilities
- **Single Purpose**: Each component has clear responsibility
- **Prop Interfaces**: Well-defined data contracts
- **Event Handling**: Consistent event patterns

### State Updates
- **Immutable**: Always create new state objects
- **Predictable**: Clear update patterns
- **Reactive**: Leverage Svelte's reactivity system

### Error Handling
- Promise error handling with `.catch` or `try-catch`
- Clear error messages for debugging
- Graceful degradation for media loading
