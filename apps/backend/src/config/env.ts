import dotenv from 'dotenv';

dotenv.config();

const required = ['BACKEND_JWT_ACCESS_SECRET', 'BACKEND_JWT_REFRESH_SECRET', 'BACKEND_DATABASE_URL'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing environment variable: ${key}. Using fallback if provided.`);
  }
});

export const env = {
  port: Number(process.env.BACKEND_PORT || 8080),
  databaseUrl: process.env.BACKEND_DATABASE_URL || '',
  jwtAccessSecret: process.env.BACKEND_JWT_ACCESS_SECRET || 'access-secret',
  jwtRefreshSecret: process.env.BACKEND_JWT_REFRESH_SECRET || 'refresh-secret',
  jwtExpiresIn: process.env.BACKEND_JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.BACKEND_REFRESH_EXPIRES_IN || '7d',
  cookieDomain: process.env.BACKEND_COOKIE_DOMAIN || 'localhost',
  saltRounds: Number(process.env.BACKEND_SALT_ROUNDS || 10),
  swaggerUser: process.env.BACKEND_SWAGGER_USERNAME || 'docs',
  swaggerPassword: process.env.BACKEND_SWAGGER_PASSWORD || 'docs'
};
