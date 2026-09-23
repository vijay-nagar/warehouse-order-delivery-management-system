import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  username: string;
  roles: string[];
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "24h",
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid JWT payload");
  }

  if (
    typeof decoded.userId !== "number" ||
    typeof decoded.username !== "string" ||
    !Array.isArray(decoded.roles)
  ) {
    throw new Error("Invalid JWT payload");
  }

  return {
    userId: decoded.userId,
    username: decoded.username,
    roles: decoded.roles.map(String),
  };
};