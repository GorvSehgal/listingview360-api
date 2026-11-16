import type { Request, Response } from "express";
import { getProperties, getPropertyById, getManagedProperties, reviewProperty as reviewPropertyService, createProperty as createPropertyService, updateProperty as updatePropertyService, deleteProperty as deletePropertyService } from "../services/properties.service.js";
import { CreatePropertyInput,UpdatePropertyInput } from "../types/property.js";

export const getAllProperties = async (
  req: Request,
  res: Response
) => {
  const properties = await getProperties();

  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties,
  });
};
export const getProperty = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "Invalid property ID" });
  }

  const property = await getPropertyById(id);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: "Property not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: property,
  });
};
export const createProperty = async (
  req: Request<{}, {}, CreatePropertyInput>,
  res: Response
) => {
  const newProperty = await createPropertyService(req.body, req.authUser!.id);

  return res.status(201).json({
    success: true,
    data: newProperty,
  });
};
export const updateProperty = async (
  req: Request<{ id: string }, {}, UpdatePropertyInput>,
  res: Response
) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "Invalid property ID" });
  }

  const updatedProperty = await updatePropertyService(id, req.body, req.authUser!);

  if (!updatedProperty) {
    return res.status(404).json({
      success: false,
      message: "Property not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedProperty,
  });
};
export const deleteProperty = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "Invalid property ID" });
  }

  const deleted = await deletePropertyService(id, req.authUser!);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Property not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Property deleted successfully",
  });
};
export const getManagementProperties = async (req: Request, res: Response) => {
  const items = await getManagedProperties(req.authUser!);
  res.status(200).json({ success: true, count: items.length, data: items });
};

export const reviewProperty = async (req: Request<{ id: string }, {}, { status: "approved" | "rejected" }>, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: "Invalid property ID" });
  }
  const item = await reviewPropertyService(id, req.body.status, req.authUser!);
  if (!item) return res.status(404).json({ success: false, message: "Property not found" });
  return res.status(200).json({ success: true, data: item });
};
