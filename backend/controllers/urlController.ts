import urlModel from "../models/urlModel";

import { Request, Response } from "express";

const getUrls = async (req: Request, res: Response) => {
  try {
    const urls = await urlModel.find();
    res.json(urls);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

const getUrl = async (req: Request, res: Response) => {
  try {
    const url = await urlModel.findById(req.params.id);
    res.json(url);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

const createUrl = async (req: Request, res: Response) => {
  const url = req.body;
  const newUrl = new urlModel(url);
  try {
    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

const updateUrl = async (req: Request, res: Response) => {
  const url = req.body;
  try {
    await urlModel.findByIdAndUpdate(req.params.id, url);
    res.json(url);
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

const deleteUrl = async (req: Request, res: Response) => {
  try {
    await urlModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Url deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

export { getUrls, getUrl, createUrl, updateUrl, deleteUrl };
