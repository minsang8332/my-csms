import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/** Shared DynamoDB DocumentClient for Lambda storage adapters. */
@Injectable()
export class DynamoDbService {
  readonly client: DynamoDBDocumentClient;

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  table(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing DynamoDB table environment variable: ${name}`);
    return value;
  }
}
