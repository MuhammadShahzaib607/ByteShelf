import express from "express"
import cors from "cors"
import http from "http"
import { initializeSocket } from "./socket/index.js"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { sendRes } from "./utils/responseHandler.js"
import authRoute from "./routes/auth.js"
import warehouseRoute from "./routes/warehouse.js"
import shelfRoute from "./routes/shelf.js"
import bookingRoute from "./routes/booking.js"
import notificationRoute from "./routes/notification.js"
import inboundRoute from "./routes/inboundPlan.js"
import cartonRoute from "./routes/carton.js"
import conversationRoute from "./routes/conversation.js"
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config()
const app = express()
const server = http.createServer(app)
initializeSocket(server)

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}))
app.use(express.json())
app.use("/api/v1/user", authRoute);
app.use("/api/v1/warehouse", warehouseRoute);
app.use("/api/v1/shelf", shelfRoute);
app.use("/api/v1/booking", bookingRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/inbound", inboundRoute);
app.use("/api/v1/carton", cartonRoute);
app.use("/api/v1/conversation", conversationRoute);

const connectDB = async ()=> {
    try {
       await mongoose.connect(process.env.MONGO_URI)
       console.log("server connected to DB Successfully")
    } catch (error) {
        console.log("something went wrong with db connection")
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
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

export default app;