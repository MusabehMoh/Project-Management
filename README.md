# Project Management Application (PMA)

A comprehensive project management application built with modern web technologies. This application provides tools for managing projects, tasks, timelines, and team collaboration.

## Features

- 📊 Project management and tracking
- ✅ Task planning and assignment
- 📅 Timeline visualization
- 👥 Team collaboration
- 🔍 Advanced search functionality
- 📱 Responsive design
- 🌐 Multi-language support

## Technologies Used

- [React](https://reactjs.org) - Frontend framework
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- [Vite](https://vitejs.dev/guide/) - Build tool and dev server
- [HeroUI](https://heroui.com) - UI component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Tailwind Variants](https://tailwind-variants.org) - Component variants
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Node.js](https://nodejs.org) - Backend runtime
- [Express.js](https://expressjs.com) - Backend framework

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MusabehMoh/Project-Management.git
cd Project-Management
```

2. Install dependencies:

```bash
npm install
```

3. Install mock API server dependencies:

```bash
cd mock-api-server
npm install
cd ..
```

### Running the Application

1. Start the mock API server (in one terminal):

```bash
cd mock-api-server
npm run dev
```

2. Start the frontend development server (in another terminal):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`
The mock API server will run on `http://localhost:3001`

## Project Structure

```
PMA-main/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── contexts/          # React contexts
│   └── utils/             # Utility functions
├── mock-api-server/       # Backend mock API
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── data/          # Mock data
└── public/                # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Team Collaboration

### Basic Git Workflow

1. Before starting work:
```bash
git pull origin master
```

2. After making changes:
```bash
git add .
git commit -m "Describe your changes"
git push origin master
```

### For Feature Development

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Work on your feature and commit changes
3. Push your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub

## License

Licensed under the [MIT license](LICENSE).
