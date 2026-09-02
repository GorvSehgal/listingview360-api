import { z } from "zod";

const panoramaSchema = z.object({
  name: z.string().min(1, "Panorama name is required"),
  url: z.string().url("Panorama URL must be valid"),
});

export const createPropertySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),

  address: z.string().min(3, "Address is required"),

  city: z.string().min(2, "City is required"),

  province: z.string().min(2, "Province is required"),

  postalCode: z.string().min(3, "Postal code is required"),

  listingType: z.enum(["sale", "rent"]),

  price: z.number().positive("Price must be greater than 0"),

  bedrooms: z.number().int().min(0),

  bathrooms: z.number().min(0),

  propertyType: z.string().min(2, "Property type is required"),

  yearBuilt: z.number().int().positive().optional(),

  description: z.string().min(10, "Description must be at least 10 characters"),

  realtorName: z.string().min(2, "Realtor name is required"),

  realtorBrokerage: z.string().optional(),

  images: z
    .array(z.string().url("Image URL must be valid"))
    .min(1, "At least one image is required"),

  panoramas: z.array(panoramaSchema),
});

export const updatePropertySchema = createPropertySchema.partial();