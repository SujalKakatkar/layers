# Layer — Interactive Diagram Editor

Layer is a desktop-oriented, canvas-based diagram editor for creating, editing, generating, and sharing interactive diagrams.

The project focuses on building an interactive editing experience around a custom rendering and interaction system rather than relying on a pre-built whiteboard library.

## Features

* Interactive canvas-based diagram editing
* Create and manipulate diagram elements
* Zoom and pan
* Element selection and interaction
* Resize and move elements
* Connect diagram elements
* Text elements
* Undo and redo history
* Copy and paste support
* LayerScript-based diagram generation
* Automatic layout for generated diagram elements
* Separation between manually created and system-generated elements
* Authentication-aware application flow
* Read-only diagram sharing
* Persistent diagrams through the backend API
* Desktop-oriented interface with a minimum viewport requirement

## LayerScript

LayerScript is a lightweight text-based syntax developed for generating diagrams without manually creating every element.

For example:

```text
User => Login
Login => Dashboard
Dashboard => Reports
```

The LayerScript workflow converts the textual definition into diagram elements and relationships, then lays them out on the canvas.

This provides an alternative to manually constructing a diagram and creates a separation between the diagram definition and its visual representation.

## Frontend Architecture

The editor is organized around separate responsibilities for application state, interaction state, element data, and rendering.

### State Separation

Layer distinguishes between two major categories of diagram data.

#### Manual Elements

Manual elements represent objects directly manipulated by the user.

Typical operations include:

* Creating
* Moving
* Resizing
* Selecting
* Deleting
* Copying and pasting

These operations are handled through local editor state and history.

#### Generated Elements

Generated elements are produced by LayerScript and related diagram-generation logic.

They are maintained separately so that generated data and user-driven editing state do not unnecessarily interfere with each other.

### State Management

Zustand is used for shared application state.

The frontend separates responsibilities across:

* Application-level state
* Interaction state
* Diagram element models
* Zustand stores
* Local editor and history state

This structure keeps high-frequency canvas interactions local while keeping shared state centralized where required.

## Rendering and Interaction

The editor uses canvas/SVG-based rendering and custom interaction logic.

The rendering system is responsible for:

* Drawing diagram elements
* Mapping element coordinates to the visible canvas
* Handling zoom and pan
* Selection
* Dragging
* Resizing
* Connections
* Interactive updates

### Coordinate Transformations

Because the editor supports zooming and panning, screen coordinates and diagram/world coordinates cannot always be treated as the same values.

The editor therefore uses coordinate transformations to keep element positioning and interaction consistent as the viewport changes.

This is important for operations such as:

* Selecting an element after zooming
* Dragging elements
* Creating elements at the cursor position
* Positioning connectors
* Maintaining element locations while panning

## Undo and Redo

Undo and redo are handled on the frontend using editor state history.

The basic flow is:

```text
User Action
    |
    v
Editor State Update
    |
    v
History Snapshot
    |
    v
Canvas Re-render
```

Undo moves backward through the stored history, while redo moves forward again.

Keeping this mechanism on the frontend avoids network requests for ordinary editing operations.

## Copy and Paste

Copy and paste operates on selected diagram elements.

When elements are copied, their data can be cloned and assigned new identifiers before being inserted back into the editor state.

This allows duplicated elements to behave as independent diagram objects.

## API Integration

The frontend communicates with the Layer backend through REST APIs.

Axios is used for HTTP communication.

The frontend integrates with backend functionality for areas such as:

* Authentication
* User-specific application data
* Diagram persistence
* Diagram retrieval
* Sharing

Authentication state is used to control access to protected application functionality.

## Desktop-Oriented Design

Layer is designed primarily for larger screens because the editor relies on a large interactive canvas and desktop-style interactions.

When the available viewport becomes too small, the application displays a minimum-screen-size message instead of attempting to provide a degraded editing experience.

## Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Router
* Axios
* Monaco Editor
* React Hook Form
* Zod
* Lucide React
* Base UI / shadcn tooling

## Project Structure

The exact structure may evolve, but the frontend is organized around responsibilities such as:

```text
src/
├── components/       # Reusable UI components
├── features/         # Feature-specific application logic
├── hooks/            # Reusable React hooks
├── store/            # Zustand/global state
├── canvas/           # Canvas/rendering and interaction logic
├── models/           # Diagram element/data definitions
├── utils/             # Utility functions
└── ...
```

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* pnpm
* Git

### Clone the Repository

```bash
git clone https://github.com/SujalKakatkar/layers.git
cd layers
```

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env` file according to the environment variables required by the application.

Do not commit real credentials or secrets to the repository.

### Start the Development Server

```bash
pnpm dev
```

The application will be available at the local Vite development URL shown in the terminal.

### Build for Production

```bash
pnpm build
```

### Preview the Production Build

```bash
pnpm preview
```

### Run Linting

```bash
pnpm lint
```

## Backend

The backend is maintained in a separate repository:

https://github.com/SujalKakatkar/layers-backend

## Live Application

Add the deployed Layer URL here.

## Demo

Add the Google Drive demo video link here.

## Engineering Focus

The main engineering challenges explored in this project include:

* Building an interactive canvas editor
* Handling coordinate transformations
* Managing high-frequency interaction state
* Separating generated and manually edited elements
* Implementing editor history
* Designing a text-to-diagram workflow
* Integrating a custom frontend editor with a REST backend
* Maintaining separation between UI state, interaction state, and persisted data

## Future Improvements

Potential future improvements include:

* Real-time collaboration
* More advanced automatic layout algorithms
* Exporting diagrams to formats such as PNG, SVG, or JSON
* Snap-to-grid and alignment tools
* Additional diagram types
* Plugin and extensibility support

## Author

Sujal Kakatkar

GitHub:
https://github.com/SujalKakatkar
