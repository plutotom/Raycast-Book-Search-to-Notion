import { Detail, ActionPanel, Action, Icon } from "@raycast/api";

import { Book } from "../models/book.model";
import { addBookToNotionFromUI } from "../features/notion/add-book";

export function BookDetail({ book }: { book: Book }) {
  const markdown = `
  # ${book.title}

  **Authors**: ${book.authors?.join(", ") ?? "Unknown"}

  **Published**: ${book.publishDate || "Unknown"}

  **Publisher**: ${book.publisher || "Unknown"}

  **ISBN**: ${book.isbn13 || book.isbn10 || "Unknown"}

  **Categories**: ${book.categories?.join(", ") || "Unknown"}

  **Pages**: ${book.totalPage || "Unknown"}

  ## Description

  ${book.description || "No description available."}

  ${book.coverSmallUrl ? `![Book Cover](${book.coverSmallUrl.replace("http://", "https://")})` : ""}
  `;

  return <Detail markdown={markdown} actions={<BookDetailActions book={book} />} />;
}

function BookDetailActions({ book }: { book: Book }) {
  const browserUrl = book.previewLink || book.link;

  return (
    <ActionPanel>
      <Action title="Add to Notion" icon={Icon.Plus} onAction={() => addBookToNotionFromUI(book)} />
      <Action.CopyToClipboard title="Copy Book Isbn" content={book.isbn13 || ""} />
      {browserUrl ? <Action.OpenInBrowser url={browserUrl} /> : null}
    </ActionPanel>
  );
}
