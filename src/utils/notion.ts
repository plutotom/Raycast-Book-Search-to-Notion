import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";
import { Book } from "../models/book.model";

interface NotionResponse {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: {
    database_id: string;
  };
  properties: {
    [key: string]: {
      title?: { text: { content: string }[] };
      rich_text?: { text: { content: string }[] };
      date?: { start: string };
      number?: number;
      multi_select?: { name: string }[];
    };
  };
}

interface Preferences {
  notionApiKey: string;
  notionDatabaseId: string;
}

// Add this new function to check database properties
async function validateNotionDatabase(notionApiKey: string, databaseId: string) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch database properties");
    }

    const data = await response.json();
    const requiredProperties = [
      "Title",
      "Authors",
      "Published Date",
      "Publisher",
      "ISBN",
      "Page Count",
      "Categories",
      "Cover",
    ];

    // @ts-expect-error - data is not typed
    const missingProperties = requiredProperties.filter((prop) => !data?.properties[prop]);

    return missingProperties;
  } catch (error) {
    console.error("Failed to validate database:", error);
    throw error;
  }
}

export async function addBookToNotion(book: Book): Promise<NotionResponse | undefined> {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.notionApiKey || !preferences.notionDatabaseId) {
    showToast(Toast.Style.Failure, "Notion API Key or Database ID not configured");
    return;
  }

  try {
    // Add validation check before adding the book
    const missingProperties = await validateNotionDatabase(preferences.notionApiKey, preferences.notionDatabaseId);

    if (missingProperties.length > 0) {
      await showToast(
        Toast.Style.Failure,
        "Missing Notion Properties",
        `Please add these properties to your database: ${missingProperties.join(", ")}`,
      );
      return;
    }

    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${preferences.notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        cover: {
          type: "external",
          external: {
            url: book.coverSmallUrl || "",
          },
        },
        parent: { database_id: preferences.notionDatabaseId },
        properties: {
          // Adjust these property names to match your Notion database structure
          Title: {
            title: [{ text: { content: book.title } }],
          },
          Authors: {
            rich_text: [{ text: { content: book.authors.join(", ") } }],
          },
          "Published Date": {
            date: book.publishDate ? { start: book.publishDate } : null,
          },
          Publisher: {
            rich_text: [{ text: { content: book.publisher || "" } }],
          },
          ISBN: {
            rich_text: [{ text: { content: book.isbn || "" } }],
          },
          "Page Count": {
            number: book.totalPage || null,
          },
          Categories: {
            multi_select: book.categories?.map((category) => ({ name: category })) || [],
          },
        },
        // Optionally add the description as content in the page
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: book.description || "No description available." } }],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message: string };
      throw new Error(`Notion API error: ${errorData.message}`);
    }

    return (await response.json()) as NotionResponse;
  } catch (error) {
    console.error("Failed to add book to Notion:", error);
    throw error;
  }
}

// Error: Notion API error: EVtL value at index 0
// contains invalid url. A file with type 'file must
// contain a Notion hosted file url. Use type 'external*
// for externally hosted files.
