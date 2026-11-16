export type Property = {
  id: number;
  title: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  listingType: "sale" | "rent";
  status: "pending" | "approved" | "rejected";
  ownerId?: number;

  price: number;

  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  yearBuilt?: number;

  description: string;

  realtorName: string;
  realtorBrokerage?: string;

  images: string[];
  panoramas: {
    name: string;
    url: string;
  }[];
};
export type CreatePropertyInput = Omit<Property, "id" | "status" | "ownerId">;
export type UpdatePropertyInput = Partial<CreatePropertyInput>;