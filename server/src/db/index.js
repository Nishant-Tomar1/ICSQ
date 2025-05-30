import mongoose from 'mongoose'
 
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`MongoDB database connected !! DB URL : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDb connection failed!!  : ",error);
        process.exit(1)
    }
}

export default connectDB;
