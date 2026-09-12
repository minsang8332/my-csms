export type StorageDriver = 'mysql' | 'dynamodb';

export function getStorageDriver(): StorageDriver {
  const configured = process.env.STORAGE_DRIVER?.toLowerCase();
  if (!configured || configured === 'mysql') return 'mysql';
  if (configured === 'dynamodb') return 'dynamodb';
  throw new Error(`Unsupported STORAGE_DRIVER: ${configured}`);
}

export function isDynamoDb(): boolean {
  return getStorageDriver() === 'dynamodb';
}
