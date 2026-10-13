import type { Property ,CreatePropertyInput, UpdatePropertyInput} from "../types/property.js";
import { prisma } from "../config/database.js";
export type PropertyActor = { id: number; role: "admin" | "realtor" };

const permittedPropertyWhere = (id: number, actor: PropertyActor) =>
  actor.role === "admin" ? { id } : { id, ownerId: actor.id };

export const getProperties = async (): Promise<Property[]> => {
  const dbProperties = await prisma.property.findMany({
    where: { status: "approved" },
    include: {
      images: true,
      panoramas: true,
    },
  });

  return dbProperties.map((property) => ({
    id: property.id,
    status: property.status,
    ownerId: property.ownerId ?? undefined,
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
  const property = await prisma.property.findFirst({
    where: {
      id, status: "approved",
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
    status: property.status,
    ownerId: property.ownerId ?? undefined,
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
  data: CreatePropertyInput,
  ownerId: number
): Promise<Property> => {
  const createdProperty = await prisma.property.create({
    data: {
      ownerId,
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
    status: createdProperty.status,
    ownerId: createdProperty.ownerId ?? undefined,
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
  data: UpdatePropertyInput,
  actor: PropertyActor
): Promise<Property | undefined> => {
  const existingProperty = await prisma.property.findFirst({
    where: permittedPropertyWhere(id, actor),
  });

  if (!existingProperty) {
    return undefined;
  }

  const updatedProperty = await prisma.property.update({
    where: permittedPropertyWhere(id, actor),

    data: {
      status: "pending",
      reviewedAt: null,
      reviewedById: null,
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
    status: updatedProperty.status,
    ownerId: updatedProperty.ownerId ?? undefined,
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
  id: number,
  actor: PropertyActor
): Promise<boolean> => {
  const existingProperty = await prisma.property.findFirst({
    where: permittedPropertyWhere(id, actor),
  });

  if (!existingProperty) {
    return false;
  }

  await prisma.property.delete({
    where: permittedPropertyWhere(id, actor),
  });

  return true;
};
/** All reviewable listings for admins; only one's own listings for realtors. */
export const getManagedProperties = async (actor: PropertyActor): Promise<Property[]> => {
  const records = await prisma.property.findMany({
    where: actor.role === "admin" ? {} : { ownerId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { sortOrder: "asc" } }, panoramas: { orderBy: { sortOrder: "asc" } } },
  });
  return records.map((item) => ({
    id: item.id, status: item.status, ownerId: item.ownerId ?? undefined,
    title: item.title, address: item.address, city: item.city, province: item.province,
    postalCode: item.postalCode, listingType: item.listingType, price: item.price,
    bedrooms: item.bedrooms, bathrooms: item.bathrooms, propertyType: item.propertyType,
    yearBuilt: item.yearBuilt ?? undefined, description: item.description,
    realtorName: item.realtorName, realtorBrokerage: item.realtorBrokerage ?? undefined,
    images: item.images.map((image) => image.url),
    panoramas: item.panoramas.map((panorama) => ({ name: panorama.name, url: panorama.url })),
  }));
};

/** Server-enforced publication gate; realtors have no approval permission. */
export const reviewProperty = async (
  id: number, status: "approved" | "rejected", actor: PropertyActor,
): Promise<Property | undefined> => {
  if (actor.role !== "admin") return undefined;
  const record = await prisma.property.findUnique({ where: { id }, select: { id: true } });
  if (!record) return undefined;
  const item = await prisma.property.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewedById: actor.id },
    include: { images: { orderBy: { sortOrder: "asc" } }, panoramas: { orderBy: { sortOrder: "asc" } } },
  });
  return {
    id: item.id, status: item.status, ownerId: item.ownerId ?? undefined,
    title: item.title, address: item.address, city: item.city, province: item.province,
    postalCode: item.postalCode, listingType: item.listingType, price: item.price,
    bedrooms: item.bedrooms, bathrooms: item.bathrooms, propertyType: item.propertyType,
    yearBuilt: item.yearBuilt ?? undefined, description: item.description,
    realtorName: item.realtorName, realtorBrokerage: item.realtorBrokerage ?? undefined,
    images: item.images.map((image) => image.url),
    panoramas: item.panoramas.map((panorama) => ({ name: panorama.name, url: panorama.url })),
  };
};
