import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "ListingView360 API",
      version: "1.0.0",
      description: "REST API for ListingView360",
    },

    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local development server",
      },
    ],

    components: {
      schemas: {
        Panorama: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Living Room",
            },
            url: {
              type: "string",
              example: "https://example.com/living-room-360.jpg",
            },
          },
        },

        Property: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              readOnly: true
            },

            title: {
              type: "string",
              example: "Modern Detached Home",
            },

            address: {
              type: "string",
              example: "123 Maple Street",
            },

            city: {
              type: "string",
              example: "Toronto",
            },

            province: {
              type: "string",
              example: "ON",
            },

            postalCode: {
              type: "string",
              example: "M1A 1A1",
            },

            listingType: {
              type: "string",
              enum: ["sale", "rent"],
              example: "sale",
            },

            price: {
              type: "number",
              example: 899000,
            },

            bedrooms: {
              type: "integer",
              example: 4,
            },

            bathrooms: {
              type: "number",
              example: 3,
            },

            propertyType: {
              type: "string",
              example: "Detached",
            },

            yearBuilt: {
              type: "integer",
              example: 2020,
            },

            description: {
              type: "string",
              example: "Modern detached home with spacious living areas.",
            },

            realtorName: {
              type: "string",
              example: "John Smith",
            },

            realtorBrokerage: {
              type: "string",
              example: "ABC Realty",
            },

            images: {
              type: "array",
              items: {
                type: "string",
              },
            },

            panoramas: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Panorama",
              },
            },
          },
        },

        PropertiesResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            count: {
              type: "integer",
              example: 2,
            },

            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Property",
              },
            },
          },
        },
      },
    },
    
  },

  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
