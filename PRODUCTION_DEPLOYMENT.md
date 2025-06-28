# 🚀 Production Deployment Guide - Server 10.130.18.60

## ✅ **SSO Callback URL Updated**

Code to work with the production server `10.130.18.60`:

### **1. Microsoft Teams SSO Callback URL**
- **Development**: Dynamic (localhost)
- **Production**: `http://10.130.18.60:8080/api/v1/auth/microsoft/callback`

### **2. CORS Configuration**
- **Development**: `http://localhost:5173`
- **Production**: Multiple origins including `10.130.18.60`

## 🔧 **Environment Configuration (.env)**

Create a `.env` file on your production server with these values:

```env
# Environment
NODE_ENV=production

# Server Configuration
PORT=8080

# Database
MONGODB_URI=mongodb://your-mongodb-url/icsq

# JWT Secret (generate a strong one)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Client URL (your frontend)
CLIENT_URL=http://10.130.18.60:5173

# Microsoft Teams SSO
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# Redis (if using)
REDIS_URL=redis://your-redis-url

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔐 **Microsoft Azure App Registration Updates**

You need to update your Microsoft Azure App Registration with the new callback URL:

### **1. Go to Azure Portal**
- Navigate to Azure Active Directory
- Go to App Registrations
- Select your ICSQ application

### **2. Update Redirect URIs**
Add these redirect URIs:
```
http://10.130.18.60:8080/api/v1/auth/microsoft/callback
```

### **3. Update Allowed Origins (if needed)**
Add these to your app registration:
```
http://10.130.18.60:5173
http://10.130.18.60:8080
```

## 🚀 **Deployment Steps**

### **1. Server Setup**
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/icsq
sudo chown $USER:$USER /var/www/icsq
```

### **2. Deploy Code**
```bash
# Navigate to application directory
cd /var/www/icsq

# Upload your code here (git clone, scp, or rsync)
# git clone your-repository-url .

# Install dependencies
npm install

# Create .env file with production values
cp .env.example .env
# Edit .env with production values
```

### **3. Start Application**
```bash
# Start with PM2
pm2 start src/index.js --name "icsq-server"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## 🌐 **URLs After Deployment**

### **Backend API:**
```
http://10.130.18.60:8080
```

### **Admin Dashboard:**
```
http://10.130.18.60:8080/admin-logs
```

### **API Endpoints:**
```
http://10.130.18.60:8080/api/v1/auth/login
http://10.130.18.60:8080/api/v1/logs/admin-dashboard
http://10.130.18.60:8080/api/v1/surveys
http://10.130.18.60:8080/api/v1/sipoc
```

## 🔍 **Testing After Deployment**

### **1. Test Server Health**
```bash
curl http://10.130.18.60:8080
# Should return: "Server Working Successfully!"
```

### **2. Test Admin Dashboard**
- Login with `shivanshu.choudhary@sobharealty.com`
- Visit: `http://10.130.18.60:8080/admin-logs`

### **3. Test SSO Login**
- Try logging in with Microsoft Teams SSO
- Check if callback URL works correctly

### **4. Test API Endpoints**
```bash
# Test logs API
curl http://10.130.18.60:8080/api/v1/logs/admin-dashboard \
  -H "Cookie: icsq_token=YOUR_JWT_TOKEN"
```

## 🔧 **Nginx Configuration (Optional)**

If you want to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name 10.130.18.60;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛡️ **Security Checklist**

- [ ] Strong JWT secret configured
- [ ] MongoDB authentication enabled
- [ ] Firewall rules configured
- [ ] HTTPS enabled (recommended)
- [ ] Environment variables secured
- [ ] PM2 process management configured

## 📊 **Monitoring**

### **PM2 Commands:**
```bash
# View logs
pm2 logs icsq-server

# Monitor processes
pm2 monit

# Restart application
pm2 restart icsq-server

# View status
pm2 status
```

### **Application Logs:**
- Check PM2 logs: `pm2 logs icsq-server`
- Check application logs in your admin dashboard
- Monitor disk space for log storage

## 🎯 **Key Changes Made:**

1. **✅ SSO Callback URL**: Updated to `http://10.130.18.60:8080/api/v1/auth/microsoft/callback`
2. **✅ CORS Configuration**: Added production server origins
3. **✅ Environment Detection**: Automatic environment-based configuration
4. **✅ Logging**: Enhanced logging for debugging

Your application is now ready for production deployment on `10.130.18.60`! 🚀 