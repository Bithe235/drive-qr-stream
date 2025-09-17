/**
 * Appwrite Initialization Script for Drive QR Stream
 * 
 * This script initializes the Appwrite backend for the Drive QR Stream project.
 * It creates the necessary database, collection, and storage bucket if they don't exist.
 */

const { Client, Databases, Storage, ID } = require('appwrite');

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'drive-qr-stream';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'your-appwrite-api-key';

// Database and collection configuration
const DATABASE_ID = 'qrcode-db';
const COLLECTION_ID = 'qrcode';
const BUCKET_ID = 'videos';

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

/**
 * Initialize the Appwrite database and collection
 */
async function initDatabase() {
    try {
        // Check if database exists
        try {
            await databases.get(DATABASE_ID);
            console.log(`Database '${DATABASE_ID}' already exists`);
        } catch (error) {
            // Database doesn't exist, create it
            console.log(`Creating database '${DATABASE_ID}'...`);
            await databases.create(DATABASE_ID, 'QR Code Database');
            console.log(`Database '${DATABASE_ID}' created successfully`);
        }

        // Check if collection exists
        try {
            await databases.getCollection(DATABASE_ID, COLLECTION_ID);
            console.log(`Collection '${COLLECTION_ID}' already exists`);
        } catch (error) {
            // Collection doesn't exist, create it
            console.log(`Creating collection '${COLLECTION_ID}'...`);
            await databases.createCollection(
                DATABASE_ID,
                COLLECTION_ID,
                'QR Codes'
            );
            console.log(`Collection '${COLLECTION_ID}' created successfully`);

            // Create attributes for the collection
            console.log('Creating collection attributes...');
            await databases.createStringAttribute(
                DATABASE_ID,
                COLLECTION_ID,
                'title',
                255,
                true
            );

            await databases.createStringAttribute(
                DATABASE_ID,
                COLLECTION_ID,
                'url',
                1000,
                true
            );

            await databases.createStringAttribute(
                DATABASE_ID,
                COLLECTION_ID,
                'qrCodeDataUrl',
                5000,
                true
            );

            await databases.createDateTimeAttribute(
                DATABASE_ID,
                COLLECTION_ID,
                'createdAt',
                true
            );

            console.log('Collection attributes created successfully');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

/**
 * Initialize the Appwrite storage bucket
 */
async function initStorage() {
    try {
        // Check if bucket exists
        try {
            await storage.getBucket(BUCKET_ID);
            console.log(`Storage bucket '${BUCKET_ID}' already exists`);
        } catch (error) {
            // Bucket doesn't exist, create it
            console.log(`Creating storage bucket '${BUCKET_ID}'...`);
            await storage.createBucket(
                BUCKET_ID,
                'Videos',
                [
                    'read("any")',
                    'write("any")',
                    'create("any")',
                    'update("any")',
                    'delete("any")'
                ],
                true,
                true,
                30000000, // 30MB max file size
                ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm']
            );
            console.log(`Storage bucket '${BUCKET_ID}' created successfully`);
        }
    } catch (error) {
        console.error('Error initializing storage:', error);
        throw error;
    }
}

/**
 * Main initialization function
 */
async function init() {
    console.log('Initializing Appwrite for Drive QR Stream...');
    
    try {
        await initDatabase();
        await initStorage();
        
        console.log('Appwrite initialization completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update your .env file with the Appwrite configuration');
        console.log('2. Configure Google Cloud Storage integration');
        console.log('3. Start the frontend application with "npm run dev"');
    } catch (error) {
        console.error('Appwrite initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization if this script is executed directly
if (require.main === module) {
    init();
}

module.exports = {
    initDatabase,
    initStorage,
    init
};