import nodemailer from 'nodemailer'
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { deleteOtp, getOtp, storeOtp } from '../utils/RedisMethods.js'

let transporter = nodemailer.createTransport({
    host : process.env.SMTP_HOST,
    port : process.env.SMTP_PORT,
    secure : false,
    auth : {
        user : process.env.SMTP_MAIL, 
        pass : process.env.SMTP_PASS
    }
})

const sendEmailHandler = asyncHandler(
    async (req,res)=>{
        const {email, subject} = req.body
        
        const otp = Math.floor((Math.random()*899990)) + 100000;

        const mailOptions = {
            from : process.env.SMTP_MAIL,
            to : email.toLowerCase(),
            subject : subject,
            text : `${otp} is your password reset Code. Enter the Code in the website to create New Password. OTP is valid for 5 minutes.`
        }


        storeOtp(email, otp).then(()=>{
            try {
                transporter.sendMail(mailOptions, function(error, info){
                    if (error){
                        throw new ApiError(500, "Something went wrong while sending verification code on email. Try again", error)
                    }
                    else if (info){
                        return res
                        .status(200)
                        .json(
                            new ApiResponse(200, {}, "Sent Successfully")
                            )
                        }
                    })
            } catch (error) {
                throw new ApiError(500, "Something went wrong while sending verification code")
            }
        }).catch((err)=>{
            console.log(err);
            throw new ApiError(500, "Something went wrong while sending verification code")
        });


    }
)

const verifyOTPHandler = asyncHandler(
    async (req, res) => {
        const {email, Otp} = req.body;
        
        const otpFromRedis = await getOtp(email);
        if (!otpFromRedis){
            throw new ApiError(400, "OTP expired! Refresh the page and try again.")
        }

        if (otpFromRedis.toString() !== Otp.toString()){
            throw new ApiError(401,"Incorrect OTP! Try again")
        }

        await deleteOtp(email);

        return res
        .json(
            new ApiResponse(200, {},"Verification Successful")
        )

    }
)

export {sendEmailHandler, verifyOTPHandler}