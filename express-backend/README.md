# Netzero Trees API - Express Backend

A clean, organized Express.js API for managing trees and species data in the Netzero project.

## 📁 Project Structure

```
express-backend/
├── server.js              # Main server file
├── database.js            # Database connection
├── package.json           # Dependencies
├── .env                   # Environment variables
├── config/                # Configuration files
│   ├── aws.js             # AWS S3 configuration
│   └── swagger.js         # Swagger/OpenAPI configuration
├── middleware/            # Express middleware
│   └── logging.js         # Request logging and utilities
└── routes/                # API route handlers
    ├── trees.js           # Tree-related endpoints
    ├── species.js         # Species-related endpoints
    ├── debug.js           # Debug and testing endpoints
    └── versioning.js      # S3 sync and versioning endpoints
```

## 🚀 Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables** (`.env` file):

   ```env
   PORT=8001
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   DATABASE_URL=your_database_url
   ```

3. **Start the server**:

   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Access the API**:
   - API Base: `http://localhost:8001`
   - Swagger Docs: `http://localhost:8001/api-docs`

## 📋 API Endpoints

### Trees

- `GET /trees` - Get all trees with species information
- `PUT /trees/:tree_id/species` - Update tree species identification

### Species

- `GET /species` - Get all available species

### Debug & Testing

- `GET /debug/predictions` - Get prediction statistics and analysis
- `GET /debug/test-s3-access?bucket=BUCKET_NAME` - Test S3 bucket access
- `GET /debug/s3-structure?bucket=BUCKET_NAME&prefix=images2` - List S3 bucket structure

### Versioning

- `POST /versioning/sync-s3?bucket=BUCKET_NAME&dryRun=false` - Sync images in S3 based on predictions

## 🛠️ Architecture

### Clean Separation of Concerns

- **`server.js`**: Main application setup, middleware, and route mounting
- **`config/`**: All configuration logic (AWS, Swagger, etc.)
- **`middleware/`**: Reusable middleware functions
- **`routes/`**: Route handlers organized by feature

### Logging

Comprehensive logging with emojis for easy debugging:

- `log.info()` - General information
- `log.success()` - Success messages
- `log.error()` - Error messages
- `log.warning()` - Warning messages
- `log.debug()` - Debug information
- `log.sync()` - Sync operation logs

### Error Handling

- Request-level error handling with proper HTTP status codes
- Centralized error handling middleware
- Detailed error logging with timestamps

## 🔧 Configuration

### AWS S3

AWS credentials are automatically loaded from environment variables and validated on startup.

### Swagger Documentation

Interactive API documentation is automatically generated and available at `/api-docs`.

### Database

Database connection is handled in `database.js` (configuration depends on your setup).

## 🧪 Testing S3 Integration

1. **Test basic S3 access**:

   ```bash
   curl "http://localhost:8001/debug/test-s3-access?bucket=YOUR_BUCKET_NAME"
   ```

2. **Examine S3 structure**:

   ```bash
   curl "http://localhost:8001/debug/s3-structure?bucket=YOUR_BUCKET_NAME&prefix=images2"
   ```

3. **Dry run S3 sync**:
   ```bash
   curl -X POST "http://localhost:8001/versioning/sync-s3?bucket=YOUR_BUCKET_NAME&dryRun=true"
   ```

## 📊 Monitoring

The server includes comprehensive logging for:

- Request/response times
- Database operations
- S3 operations
- Error tracking
- Sync operations

## 🚀 Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Ensure database is accessible
3. **AWS**: Configure AWS credentials
4. **Port**: Server binds to `0.0.0.0:PORT` for container deployment

## 🔄 Migration from Old Structure

This refactored version maintains all existing functionality while providing:

- Better code organization
- Easier maintenance
- Improved debugging
- Cleaner architecture
- Better error handling

All existing API endpoints and functionality remain unchanged.
