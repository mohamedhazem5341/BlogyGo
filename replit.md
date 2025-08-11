# Overview

This is a vanilla HTML/CSS/JavaScript blog application with a Node.js backend. The system provides a complete content management platform featuring dynamic topic creation, category-based organization, and an admin panel for content management. The blog uses a file-based JSON storage system for data persistence and generates dynamic pages for topics and categories.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Pure vanilla approach**: Uses vanilla HTML, CSS, and JavaScript without any frontend frameworks
- **Static file serving**: Express serves static HTML files and assets from the `public` and `posts` directories
- **Client-side routing**: Dynamic page generation handled through JavaScript with API calls to the backend
- **Responsive design**: Mobile-first CSS approach with grid layouts and media queries

## Backend Architecture  
- **Express.js server**: Lightweight Node.js web server handling API routes and static file serving
- **RESTful API design**: JSON endpoints for data operations (`/api/data`, etc.)
- **File-based storage**: Uses JSON files for data persistence instead of a traditional database
- **Auto-initialization**: Server ensures required data files exist on startup

## Data Storage
- **JSON file system**: Categories and topics stored in `categories.json` file
- **File-based persistence**: No database required - all data stored as structured JSON files
- **Auto-creation**: Data files are created automatically if they don't exist during server startup

## Content Management
- **Dynamic topic creation**: Topics can be created through the admin panel with category assignment
- **Category management**: Add and organize content categories dynamically
- **Admin interface**: Complete content management system accessible via `/admin` route

## Application Structure
- **Multi-page application**: Separate HTML files for home, categories, and admin functionality
- **Shared styling**: Common CSS file used across all pages for consistent design
- **Modular JavaScript**: Utility functions in `main.js` for notifications, date formatting, and UI interactions

# External Dependencies

## Core Dependencies
- **Express.js (^5.1.0)**: Web application framework for Node.js serving as the backend server

## Built-in Node.js Modules
- **fs**: File system operations for reading/writing JSON data files
- **path**: File path utilities for serving static files and managing routes

## No External Services
- The application is completely self-contained with no external API integrations or third-party services
- No database connections required - uses local file storage
- No authentication services or user management systems implemented