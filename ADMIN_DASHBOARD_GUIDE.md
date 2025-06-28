# 🔐 Private Admin Dashboard Guide

## 🎯 **Your Personal Log Dashboard**

I've created a **private admin dashboard** that's only accessible to your email: `shivanshu.choudhary@sobharealty.com`

## 📍 **Where Logs Are Stored**

The logs are stored in your **MongoDB database** in a collection called `logs`. You can also view them directly in MongoDB Compass.

## 🚀 **How to Access Your Dashboard**

### **Method 1: Direct URL Access**
After logging in with your SSO email (`shivanshu.choudhary@sobharealty.com`), visit:
```
http://localhost:8080/admin-logs
```

### **Method 2: API Access**
You can also call the API directly:
```bash
GET http://localhost:8080/api/v1/logs/admin-dashboard
```

## 🎨 **Dashboard Features**

### **📊 Real-time Statistics**
- Today's total logs
- Today's login count
- Today's error count
- Total logs in system

### **🔥 Top Actions Today**
- Most performed actions
- Action counts

### **👥 Most Active Users**
- Users with most activity
- Activity counts

### **🔍 Advanced Filtering**
- Filter by action type (Login, Survey Created, etc.)
- Filter by status (Success/Failure)
- Filter by user email
- Filter by date range

### **📋 Log Table**
- Timestamp
- User name/email
- Action performed
- Status (Success/Failure)
- IP Address
- Response time
- Request URL

### **📊 Export Functionality**
- Export filtered logs to CSV
- Download logs for external analysis

## 🔧 **API Endpoints Available**

### **Dashboard API:**
```bash
GET /api/v1/logs/admin-dashboard
```

### **Filtered Logs:**
```bash
GET /api/v1/logs?action=LOGIN&status=SUCCESS&userEmail=user@example.com
```

### **Statistics:**
```bash
GET /api/v1/logs/statistics
```

### **Export:**
```bash
GET /api/v1/logs/export?startDate=2024-01-01&endDate=2024-01-31
```

## 🛡️ **Security**

- **Only your email** (`shivanshu.choudhary@sobharealty.com`) can access this dashboard
- All other users will get "Access denied" message
- Uses your existing SSO authentication
- No additional passwords needed

## 📱 **Dashboard Features**

1. **Auto-refresh** every 30 seconds
2. **Real-time updates** as activities happen
3. **Responsive design** - works on mobile and desktop
4. **Pagination** for large datasets
5. **Search and filter** capabilities
6. **Export to CSV** functionality

## 🎯 **What You Can Monitor**

### **User Activities:**
- Who logged in and when
- Who created surveys
- Who updated SIPOC entries
- Who viewed analytics

### **System Performance:**
- Slow requests (>1 second)
- Error rates
- API response times

### **Security:**
- Failed login attempts
- Suspicious IP addresses
- Unusual activity patterns

## 🚀 **Quick Start**

1. **Login** to your ICSQ application with `shivanshu.choudhary@sobharealty.com`
2. **Visit** `http://localhost:8080/admin-logs`
3. **Start monitoring** all activities in real-time!

## 📊 **Sample Dashboard View**

You'll see:
- **Statistics cards** showing today's activity
- **Top actions** being performed
- **Most active users**
- **Filterable log table**
- **Export buttons**

## 🔄 **Auto-refresh**

The dashboard automatically refreshes every 30 seconds, so you'll always see the latest activities without manually refreshing.

---

**This is your private monitoring tool - only you can access it!** 🔐 