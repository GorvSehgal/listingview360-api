export type Property = {
  id: number;
  title: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  listingType: "sale" | "rent";

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
export type CreatePropertyInput = Omit<Property, "id">;
export type UpdatePropertyInput = Partial<CreatePropertyInput>;