# Healthcare App API Client

This directory contains the API client implementation for the Healthcare application, using Axios for HTTP requests.

## Structure

- `config/` - Contains configuration for the API client
- `services/` - Contains service classes for different API endpoints
- `types/` - Contains TypeScript interfaces for API data models

## Usage

### Basic Usage

Import the pre-configured services from the API module:

```typescript
import { doctorService, patientService, appointmentService } from '@/lib/api';

// Example: Get doctor profile
const profile = await doctorService.getProfileByUserId(userId);

// Example: Book an appointment
const appointment = await patientService.bookAppointment(patientId, appointmentData);
```

### Advanced Usage

You can also create custom service instances for other endpoints:

```typescript
import { BaseApiService } from '@/lib/api';
import { YourDataType } from '@/lib/api/types';

// Create a custom service
class CustomService extends BaseApiService<YourDataType> {
  constructor() {
    super('custom-endpoint');
  }
  
  // Add custom methods
  async customMethod(id: string): Promise<YourDataType | null> {
    try {
      const response = await this.apiClient.get(`/custom-endpoint/${id}/special`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }
}

// Use the custom service
const customService = new CustomService();
const result = await customService.customMethod('123');
```

## Authentication

The API client automatically handles authentication by adding the Firebase ID token to each request. This is managed in the request interceptor in `config/axiosConfig.ts`.

## Error Handling

Errors are handled globally in the response interceptor in `config/axiosConfig.ts`. Common HTTP errors (401, 403, 404, 500) are logged to the console and can be customized to show user-friendly messages or trigger specific actions.

## Adding New Services

1. Define any new data types in `types/index.ts`
2. Create a new service class that extends `BaseApiService`
3. Implement custom methods for specific API endpoints
4. Export the service instance from `index.ts`

## Environment Configuration

The API base URL is configured from environment variables:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

If not set, it defaults to `http://localhost:3001`.
