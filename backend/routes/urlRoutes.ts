import express from "express";
import {
  getUrls,
  getUrl,
  createUrl,
  deleteUrl,
  updateUrl,
} from "../controllers/urlController";

const urlRouter = express.Router();

urlRouter.get("/", getUrls);
urlRouter.post("/", createUrl);
urlRouter.get("/:id", getUrl);
urlRouter.patch("/:id", updateUrl);
urlRouter.delete("/:id", deleteUrl);

export default urlRouter;
