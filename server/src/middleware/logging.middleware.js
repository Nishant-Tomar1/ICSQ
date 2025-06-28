import { logActivity } from "../utils/logger.js"

/**
 * Middleware to log all API requests and responses
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now()
  
  // Store original send method
  const originalSend = res.send
  
  // Override send method to capture response
  res.send = function(data) {
    const responseTime = Date.now() - startTime
    
    // Create a more readable action name
    let action = 'API_REQUEST'
    const method = req.method
    const path = req.route?.path || req.path
    
    // Map common endpoints to readable actions
    if (path.includes('/analytics')) {
      action = 'ANALYTICS_VIEWED'
    } else if (path.includes('/department-scores')) {
      action = 'DEPARTMENT_SCORES_VIEWED'
    } else if (path.includes('/expectation-data')) {
      action = 'EXPECTATION_DATA_VIEWED'
    } else if (path.includes('/surveys')) {
      if (method === 'GET') action = 'SURVEY_VIEWED'
      else if (method === 'POST') action = 'SURVEY_CREATED'
      else if (method === 'PUT') action = 'SURVEY_UPDATED'
      else if (method === 'DELETE') action = 'SURVEY_DELETED'
    } else if (path.includes('/sipoc')) {
      if (method === 'GET') action = 'SIPOC_VIEWED'
      else if (method === 'POST') action = 'SIPOC_CREATED'
      else if (method === 'PUT') action = 'SIPOC_UPDATED'
      else if (method === 'DELETE') action = 'SIPOC_DELETED'
    } else if (path.includes('/users')) {
      if (method === 'GET') action = 'USER_VIEWED'
      else if (method === 'POST') action = 'USER_CREATED'
      else if (method === 'PUT') action = 'USER_UPDATED'
      else if (method === 'DELETE') action = 'USER_DELETED'
    } else if (path.includes('/departments')) {
      if (method === 'GET') action = 'DEPARTMENT_VIEWED'
      else if (method === 'POST') action = 'DEPARTMENT_CREATED'
      else if (method === 'PUT') action = 'DEPARTMENT_UPDATED'
      else if (method === 'DELETE') action = 'DEPARTMENT_DELETED'
    } else if (path.includes('/auth')) {
      // Handle auth endpoints with valid action names
      if (path.includes('/login')) {
        action = res.statusCode === 200 ? 'LOGIN' : 'LOGIN_FAILED'
      } else if (path.includes('/register')) {
        action = res.statusCode === 201 ? 'REGISTER' : 'REGISTER_FAILED'
      } else if (path.includes('/logout')) {
        action = 'LOGOUT'
      } else {
        action = 'AUTH_REQUEST'
      }
    } else {
      // For other endpoints, use a generic API_REQUEST
      action = 'API_REQUEST'
    }
    
    // Log the request/response
    logActivity({
      action,
      resourceType: 'SYSTEM',
      user: req.user,
      details: {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseSize: data ? JSON.stringify(data).length : 0,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      },
      request: req,
      status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
      responseTime
    })
    
    // Call original send method
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Middleware to log authentication events
 */
export const authLogger = (req, res, next) => {
  const startTime = Date.now()
  
  // Store original send method
  const originalSend = res.send
  
  // Override send method to capture authentication responses
  res.send = function(data) {
    const responseTime = Date.now() - startTime
    
    // Check if this is an authentication endpoint
    const isAuthEndpoint = req.path.includes('/auth') || 
                          req.path.includes('/login') || 
                          req.path.includes('/register') ||
                          req.path.includes('/logout')
    
    if (isAuthEndpoint) {
      let action = 'AUTH_REQUEST'
      let status = 'SUCCESS'
      let errorMessage = null
      
      // Determine the specific action using valid enum values
      if (req.path.includes('/login')) {
        action = res.statusCode === 200 ? 'LOGIN' : 'LOGIN_FAILED'
      } else if (req.path.includes('/register')) {
        action = res.statusCode === 201 ? 'REGISTER' : 'REGISTER_FAILED'
      } else if (req.path.includes('/logout')) {
        action = 'LOGOUT'
      } else {
        action = 'AUTH_REQUEST'
      }
      
      if (res.statusCode >= 400) {
        status = 'FAILURE'
        try {
          const responseData = JSON.parse(data)
          errorMessage = responseData.message || 'Authentication failed'
        } catch (e) {
          errorMessage = 'Authentication failed'
        }
      }
      
      // Log authentication event
      logActivity({
        action,
        resourceType: 'USER',
        user: req.user,
        details: {
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        request: req,
        status,
        errorMessage,
        responseTime
      })
    }
    
    // Call original send method
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Error logging middleware
 */
export const errorLogger = (error, req, res, next) => {
  // Log the error
  logActivity({
    action: 'SYSTEM_ERROR',
    resourceType: 'SYSTEM',
    user: req.user,
    details: {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode || 500
    },
    request: req,
    status: 'FAILURE',
    errorMessage: error.message
  })
  
  next(error)
}

/**
 * Performance monitoring middleware
 */
export const performanceLogger = (req, res, next) => {
  const startTime = process.hrtime()
  
  // Store original send method
  const originalSend = res.send
  
  // Override send method to capture performance data
  res.send = function(data) {
    const [seconds, nanoseconds] = process.hrtime(startTime)
    const responseTime = (seconds * 1000) + (nanoseconds / 1000000) // Convert to milliseconds
    
    // Log slow requests (over 1 second)
    if (responseTime > 1000) {
      logActivity({
        action: 'SLOW_REQUEST',
        resourceType: 'SYSTEM',
        user: req.user,
        details: {
          method: req.method,
          path: req.originalUrl || req.url,
          responseTime: Math.round(responseTime),
          statusCode: res.statusCode
        },
        request: req,
        status: 'SUCCESS',
        responseTime: Math.round(responseTime)
      })
    }
    
    // Call original send method
    return originalSend.call(this, data)
  }
  
  next()
} 