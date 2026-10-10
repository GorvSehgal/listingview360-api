declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: number;
        email: string;
        role: "admin" | "realtor";
      };
    }
  }
}

export {};
