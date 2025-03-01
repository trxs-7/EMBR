import dataModel from "../models/dataModel";
import { Request, Response } from "express";

const getData = async (req: Request, res: Response) => {
  try {
    const data = await dataModel.find();
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

const getDataById = async (req: Request, res: Response) => {
  try {
    const data = await dataModel.findById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

const createData = async (req: Request, res: Response) => {
  const data = req.body;
  const newData = new dataModel(data);
  try {
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

const updateData = async (req: Request, res: Response) => {
  const data = req.body;
  try {
    await dataModel.findByIdAndUpdate(req.params.id, data);
    res.json(data);
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

const deleteData = async (req: Request, res: Response) => {
  try {
    await dataModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Data deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: (error as Error).message });
  }
};

export { getData, getDataById, createData, updateData, deleteData };
