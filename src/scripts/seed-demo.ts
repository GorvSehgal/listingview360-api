import { prisma } from "../config/database.js";

// Intentionally fictional properties. All titles and descriptions disclose that
// these are demonstrations, not actual homes available for sale or rent.
const demoListings = [
  {
    title: "DEMO — Brantford Family Home",
    address: "101 Example Lane (fictional)",
    city: "Brantford", province: "ON", postalCode: "N3T 0A0",
    listingType: "sale" as const, price: 679900, bedrooms: 3, bathrooms: 2,
    propertyType: "Detached", yearBuilt: 2018,
    description: "DEMONSTRATION ONLY — Fictional Brantford detached home with three bedrooms and two bathrooms. Prices, address, specifications and photographs are illustrative. This property is not available for sale.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&auto=format&fit=crop",
    ],
  },
  {
    title: "DEMO — Cambridge Townhouse",
    address: "202 Sample Crescent (fictional)",
    city: "Cambridge", province: "ON", postalCode: "N1R 0A0",
    listingType: "sale" as const, price: 589000, bedrooms: 3, bathrooms: 2.5,
    propertyType: "Townhouse", yearBuilt: 2021,
    description: "DEMONSTRATION ONLY — Example townhouse with three bedrooms in Cambridge, Ontario. No real property, ownership or availability is represented.",
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&auto=format&fit=crop",
    ],
  },
  {
    title: "DEMO — Waterloo Condo",
    address: "303 Demo Avenue (fictional)",
    city: "Waterloo", province: "ON", postalCode: "N2L 0A0",
    listingType: "sale" as const, price: 499900, bedrooms: 2, bathrooms: 2,
    propertyType: "Condo", yearBuilt: 2023,
    description: "DEMONSTRATION ONLY — Sample two-bedroom Waterloo condominium. Used for testing ListingView360 search, listing cards and photo gallery. This is not an actual offering.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1000&auto=format&fit=crop",
    ],
  },
  {
    title: "DEMO — Kitchener Apartment Rental",
    address: "404 Prototype Road (fictional)",
    city: "Kitchener", province: "ON", postalCode: "N2G 0A0",
    listingType: "rent" as const, price: 2350, bedrooms: 2, bathrooms: 1,
    propertyType: "Apartment", yearBuilt: 2019,
    description: "DEMONSTRATION ONLY — Example two-bedroom Kitchener rental apartment. Monthly rent, amenities and images are illustrative and no unit is available to rent.",
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop",
    ],
  },
  {
    title: "DEMO — Toronto Downtown Condo",
    address: "505 Placeholder Street (fictional)",
    city: "Toronto", province: "ON", postalCode: "M5V 0A0",
    listingType: "rent" as const, price: 3100, bedrooms: 2, bathrooms: 2,
    propertyType: "Condo", yearBuilt: 2022,
    description: "DEMONSTRATION ONLY — A fictional downtown Toronto rental used to test the property detail screen. All images are examples, not verified photos of any available home.",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop",
    ],
  },
  {
    title: "DEMO — Hamilton Modern Home",
    address: "606 Mockup Court (fictional)",
    city: "Hamilton", province: "ON", postalCode: "L8P 0A0",
    listingType: "sale" as const, price: 749000, bedrooms: 4, bathrooms: 3,
    propertyType: "Detached", yearBuilt: 2017,
    description: "DEMONSTRATION ONLY — Fictional four-bedroom Hamilton house with an example asking price, to demonstrate multiple photo viewing. This is not a real property listing.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&auto=format&fit=crop",
    ],
  },
];

export async function seedDemoProperties(): Promise<{ created: number; existing: number }> {
  let created = 0;
  let existing = 0;
  for (const listing of demoListings) {
    const found = await prisma.property.findFirst({
      where: { title: listing.title, address: listing.address, city: listing.city },
      select: { id: true },
    });
    if (found) {
      existing += 1;
      continue;
    }
    await prisma.property.create({
      data: {
        title: listing.title,
        address: listing.address,
        city: listing.city,
        province: listing.province,
        postalCode: listing.postalCode,
        listingType: listing.listingType,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        propertyType: listing.propertyType,
        yearBuilt: listing.yearBuilt,
        description: listing.description,
        realtorName: "ListingView360 Demo (fictional)",
        realtorBrokerage: null,
        ownerId: null,
        images: { create: listing.images.map((url, i) => ({ url, sortOrder: i + 1 })) },
      },
    });
    created += 1;
  }
  return { created, existing };
}
