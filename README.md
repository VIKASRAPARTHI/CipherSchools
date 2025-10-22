# IDE Code Editor

A browser-based React IDE for writing, running, and managing code projects in real-time.

## Features

- **Code Editor**: Write and edit code with syntax highlighting
- **File Management**: Create, rename, and delete files and folders
- **Project Management**: Create, update, and delete projects
- **Export/Import**: Export projects as ZIP files and import them back
- **S3 Storage**: Upload and manage files on AWS S3
- **Real-time Autosave**: Automatic project saving
- **Dark/Light Theme**: Toggle between dark and light modes
- **User Authentication**: Secure login and registration

## Tech Stack

**Frontend:**
- React 19
- React Router 7.5.1
- Tailwind CSS 3.4.17
- Axios for API calls
- Sandpack React for code execution
- shadcn/ui components

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- AWS S3 SDK
- Multer for file uploads
- JSZip for ZIP operations

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- AWS Account (for S3 feature)

### Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file:
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=idecodeeditor
JWT_SECRET=your_jwt_secret
PORT=8001
CORS_ORIGINS=http://localhost:3000
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name
```

Start backend:
```bash
npm start
```

### Frontend Setup

```bash
cd Frontend
npm install
```

Create `.env` file:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

Start frontend:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- **Auth**: `/api/auth/login`, `/api/auth/register`
- **Projects**: `/api/projects` (CRUD operations)
- **Files**: `/api/files` (Create, read, update, delete)
- **Export**: `/api/export` (Export/Import projects as ZIP)
- **S3**: `/api/s3` (Upload, download, manage files)

## License

MIT License

## Support

For issues and questions, please contact the development team.
