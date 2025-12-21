import { Book } from "../../models/book.model";
import { NotionConfig } from "../../config/preferences";
import { NotionPropertyMapping, NotionRequestPayload } from "./notion.types";

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

  const payload: NotionRequestPayload = {
    parent: { database_id: config.databaseId },
    properties,
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: book.description || "No description available." },
            },
          ],
        },
      },
    ],
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
