// Script to add ananth.nallasamy@sobharealty.com to the system
// This script should be run by an admin user

const axios = require('axios');

const SERVER_URL = 'http://localhost:8080/api/v1';

// User details to add
const newUser = {
  name: "Ananth Nallasamy",
  email: "ananth.nallasamy@sobharealty.com",
  password: "TemporaryPassword123!", // This should be changed by the user
  department: "", // This will need to be set to a valid department ID
  role: "user" // Default role, can be changed to admin if needed
};

async function addUser() {
  try {
    console.log('🚀 Starting user addition process...');
    
    // First, get all departments to show available options
    console.log('📋 Fetching available departments...');
    const departmentsResponse = await axios.get(`${SERVER_URL}/departments`, {
      withCredentials: true
    });
    
    const departments = departmentsResponse.data;
    console.log('Available departments:');
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
    });
    
    // For this script, we'll use the first department as default
    // In a real scenario, you'd want to specify the correct department
    if (departments.length > 0) {
      newUser.department = departments[0]._id;
      console.log(`✅ Using department: ${departments[0].name}`);
    } else {
      console.error('❌ No departments found. Please create a department first.');
      return;
    }
    
    // Add the user
    console.log('👤 Adding user...');
    const response = await axios.post(`${SERVER_URL}/users`, newUser, {
      withCredentials: true
    });
    
    console.log('✅ User added successfully!');
    console.log('User details:', response.data.user);
    console.log('\n📝 Next steps:');
    console.log('1. The user should change their password on first login');
    console.log('2. The user now has "view logs" permission');
    console.log('3. They can access the admin dashboard at: http://localhost:8080/admin-logs');
    
  } catch (error) {
    console.error('❌ Error adding user:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 409) {
      console.log('ℹ️  User already exists in the system');
    } else if (error.response?.status === 401) {
      console.log('❌ Authentication required. Please login as an admin first.');
    } else if (error.response?.status === 403) {
      console.log('❌ Admin access required. Only admin users can add new users.');
    }
  }
}

// Instructions for running this script
console.log('📖 Instructions:');
console.log('1. Make sure you are logged in as an admin user');
console.log('2. Run this script with: node add-user-script.js');
console.log('3. The user will be added with view logs permission');
console.log('');

// Run the script
addUser(); 