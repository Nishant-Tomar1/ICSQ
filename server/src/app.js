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

app.get('/health', ( _ , res) => {
  res.status(200).json({"message" : "Server Working Successfully!"});
})

// Import routes
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import departmentRoutes from "./routes/department.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import surveyRoutes from "./routes/survey.routes.js"
import sipocRoutes from "./routes/sipoc.routes.js"
import actionPlanRoutes from "./routes/actionPlan.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
import departmentMappingRoutes from "./routes/departmentMapping.routes.js"

// API Routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/departments", departmentRoutes)
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/surveys", surveyRoutes)
app.use("/api/v1/sipoc", sipocRoutes)
app.use("/api/v1/action-plans", actionPlanRoutes)
app.use("/api/v1/analytics", analyticsRoutes)
app.use("/api/v1/department-mappings", departmentMappingRoutes)

export {app};