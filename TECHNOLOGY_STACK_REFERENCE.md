# ICSQ Project Technology Stack Reference

## 🎯 Current Project Overview
The ICSQ project is a sophisticated survey management system with the following features:
- User authentication and role-based access control
- Department management and mapping
- Survey creation and management
- Action plan tracking
- Analytics and reporting
- Admin dashboard with user management

## 🏗️ Architecture Pattern

### Frontend (React + Vite)
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom component library
- **State Management**: React Context API for global state
- **Routing**: React Router v6 with protected routes
- **HTTP Client**: Axios for API communication
- **UI Components**: Custom component library with Radix UI primitives

### Backend (Node.js + Express)
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer for handling file uploads
- **Email**: Nodemailer for email notifications
- **Caching**: Redis for session and data caching
- **Logging**: Custom logging middleware with Winston

## 📁 Project Structure

```
ICSQ/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── assets/        # Static assets
│   │   └── lib/           # Utility functions
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Utility functions
└── docker-compose.yml      # Docker configuration
```

## 🔧 Key Technologies & Libraries

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.15.0",
  "axios": "^1.5.0",
  "framer-motion": "^12.16.0",
  "tailwindcss": "^3.3.3",
  "@radix-ui/react-dialog": "^1.1.14",
  "chart.js": "^4.4.9",
  "react-chartjs-2": "^5.3.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.21.2",
  "mongoose": "^8.8.4",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "multer": "^2.0.0",
  "nodemailer": "^6.9.16",
  "redis": "^4.7.0"
}
```

## 🗄️ Database Schema Design

### User Model
```javascript
{
  username: String,        // Unique username
  email: String,           // Unique email
  password: String,        // Hashed password
  role: String,            // 'user' or 'admin'
  department: ObjectId,    // Reference to Department
  createdAt: Date,
  updatedAt: Date
}
```

### Department Model
```javascript
{
  name: String,            // Department name
  description: String,     // Department description
  manager: ObjectId,       // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

### Survey Model
```javascript
{
  title: String,           // Survey title
  department: ObjectId,    // Reference to Department
  questions: Array,        // Array of question objects
  responses: Array,        // Array of response objects
  status: String,          // 'active', 'inactive', 'completed'
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: ObjectId,        // User ID from database
  role: String,            // User role
  iat: Number,             // Issued at timestamp
  exp: Number              // Expiration timestamp
}
```

### Protected Route Pattern
```javascript
// Middleware for authentication
export const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  // Verify token and attach user to req object
}

// Middleware for admin access
export const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {})
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}
```

## 🎨 UI Component Patterns

### Consistent Card Layout
Based on your preference for consistent, patterned card layouts:
```javascript
// Grid-based card layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Responsive Design
```javascript
// Mobile-first responsive classes
className="
  w-full                    // Full width on mobile
  md:w-1/2                 // Half width on medium screens
  lg:w-1/3                 // One-third width on large screens
  p-4                      // Consistent padding
  rounded-lg               // Consistent border radius
  shadow-md                // Consistent shadow
"
```

## 🚀 Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd ICSQ

# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Development Servers
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 3. Database Setup
```bash
# Ensure MongoDB is running
mongod

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/icsq
```

## 🔍 Common Patterns & Best Practices

### API Response Structure
```javascript
// Success response
{
  success: true,
  data: {...},
  message: "Operation successful"
}

// Error response
{
  success: false,
  error: "Error message",
  details: {...}
}
```

### Error Handling
```javascript
// Frontend error handling
try {
  const response = await axios.post('/api/endpoint', data)
  // Handle success
} catch (error) {
  const message = error.response?.data?.message || 'An error occurred'
  // Handle error
}

// Backend error handling
export const controller = async (req, res) => {
  try {
    // Controller logic
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Controller error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}
```

### Loading States
```javascript
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    // API call
  } finally {
    setLoading(false)
  }
}

// In JSX
{loading ? (
  <div className="animate-spin">Loading...</div>
) : (
  <button>Submit</button>
)}
```

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Development
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/icsq_dev

# Production
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/icsq_prod
JWT_SECRET=your_very_secure_jwt_secret
```

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  client:
    build: ./client
    ports:
      - "3000:3000"
  
  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/icsq
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 📚 Learning Resources

### React & Frontend
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

### Node.js & Backend
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/) for JWT understanding
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Database & MongoDB
- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) for cloud hosting
- [MongoDB Compass](https://www.mongodb.com/products/compass) for GUI

## 💡 Tips for This Project

1. **Consistent UI**: Follow the established card layout patterns
2. **Error Handling**: Always provide user-friendly error messages
3. **Loading States**: Show loading indicators for better UX
4. **Responsive Design**: Test on mobile devices regularly
5. **Code Organization**: Keep components small and focused
6. **API Consistency**: Follow the established response format
7. **Security**: Always validate user input and check permissions

This reference should help you understand the current project structure and continue development effectively! 🚀
