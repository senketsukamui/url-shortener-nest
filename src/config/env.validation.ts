type EnvironmentVariables = {
  DATABASE_URL?: string;
  APP_URL?: string;
  PORT?: string;
};

export function validateEnv(config: EnvironmentVariables) {
  const databaseUrl = config.DATABASE_URL;
  const appUrl = config.APP_URL ?? 'http://localhost:3000';
  const port = Number(config.PORT ?? 3000);

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (!URL.canParse(databaseUrl)) {
    throw new Error('DATABASE_URL must be a valid URL');
  }

  if (!URL.canParse(appUrl)) {
    throw new Error('APP_URL must be a valid URL');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    APP_URL: appUrl,
    PORT: port,
  };
}
