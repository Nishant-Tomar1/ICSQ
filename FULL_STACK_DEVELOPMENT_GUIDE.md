# Full-Stack Development Guide: React + Node.js + MongoDB

## 🎯 Project Overview
This guide will teach you how to build a complete full-stack web application using:
- **Frontend**: React with Vite, Tailwind CSS, and modern UI components
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with role-based access control

## 📋 Prerequisites
- Node.js (v16 or higher)
- MongoDB installed locally or MongoDB Atlas account
- Git for version control
- VS Code or similar editor
- Basic JavaScript, HTML, and CSS knowledge

## 🚀 Step 1: Project Setup

### 1.1 Create Project Structure
```bash
mkdir my-fullstack-app
cd my-fullstack-app
mkdir client server
```

### 1.2 Initialize Git
```bash
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
```

## 🎨 Step 2: Frontend Setup (React + Vite)

### 2.1 Create React App
```bash
cd client
npm create vite@latest . -- --template react
npm install
```

### 2.2 Install Dependencies
```bash
npm install react-router-dom axios framer-motion
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.3 Configure Tailwind CSS
Update `tailwind.config.js`:
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## ⚙️ Step 3: Backend Setup (Node.js + Express)

### 3.1 Initialize Backend
```bash
cd ../server
npm init -y
npm install express mongoose cors dotenv bcrypt jsonwebtoken
npm install -D nodemon
```

### 3.2 Create Basic Server
Create `src/index.js`:
```javascript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
```

### 3.3 Environment Setup
Create `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your_jwt_secret_key
```

## 🗄️ Step 4: Database Models

### 4.1 Create User Model
Create `src/models/User.model.js`:
```javascript
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)
```

### 4.2 Database Connection
Create `src/db/index.js`:
```javascript
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

export default connectDB
```

## 🔐 Step 5: Authentication System

### 5.1 Create Auth Middleware
Create `src/middleware/auth.js`:
```javascript
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'No token provided' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) return res.status(401).json({ message: 'Invalid token' })
    
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}
```

### 5.2 Create Auth Controller
Create `src/controllers/auth.controller.js`:
```javascript
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) return res.status(400).json({ message: 'User exists' })
    
    const user = new User({ username, email, password })
    await user.save()
    
    const token = generateToken(user._id)
    res.status(201).json({ message: 'User created', token, user })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    
    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })
    
    const token = generateToken(user._id)
    res.json({ message: 'Login successful', token, user })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
```

## 🛣️ Step 6: API Routes

### 6.1 Create Auth Routes
Create `src/routes/auth.routes.js`:
```javascript
import express from 'express'
import { register, login } from '../controllers/auth.controller.js'

const router = express.Router()
router.post('/register', register)
router.post('/login', login)
export default router
```

### 6.2 Update Main App
Update `src/app.js`:
```javascript
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
export { app }
```

## 🎯 Step 7: Frontend Authentication

### 7.1 Create Auth Context
Create `src/contexts/AuthContext.jsx`:
```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/profile')
      setUser(response.data)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email, password
      })
      const { token: newToken, user: userData } = response.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 7.2 Create Login Page
Create `src/pages/LoginPage.jsx`:
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
```

## 🚀 Step 8: Running the Application

### 8.1 Start Backend
```bash
cd server
npm run dev
```

### 8.2 Start Frontend
```bash
cd client
npm run dev
```

## 🎯 Key Learning Points

1. **Project Structure**: Organize code into logical directories
2. **Authentication Flow**: JWT tokens, middleware, and protected routes
3. **State Management**: React Context for global state
4. **API Design**: RESTful endpoints with proper error handling
5. **Database Design**: Mongoose schemas with relationships
6. **Security**: Password hashing, JWT validation, role-based access
7. **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🚀 Next Steps

After mastering this foundation, add:
- Real-time features with Socket.io
- File uploads with Multer
- Email notifications with Nodemailer
- Caching with Redis
- Advanced analytics and reporting
- Unit and integration tests
- CI/CD pipeline

## 💡 Tips for Success

1. **Start Simple**: Build core features first
2. **Plan Database**: Design schemas before coding
3. **Use Git**: Commit frequently with meaningful messages
4. **Test Early**: Write tests as you develop
5. **Security First**: Always validate user input
6. **Documentation**: Comment code and maintain README files

This guide provides a solid foundation for building full-stack applications. Practice each step and gradually build more complex features. Happy coding! 🎉
