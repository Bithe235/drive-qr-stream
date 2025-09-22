# Developer Guide

## Project Overview

This document provides technical documentation for developers working on this QR code video streaming application. The project was developed by Fahad Akash, a professional game developer, cloud engineer, and full-stack developer.

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui with Tailwind CSS
- **State Management**: React hooks and context
- **Routing**: React Router

### Backend
- **Platform**: Appwrite (Backend as a Service)
- **Database**: Appwrite Database
- **Storage**: Multi-tier Appwrite Storage with fallback mechanism
- **Authentication**: Appwrite Authentication (Admin panel access)

### Caching
- **Technology**: IndexedDB
- **Purpose**: Video file caching for improved playback performance
- **Implementation**: Custom caching utility with size and space management

## Key Components

### 1. Video Player (`src/components/VideoPlayer.tsx`)
The core video playback component with the following features:
- Supports Appwrite-hosted videos
- Implements video caching with IndexedDB
- Provides loading state management and error handling
- Includes retry mechanisms for failed loads
- Responsive controls with volume and fullscreen support
- Automatic playback progression for reels-style experience

### 2. Admin Panel (`src/components/AdminPanel.tsx`)
Management interface for uploading and managing videos:
- Video upload with compression
- QR code generation
- Video listing and deletion
- Storage server selection for testing (development only)

### 3. User Panel (`src/components/UserPanel.tsx`)
Public interface for video consumption:
- Reels-style video playback
- QR code display for individual and all videos
- Video queue management
- Theme switching

### 4. Appwrite Integration (`src/lib/appwrite.ts`)
Centralized Appwrite client configuration:
- Multi-tier storage fallback system (6 storage servers)
- Database operations for QR code management
- Video upload and deletion across storage tiers
- Error handling and retry logic

### 5. Video Caching (`src/lib/videoCache.ts`)
IndexedDB-based caching system:
- Video storage and retrieval
- Space management and cleanup
- Cache statistics and debugging

### 6. QR Code Generation (`src/lib/qrGenerator.ts`)
QR code creation and management:
- QR code generation using the qrcode library
- Integration with Appwrite for persistence
- Video URL processing and optimization

## Multi-tier Storage System

The application implements a 6-tier storage fallback system to provide unlimited storage capacity:

1. **Primary Storage**: Main Appwrite project
2. **Fallback 1-6**: Additional Appwrite projects for overflow storage

When uploading a video, the system automatically checks storage availability and uses the appropriate server. This ensures the application can scale indefinitely without storage limits.

## Video Caching Implementation

Videos are cached locally using IndexedDB to improve playback performance:
- Automatic caching of Appwrite-hosted videos
- Cache size management (videos over 500MB are not cached)
- Storage space monitoring (caching disabled when <100MB available)
- Manual cache clearing functionality

## Environment Configuration

The application uses environment variables for configuration:
- Appwrite endpoint, project ID, and keys
- Database and storage bucket IDs
- Storage server configurations for all 6 tiers
- Feature flags (e.g., storage server selection for testing)

## Development Workflow

### Prerequisites
- Node.js (version specified in package.json)
- npm or yarn package manager

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (copy .env.example to .env and update values)
4. Start development server: `npm run dev`

### Building
- Development build: `npm run dev`
- Production build: `npm run build`
- Preview production build: `npm run preview`

## Deployment

The application is configured for deployment on Vercel:
- Static site generation with Vite
- Proper routing configuration
- Environment variable management through Vercel dashboard

## Testing

### Unit Testing
- Component testing with Jest and React Testing Library
- Utility function testing

### Integration Testing
- End-to-end testing with Cypress
- Appwrite integration testing

## Performance Considerations

1. **Video Optimization**
   - Automatic video compression for large files
   - Progressive loading with timeout management
   - Retry mechanisms for failed loads

2. **Caching Strategy**
   - Intelligent cache size management
   - Memory-efficient blob URL handling
   - Cache clearing for troubleshooting

3. **Network Resilience**
   - Extended timeout values for large video files
   - Exponential backoff for retry attempts
   - Error handling for various network conditions

## Troubleshooting

### Common Issues

1. **Video Loading Failures**
   - Check network connectivity
   - Verify Appwrite server availability
   - Clear browser cache and try again
   - Check console for specific error messages

2. **Storage Limit Errors**
   - Ensure all 6 storage servers are properly configured
   - Verify project IDs and API keys
   - Check Appwrite project storage limits

3. **Caching Problems**
   - Check browser IndexedDB support
   - Verify available storage space
   - Clear cache manually through developer tools

### Debugging Tools

1. **Browser Developer Tools**
   - Network tab for request monitoring
   - Console for error messages and logs
   - Application tab for IndexedDB inspection

2. **Appwrite Console**
   - Storage bucket monitoring
   - Database document management
   - Project settings verification

3. **Custom Logging**
   - Video cache debugging logs
   - Appwrite operation logging
   - Performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add appropriate tests
5. Submit a pull request

## Code Standards

- TypeScript for type safety
- ESLint and Prettier for code formatting
- Component-based architecture
- Reusable utility functions
- Comprehensive error handling

## Contact

For questions or support, please contact the original developer:
**Fahad Akash**
- Game Developer
- Cloud Engineer
- Full Stack Developer