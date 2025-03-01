import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import urlRouter from "./routes/urlRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE", "UPDATE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
); // Enable CORS
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

app.use("/api/urls", urlRouter);

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log(error.message));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
