# 🧩 Layers — Interactive Whiteboard Engine

Layers is a high-performance, scalable whiteboard application designed for creating, managing, and rendering diagrams with a clean separation between user-driven interactions and system-generated elements.

This project focuses on **architecture, performance, and extensibility**, making it suitable for real-world collaborative tools (even though collaboration is not yet implemented).

---

## 🚀 Features

- ✏️ Draw and manipulate shapes (rectangles, arrows, etc.)
- 🧠 Smart separation of manual vs generated elements
- ⚡ Optimized rendering with minimal re-renders
- 🗂️ Undo / Redo system (frontend state-based)
- 📋 Copy / Paste support
- 🎯 Precise interaction handling (selection, drag, resize)
- 🧩 Scalable state architecture using Zustand
- 🔐 Authentication-ready backend structure

---

## 🏗️ Architecture Overview

### 1. State Separation (Core Design Principle)

The system is built around a strict separation:

#### 🔹 Manual Shapes (User Driven)
- Stored in: `useShapes` (local state / history)
- Includes:
  - Drawing
  - Moving
  - Resizing
  - Deleting

#### 🔹 Generated Shapes (System Driven)
- Stored in: `useDiagramStore` (global Zustand store)
- Includes:
  - Derived elements
  - Computed layouts
  - Auto-generated connections

👉 This separation ensures:
- Better performance
- Clear debugging
- Future scalability (AI, auto-layout, etc.)

---

### 2. State Layers

| Layer              | Responsibility                          |
|-------------------|----------------------------------------|
| AppState          | Global application-level data           |
| InteractionState  | Current user interaction (drag, select)|
| Element Model     | Shape definitions & structure           |
| Zustand Store     | Global shared state                    |
| Local State       | Undo/Redo history                      |

---

### 3. Interaction Flow

1. User performs an action (draw, move, resize)
2. InteractionState updates
3. Local state (`useShapes`) updates
4. Render cycle reflects changes
5. Optional: generated shapes update in global store

---

## 🔁 Undo / Redo System

- Fully handled on the **frontend**
- Based on **state snapshots**
- No backend involvement

### How it works:
- Every action pushes a new state into history
- Undo → move backward in history
- Redo → move forward in history

👉 Fast and predictable because:
- No network calls
- Pure state transitions

---

## 📋 Copy / Paste

- Operates on selected shapes
- Clones shape data with new IDs
- Inserted into local state (`useShapes`)

---

## 🌐 Backend Responsibilities (Planned / Partial)

### Backend Handles:
- User authentication (JWT-based)
- Storing diagrams (MongoDB)
- Sharing diagrams via link (view-only)
- Persisting canvas state

### Frontend Handles:
- Rendering engine
- All interactions
- Undo/Redo
- Copy/Paste
- Temporary state management

👉 Current focus: **Frontend architecture first, backend minimal**

---

## 🧰 Tech Stack

### Frontend
- React (Vite)
- Zustand (state management)
- Tailwind CSS
- Canvas / SVG rendering

### Backend (Planned / Partial)
- Node.js
- Express
- MongoDB
- JWT Authentication

---

## 📁 Project Structure (Conceptual)
src/
├── components/ # UI components
├── canvas/ # Rendering logic
├── store/ # Zustand stores
├── hooks/ # useShapes, interactions
├── models/ # Element definitions
├── utils/ # Helpers
└── features/ # Core features (copy, undo, etc.)


---

## ⚡ Performance Considerations

- Separation of concerns reduces unnecessary re-renders
- Local state for high-frequency updates
- Global store only for shared/generated data
- Lazy updates where possible

---

## 🔮 Future Improvements

- 🔗 Real-time collaboration
- 🧠 AI-assisted diagram generation
- 📦 Export (PNG, SVG, JSON)
- 📌 Snap-to-grid and alignment tools
- 🧩 Plugin system

---

## 🧑‍💻 Getting Started

```bash
git clone https://github.com/your-username/layers.git
cd layers
npm install
npm run dev
