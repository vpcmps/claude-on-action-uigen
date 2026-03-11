# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with turbopack
- `npm run setup` - Initial setup: install dependencies, generate Prisma client, run migrations

### Build and Test
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest tests

### Database
- `npm run db:reset` - Reset database with force flag
- `npx prisma generate` - Generate Prisma client (outputs to src/generated/prisma)
- `npx prisma migrate dev` - Run database migrations

## Architecture Overview

UIGen is an AI-powered React component generator with live preview capabilities. The application follows a Next.js App Router structure with a virtual file system for component generation.

### Key Architectural Components

**Virtual File System**: Core abstraction in `src/lib/file-system.ts` that manages in-memory files without writing to disk. Integrated with React contexts for state management.

**Context Architecture**:
- `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) - Manages virtual file operations, tool calls from AI
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) - Handles AI chat integration with Vercel AI SDK

**AI Integration**: Uses Anthropic Claude via Vercel AI SDK with tool calling capabilities. AI can manipulate the virtual file system through structured tool calls (str_replace_editor, file_manager).

**Database**: Prisma with SQLite for user authentication and project persistence. Custom output directory: `src/generated/prisma`.

**Preview System**: Components are rendered in real-time using dynamic imports and JSX transformation (`src/lib/transform/jsx-transformer.ts`).

### Project Structure
- `src/actions/` - Server actions for database operations
- `src/components/chat/` - Chat interface components  
- `src/components/editor/` - Code editor and file tree
- `src/components/preview/` - Live preview frame
- `src/lib/tools/` - AI tool implementations (file management, string replacement)
- `src/lib/prompts/` - AI prompt definitions

### Authentication
Optional user authentication with bcrypt password hashing. Anonymous users can work temporarily with localStorage persistence.

### Dependencies
- Next.js 15 with React 19
- Tailwind CSS v4
- Monaco Editor for code editing
- Vercel AI SDK for Claude integration
- Testing with Vitest and React Testing Library

### Environment
Requires Node.js compatibility layer (`node-compat.cjs`) for proper module resolution.
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma\schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.