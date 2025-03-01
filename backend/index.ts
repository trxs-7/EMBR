import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import urlRouter from "./routes/urlRoutes";
import dataRouter from "./routes/dataRoutes";
import scrapeRouter from "./routes/scrapeRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

// Register JSON parser and CORS before your routes
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE", "UPDATE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
); // Enable CORS

app.use("/api/scrape", scrapeRouter);
app.use("/api/urls", urlRouter);
app.use("/api/data", dataRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the backend server!");
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => console.log(error.message));
