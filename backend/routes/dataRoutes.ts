import { Express } from "express";
import {
  getData,
  getDataById,
  createData,
  updateData,
  deleteData,
} from "../controllers/dataController";

const dataRoutes = (app: Express) => {
  app.get("/data", getData);
  app.post("/data", createData);
  app.get("/data/:id", getDataById);
  app.patch("/data/:id", updateData);
  app.delete("/data/:id", deleteData);
};

export default dataRoutes;
