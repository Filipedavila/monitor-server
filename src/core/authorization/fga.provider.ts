import { OpenFgaClient } from '@openfga/sdk';
import { FactoryProvider, Logger } from '@nestjs/common';

export const FGA_CLIENT = 'FGA_CLIENT';

export const FgaClientProvider: FactoryProvider = {
  provide: FGA_CLIENT,
  useFactory: async () => {
    const logger = new Logger('OpenFgaClient');
    const client = new OpenFgaClient({
      apiUrl: process.env.FGA_API_URL, 
      storeId: process.env.FGA_STORE_ID, 
      authorizationModelId: process.env.FGA_AUTH_MODEL, 
    });
    try {
      logger.log('Validating OpenFGA connection...');
      await client.readAuthorizationModel();
      logger.log('OpenFGA connection established successfully.');
      return client;
    } catch (error) {
      logger.error('Failed to connect to OpenFGA. System shutting down.');
      logger.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1); 
    }
  },
};