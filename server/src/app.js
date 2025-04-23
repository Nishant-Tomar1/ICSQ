import express from 'express'
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from 'body-parser';

const app = express()

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
    credentials: true,
  }),
  express.json({
    limit: "1mb",
  }),
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
  cookieParser(),
  bodyParser.json()
);

app.get('/', ( _ , res) => {
  res.send("Server Working Successfully!");
})

// Import routes
import authRoutes from "./routes/auth.routes"
import departmentRoutes from "./routes/department.routes"
import surveyRoutes from "./routes/survey.routes"
import sipocRoutes from "./routes/sipoc.routes"
import actionPlanRoutes from "./routes/actionPlan.routes"
import analyticsRoutes from "./routes/analytics.routes"

// API Routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/departments", departmentRoutes)
app.use("/api/v1/surveys", surveyRoutes)
app.use("/api/v1/sipoc", sipocRoutes)
app.use("/api/v1/action-plans", actionPlanRoutes)
app.use("/api/v1/analytics", analyticsRoutes)

export {app};