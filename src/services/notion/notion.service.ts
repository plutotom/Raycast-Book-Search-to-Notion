import { Book } from "../../models/book.model";
import { getNotionConfig } from "../../config/preferences";
import { NotionClient } from "./notion-client";
import { buildPropertyMapping } from "./notion-schema";
import { buildNotionPayload } from "./notion-payload";
import { AddBookResult, NotionResponse } from "./notion.types";

const PROPERTY_DISPLAY_NAMES: Record<string, string> = {
  Title: "Name",
  Authors: "Author",
  "Published Date": "Year",
  Publisher: "Publisher",
  ISBN: "ISBN",
  "Page Count": "Page Count",
  Categories: "Tag",
  "Reading Status": "Reading Status",
};

export async function addBookToNotion(book: Book): Promise<AddBookResult> {
  const config = getNotionConfig();
  const client = new NotionClient(config);

  const schema = await client.fetchDatabase();
  const { propertyMapping, missingProperties } = buildPropertyMapping(schema);

  if (!propertyMapping["Title"]) {
    throw new Error("Your Notion database must contain at least one title property.");
  }

  const payload = buildNotionPayload({ book, config, propertyMapping });
  const response = await client.createPage(payload);

  const addedProperties = deriveAddedProperties(payload, propertyMapping);

  return {
    response,
    missingProperties,
    addedProperties,
  };
}

export function buildSuccessMessage(result: AddBookResult): string {
  const lines = [`ID: ${result.response.id}`];

  if (result.addedProperties.length > 0) {
    lines.push(`Added: ${result.addedProperties.join(", ")}`);
  }

  if (result.missingProperties.length > 0) {
    lines.push(`Skipped: ${result.missingProperties.join(", ")}`);
  }

  return lines.join("\n");
}

function deriveAddedProperties(payload: { properties: Record<string, unknown> }, mapping: Record<string, string>) {
  const added: string[] = [];

  Object.entries(mapping).forEach(([key, propertyName]) => {
    if (payload.properties[propertyName]) {
      const displayName = PROPERTY_DISPLAY_NAMES[key] || key;
      added.push(displayName);
    }
  });

  return added;
}

export type AddBookResponse = NotionResponse;
