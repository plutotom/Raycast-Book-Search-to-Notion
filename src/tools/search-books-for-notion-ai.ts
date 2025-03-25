import { Tool } from "@raycast/api";
import { getPreferenceValues } from "@raycast/api";
import { useGoogleBooksApi } from "../apis/base_api.ts";
import { Book } from "../models/book.model";
import { addBookToNotion } from "../utils/notion";

/**
 * Input type for the book search tool
 */
type SearchBookInput = {
  /**
   * The title, author, or keywords to search for a book
   */
  query: string;
};

/**
 * Confirmation for adding a book to Notion
 */
export const confirmation: Tool.Confirmation<SearchBookInput> = async (input) => {
  // First search for the book to show details in confirmation
  const api = useGoogleBooksApi({
    localePreference: "en",
    enableCoverImageEdgeCurl: true,
    apiKey: getPreferenceValues().googleBooksApiKey || undefined,
  });

  const books = (await api.getByQuery(input.query)) as Book[];

  if (!books || books.length === 0) {
    return {
      message: "No books found matching your query. Try a different search term.",
      cancelLabel: "Cancel",
      confirmLabel: "Try Again",
    };
  }

  const bestMatch = books[0];

  return {
    title: "Add Book to Notion",
    message: `Would you like to add "${bestMatch.title}" by ${bestMatch.authors?.join(", ")} to your Notion database?`,
    detail: `Published: ${bestMatch.publishDate || "Unknown"}
Publisher: ${bestMatch.publisher || "Unknown"}
ISBN: ${bestMatch.isbn13 || bestMatch.isbn10 || "Unknown"}
${bestMatch.description ? "Description: " + bestMatch.description.substring(0, 200) + "..." : ""}`,
    confirmLabel: "Add to Notion",
    cancelLabel: "Cancel",
  };
};

/**
 * Searches for a book based on the provided query and adds the best match to your Notion database
 * @param input Search parameters for finding a book
 */
export default async function searchBookForNotion(input: SearchBookInput): Promise<string> {
  try {
    const api = useGoogleBooksApi({
      localePreference: "en",
      enableCoverImageEdgeCurl: true,
      apiKey: getPreferenceValues().googleBooksApiKey || undefined,
    });

    // Search for books
    const books = (await api.getByQuery(input.query)) as Book[];

    if (!books || books.length === 0) {
      return "I couldn't find any books matching your query. Could you try again with a different search term?";
    }

    // Get the best match
    const bestMatch = books[0];

    // Add book to Notion
    const notionResponse = await addBookToNotion(bestMatch);

    if (notionResponse) {
      return `✅ Successfully added "${bestMatch.title}" by ${bestMatch.authors?.join(", ")} to your Notion database!`;
    } else {
      return "❌ Failed to add the book to Notion. Please check your Notion API key and database ID settings.";
    }
  } catch (error) {
    console.error("Error in searchBookForNotion:", error);
    return "Sorry, I encountered an error while processing your book request. Please check your settings and try again.";
  }
}
