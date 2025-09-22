# Welcome to your Lovable project

## Project Overview

This is a QR code video streaming application that allows users to upload videos, generate QR codes for access, and play videos in a reels-style interface. The application features multi-tier storage fallback, video caching, and optimized video playback.

## Developer Information

**Fahad Akash**
- Game Developer
- Cloud Engineer
- Full Stack Developer

A professional developer with expertise in game development, cloud infrastructure, and full-stack web applications. Specializes in creating scalable, high-performance applications with robust architecture and optimized user experiences.

## Project info

**URL**: https://lovable.dev/projects/c7614956-e28f-492c-ae78-7b370ae07254

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c7614956-e28f-492c-ae78-7b370ae07254) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Appwrite (Backend as a Service)
- QR Code generation
- IndexedDB for video caching

## Key Features

1. **Multi-tier Storage Fallback**: Videos are stored across multiple Appwrite projects to provide unlimited storage capacity.
2. **Video Caching**: Implements IndexedDB caching for improved playback performance.
3. **QR Code Generation**: Automatically generates scannable QR codes for video access.
4. **Reels-style Interface**: Mobile-optimized video player with automatic playback progression.
5. **Admin Panel**: Secure interface for uploading and managing videos.
6. **Responsive Design**: Works seamlessly across desktop and mobile devices.

## Architecture Overview

The application follows a modern React architecture with TypeScript for type safety. Key components include:

- **Frontend**: React with Vite, Tailwind CSS, and shadcn-ui components
- **Backend**: Appwrite for database, authentication, and file storage
- **Storage**: Multi-tier Appwrite storage system with automatic fallback
- **Caching**: IndexedDB implementation for efficient video caching
- **Deployment**: Vercel hosting with optimized configuration

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c7614956-e28f-492c-ae78-7b370ae07254) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)