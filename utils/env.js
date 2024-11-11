export const getEnvVar = (key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`⚠️ Missing environment variable: ${key}`);
  }
  return value;
};

export const ENV = {
  ANTHROPIC_API_KEY: getEnvVar('ANTHROPIC_API_KEY'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 