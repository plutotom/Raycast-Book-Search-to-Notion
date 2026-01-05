import { Book } from "../../models/book.model";
import { NotionConfig } from "../../config/preferences";
import { NotionPropertyMapping, NotionRequestPayload } from "./notion.types";

// Notion API limits rich_text content to 2000 characters per block
const NOTION_TEXT_LIMIT = 2000;

/**
 * Splits text into chunks that fit within Notion's character limit
 */
function splitTextIntoChunks(text: string, maxLength: number = NOTION_TEXT_LIMIT): string[] {
  if (!text || text.length <= maxLength) {
    return [text || "No description available."];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point (end of sentence or word)
    let breakPoint = remaining.lastIndexOf(". ", maxLength);
    if (breakPoint === -1 || breakPoint < maxLength * 0.5) {
      breakPoint = remaining.lastIndexOf(" ", maxLength);
    }
    if (breakPoint === -1 || breakPoint < maxLength * 0.5) {
      breakPoint = maxLength;
    }

    chunks.push(remaining.slice(0, breakPoint + 1).trim());
    remaining = remaining.slice(breakPoint + 1).trim();
  }

  return chunks;
}

interface BuildPayloadOptions {
  book: Book;
  config: NotionConfig;
  propertyMapping: NotionPropertyMapping;
}

export function buildNotionPayload({ book, config, propertyMapping }: BuildPayloadOptions): NotionRequestPayload {
  const properties: Record<string, unknown> = {};

  const addProperty = (key: string, value: unknown) => {
    const propertyName = propertyMapping[key];
    if (!propertyName) return;
    properties[propertyName] = value;
  };

  const isbnValue = book.isbn13 || book.isbn10 || book.isbn || "";
  const coverUrl = (book.coverSmallUrl || book.coverUrl || "").replace("http://", "https://");

  addProperty("Title", {
    title: [{ text: { content: book.title } }],
  });

  addProperty("Authors", {
    rich_text: [{ text: { content: book.authors?.join(", ") || "" } }],
  });

  const publishedDateProperty = propertyMapping["Published Date"];
  if (publishedDateProperty) {
    if (publishedDateProperty.toLowerCase() === "year") {
      const yearMatch = book.publishDate?.match(/\b(\d{4})\b/);
      addProperty("Published Date", {
        number: yearMatch ? parseInt(yearMatch[1], 10) : null,
      });
    } else {
      addProperty("Published Date", {
        date: book.publishDate ? { start: book.publishDate } : null,
      });
    }
  }

  addProperty("Publisher", {
    rich_text: [{ text: { content: book.publisher || "" } }],
  });

  addProperty("ISBN", {
    rich_text: [{ text: { content: isbnValue } }],
  });

  const pageCountValue =
    typeof book.totalPage === "string" ? parseInt(book.totalPage, 10) || null : book.totalPage || null;
  addProperty("Page Count", {
    number: pageCountValue,
  });

  addProperty("Categories", {
    multi_select: book.categories?.map((category) => ({ name: category })) || [],
  });

  addProperty("Reading Status", {
    select: { name: "Not started" },
  });

  // Split description into chunks to comply with Notion's 2000 char limit per rich_text block
  const descriptionChunks = splitTextIntoChunks(book.description || "");
  const children = descriptionChunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [
        {
          type: "text" as const,
          text: { content: chunk },
        },
      ],
    },
  }));

  const payload: NotionRequestPayload = {
    parent: { database_id: config.databaseId },
    properties,
    children,
  };

  if (coverUrl.startsWith("https://")) {
    payload.cover = {
      type: "external",
      external: {
        url: coverUrl,
      },
    };
  }

  return payload;
}
