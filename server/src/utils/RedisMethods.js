import { redisClient } from "../index.js";

async function storeOtp(email, otp) {
    const ttlInSeconds = 300; 
    try {
      await redisClient.setEx( email, ttlInSeconds, otp.toString());
      console.log('OTP stored successfully');
    } catch (err) {
      console.error('Error storing OTP:', err);
    }
}

async function getOtp(email) {
    try {
      const otp = await redisClient.get(email); 
      return Number.parseInt(otp); 
    } catch (err) {
      console.error('Error retrieving OTP:', err);
      return null;
    }
  }
  
async function deleteOtp(email) {
    try {
      await redisClient.del(email);
      console.log('OTP deleted successfully');
    } catch (err) {
      console.error('Error deleting OTP:', err);
    }
  }

  
export {
    storeOtp, getOtp, deleteOtp
}