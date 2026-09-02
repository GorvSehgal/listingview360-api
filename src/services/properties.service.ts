import type { Property ,CreatePropertyInput, UpdatePropertyInput} from "../types/property.js";
import { prisma } from "../config/database.js";
const properties: Property[] = [
  {
  id: 1,
  title: "Modern Detached Home",
  address: "123 Maple Street",
  city: "Toronto",
  province: "ON",
  postalCode: "M1A 1A1",

  listingType: "sale",
  price: 899000,

  bedrooms: 4,
  bathrooms: 3,
  propertyType: "Detached",
  yearBuilt: 2020,

  description: "Modern detached home with spacious living areas.",

  realtorName: "John Smith",
  realtorBrokerage: "ABC Realty",

  images: [
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  ],

  panoramas: [
    {
      name: "Living Room",
      url: "living-room-360.jpg",
    },
    {
      name: "Kitchen",
      url: "kitchen-360.jpg",
    },
  ],
},

  {
    id: 2,
    title: "Downtown Condo for Rent",
    address: "500 King Street",
    city: "Toronto",
    province: "ON",
    postalCode: "M5V 1L9",

    listingType: "rent",
    price: 2800,

    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Condo",
    yearBuilt: 2022,

    description: "Modern downtown condo close to transit and restaurants.",

    realtorName: "Sarah Lee",
    realtorBrokerage: "City Realty",

    images:[
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
],

    panoramas: [
      {
        name: "Living Room",
        url: "condo-living-room-360.jpg",
      },
    ],
  },
];

export const getProperties = async (): Promise<Property[]> => {
  const dbProperties = await prisma.property.findMany({
    include: {
      images: true,
      panoramas: true,
    },
  });

  return dbProperties.map((property) => ({
    id: property.id,
    title: property.title,
    address: property.address,
    city: property.city,
    province: property.province,
    postalCode: property.postalCode,
    listingType: property.listingType,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    propertyType: property.propertyType,
    yearBuilt: property.yearBuilt ?? undefined,
    description: property.description,
    realtorName: property.realtorName,
    realtorBrokerage: property.realtorBrokerage ?? undefined,

    images: property.images.map((image) => image.url),

    panoramas: property.panoramas.map((panorama) => ({
      name: panorama.name,
      url: panorama.url,
    })),
  }));
};
export const getPropertyById = async (
  id: number
): Promise<Property | undefined> => {
  const property = await prisma.property.findUnique({
    where: {
      id,
    },
    include: {
      images: true,
      panoramas: true,
    },
  });

  if (!property) {
    return undefined;
  }

  return {
    id: property.id,
    title: property.title,
    address: property.address,
    city: property.city,
    province: property.province,
    postalCode: property.postalCode,
    listingType: property.listingType,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    propertyType: property.propertyType,
    yearBuilt: property.yearBuilt ?? undefined,
    description: property.description,
    realtorName: property.realtorName,
    realtorBrokerage: property.realtorBrokerage ?? undefined,

    images: property.images.map((image) => image.url),

    panoramas: property.panoramas.map((panorama) => ({
      name: panorama.name,
      url: panorama.url,
    })),
  };
};
export const createProperty = async (
  data: CreatePropertyInput
): Promise<Property> => {
  const createdProperty = await prisma.property.create({
    data: {
      title: data.title,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      listingType: data.listingType,
      price: data.price,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      propertyType: data.propertyType,
      yearBuilt: data.yearBuilt,
      description: data.description,
      realtorName: data.realtorName,
      realtorBrokerage: data.realtorBrokerage,

      images: {
        create: data.images.map((url, index) => ({
          url,
          sortOrder: index + 1,
        })),
      },

      panoramas: {
        create: data.panoramas.map((panorama, index) => ({
          name: panorama.name,
          url: panorama.url,
          sortOrder: index + 1,
        })),
      },
    },

    include: {
      images: true,
      panoramas: true,
    },
  });

  return {
    id: createdProperty.id,
    title: createdProperty.title,
    address: createdProperty.address,
    city: createdProperty.city,
    province: createdProperty.province,
    postalCode: createdProperty.postalCode,
    listingType: createdProperty.listingType,
    price: createdProperty.price,
    bedrooms: createdProperty.bedrooms,
    bathrooms: createdProperty.bathrooms,
    propertyType: createdProperty.propertyType,
    yearBuilt: createdProperty.yearBuilt ?? undefined,
    description: createdProperty.description,
    realtorName: createdProperty.realtorName,
    realtorBrokerage: createdProperty.realtorBrokerage ?? undefined,
    images: createdProperty.images.map((image) => image.url),
    panoramas: createdProperty.panoramas.map((panorama) => ({
      name: panorama.name,
      url: panorama.url,
    })),
  };
};
export const updateProperty = async (
  id: number,
  data: UpdatePropertyInput
): Promise<Property | undefined> => {
  const existingProperty = await prisma.property.findUnique({
    where: { id },
  });

  if (!existingProperty) {
    return undefined;
  }

  const updatedProperty = await prisma.property.update({
    where: { id },

    data: {
      title: data.title,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      listingType: data.listingType,
      price: data.price,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      propertyType: data.propertyType,
      yearBuilt: data.yearBuilt,
      description: data.description,
      realtorName: data.realtorName,
      realtorBrokerage: data.realtorBrokerage,

      ...(data.images && {
        images: {
          deleteMany: {},
          create: data.images.map((url, index) => ({
            url,
            sortOrder: index + 1,
          })),
        },
      }),

      ...(data.panoramas && {
        panoramas: {
          deleteMany: {},
          create: data.panoramas.map((panorama, index) => ({
            name: panorama.name,
            url: panorama.url,
            sortOrder: index + 1,
          })),
        },
      }),
    },

    include: {
      images: true,
      panoramas: true,
    },
  });

  return {
    id: updatedProperty.id,
    title: updatedProperty.title,
    address: updatedProperty.address,
    city: updatedProperty.city,
    province: updatedProperty.province,
    postalCode: updatedProperty.postalCode,
    listingType: updatedProperty.listingType,
    price: updatedProperty.price,
    bedrooms: updatedProperty.bedrooms,
    bathrooms: updatedProperty.bathrooms,
    propertyType: updatedProperty.propertyType,
    yearBuilt: updatedProperty.yearBuilt ?? undefined,
    description: updatedProperty.description,
    realtorName: updatedProperty.realtorName,
    realtorBrokerage: updatedProperty.realtorBrokerage ?? undefined,
    images: updatedProperty.images.map((image) => image.url),
    panoramas: updatedProperty.panoramas.map((panorama) => ({
      name: panorama.name,
      url: panorama.url,
    })),
  };
};

export const deleteProperty = async (
  id: number
): Promise<boolean> => {
  const existingProperty = await prisma.property.findUnique({
    where: { id },
  });

  if (!existingProperty) {
    return false;
  }

  await prisma.property.delete({
    where: { id },
  });

  return true;
};