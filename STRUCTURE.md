# Application structure

## Top level

### /src/stores/appState.svelte
- `/appState` non-persistent application state (e.g. locks, selected presets, etc)

- `/configPersistState` contains app state that needs to persist between reloads, such as configuration settings (API endpoint, etc)

### /src/stores/chatState.svelte

- `/convos` - reactive $state containing an instance of `Convos` class

#### Convos (class)
- `entries`:array a reactive array of `ChatSession` objects

    #### ChatSession (class)
    Describes a full chat session, including title, timeline, chat settings

    - `chat_id`:$str - unique id
    - `title:$str - generated title summarizing the conversation
    - `chatState`:ChatState

        #### ChatState (class)
        Manages an array of system/user/assistant `ChatMessageEntry` messages

            #### ChatMessageEntry (class)
            Holds the message text and it's source role
