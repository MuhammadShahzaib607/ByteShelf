import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { sendRes } from "./utils/responseHandler.js"
import authRoute from "./routes/auth.js"

dotenv.config()
const app = express()

app.use(express.json())
app.use("/api/v1/user", authRoute);

const connectDB = async ()=> {
    try {
       await mongoose.connect(process.env.MONGO_URI)
       console.log("server connected to DB Successfully")
    } catch (error) {
        console.log(error.message)
    }
}

connectDB()

app.get("/", (req, res)=> {
    sendRes(res, 200, true, "API Hit Successfully")
})

app.get("/health-check", (req, res)=> {
    sendRes(res, 200, true, "ok")
})

if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;