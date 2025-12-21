import { showToast, Toast } from "@raycast/api";

import { Book } from "../../models/book.model";
import { addBookToNotion, buildSuccessMessage } from "../../services/notion/notion.service";
import { NotionResponse } from "../../services/notion/notion.types";

export async function addBookToNotionFromUI(book: Book): Promise<NotionResponse | undefined> {
  try {
    await showToast(Toast.Style.Animated, "Adding book to Notion...");
    const result = await addBookToNotion(book);
    await showToast(Toast.Style.Success, "Book added to Notion", buildSuccessMessage(result));
    return result.response;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Failed to add book to Notion:", error);
    await showToast(Toast.Style.Failure, "Failed to add book to Notion", message);
    return undefined;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}
