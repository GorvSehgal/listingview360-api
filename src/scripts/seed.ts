import { prisma } from "../config/database.js";

async function seed() {
  // Clear existing demo properties
  await prisma.property.deleteMany();

  await prisma.property.create({
    data: {
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
      description:
        "Modern detached home featuring spacious living areas and contemporary finishes.",
      realtorName: "John Smith",
      realtorBrokerage: "ABC Realty",

      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            sortOrder: 1,
          },
          {
            url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.property.create({
    data: {
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
      description:
        "Modern downtown condo located close to transit, restaurants, and entertainment.",
      realtorName: "Sarah Lee",
      realtorBrokerage: "City Realty",

      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            sortOrder: 1,
          },
          {
            url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log("ListingView360 database seeded successfully.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });