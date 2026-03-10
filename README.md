# Next.js Frontend Application with Atomic Design

A modern Next.js 16 frontend application built with Atomic Design principles and Tailwind CSS 4.

## Features

- **Atomic Design Architecture**: Components organized into Atoms, Molecules, Organisms, and Templates
- **TypeScript**: Full type safety across the application
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **Backend API Integration**: Pre-configured connection to backend at http://localhost:8081
- **Multiple Layouts**: MainLayout, CenteredLayout, and SidebarLayout templates
- **Sample Pages**: Home, About, and Login pages demonstrating component usage

## Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── page.tsx                  # Home page
│   ├── about/                    # About page
│   └── login/                    # Login page
├── components/
│   ├── atoms/                    # Basic building blocks
│   │   ├── Button.tsx
│   │   ├── Text.tsx
│   │   ├── Heading.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── molecules/                # Simple component combinations
│   │   ├── SearchBar.tsx
│   │   ├── Card.tsx
│   │   ├── Pagination.tsx
│   │   ├── LoginForm.tsx
│   │   └── index.ts
│   ├── organisms/                # Complex components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ItemList.tsx
│   │   ├── AuthSection.tsx
│   │   └── index.ts
│   └── templates/                # Page layouts
│       ├── MainLayout.tsx
│       ├── CenteredLayout.tsx
│       ├── SidebarLayout.tsx
│       └── index.ts
├── lib/                          # Utility functions
│   └── api-client.ts             # API client for backend communication
├── services/                     # Service layer (for future use)
├── hooks/                        # Custom React hooks (for future use)
└── types/                        # TypeScript type definitions
    └── common.ts

```

## Tech Stack

- **Next.js 16**: React framework for production
- **React 19**: UI library
- **TypeScript**: Static type checking
- **Tailwind CSS 4**: Utility-first CSS
- **ESLint**: Code quality

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Environment Configuration

The application is pre-configured to connect to a backend at `http://localhost:8081`. The environment variable is set in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8081
```

You can modify this to point to your actual backend URL.

### Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## Atomic Design Components

### Atoms
Small, reusable building blocks such as buttons, inputs, headings, and text elements.

- `Button`: Customizable button with variants (primary, secondary, danger) and sizes
- `Text`: Paragraph text with different variants (body, caption, small)
- `Heading`: Heading component with 6 levels (h1-h6)
- `Input`: Form input with label and error support

### Molecules
Simple combinations of atoms without their own functionality.

- `SearchBar`: Search input with button
- `Card`: Content container with title and optional action
- `Pagination`: Navigation component with previous/next controls
- `LoginForm`: Login form with email and password inputs

### Organisms
Complex components that combine molecules and atoms with business logic.

- `Header`: Navigation header with title and nav items
- `Footer`: Footer with links and copyright
- `ItemList`: Grid of cards displaying items
- `AuthSection`: Full authentication section with styling

### Templates
Page-level layout components that define the overall structure.

- `MainLayout`: Standard layout with header, main content, and footer
- `CenteredLayout`: Centered layout for login and auth pages
- `SidebarLayout`: Layout with sidebar navigation

## API Integration

The application uses the `apiClient` from `src/lib/api-client.ts` for all backend communication.

### Usage Example

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const data = await apiClient.get('/api/items');

// POST request
const result = await apiClient.post('/api/items', { name: 'Item' });

// PUT request
const updated = await apiClient.put('/api/items/1', { name: 'Updated' });

// DELETE request
const deleted = await apiClient.delete('/api/items/1');
```

When any API call is successful, a console.log message appears confirming the connection to the backend endpoint.

## Pages

- **Home** (`/`): Main page showcasing featured items and search functionality
- **About** (`/about`): Information about the application architecture
- **Login** (`/login`): Authentication page with login form

## Browser Support

This application supports all modern browsers that support ES2020 and CSS Grid/Flexbox.

## License

MIT

## Notes

- All console.log messages for API connections include the endpoint URL without any icons
- The application is fully typed with TypeScript
- Tailwind CSS 4 provides the latest styling features
- The project follows Next.js 16 best practices with the App Router
