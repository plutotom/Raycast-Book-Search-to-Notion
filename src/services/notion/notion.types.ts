import { Book } from "../../models/book.model";
import { NotionConfig } from "../../config/preferences";

export interface NotionResponse {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: {
    database_id: string;
  };
  properties: Record<string, unknown>;
}

export interface NotionDatabaseSchema {
  properties: Record<string, unknown>;
}

export interface NotionPropertyMapping {
  [key: string]: string;
}

export interface NotionValidationResult {
  propertyMapping: NotionPropertyMapping;
  missingProperties: string[];
}

export interface NotionRequestPayload {
  parent: {
    database_id: string;
  };
  properties: Record<string, unknown>;
  children: Array<Record<string, unknown>>;
  cover?: {
    type: "external";
    external: {
      url: string;
    };
  };
}

export interface AddBookResult {
  response: NotionResponse;
  missingProperties: string[];
  addedProperties: string[];
}

export interface BuildPayloadContext {
  book: Book;
  config: NotionConfig;
  propertyMapping: NotionPropertyMapping;
}
