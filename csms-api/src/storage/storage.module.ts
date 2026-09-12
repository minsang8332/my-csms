import { Global, Module } from '@nestjs/common';
import { DynamoDbService } from './dynamodb/dynamodb.service';

@Global()
@Module({
  providers: [DynamoDbService],
  exports: [DynamoDbService],
})
export class StorageModule {}
