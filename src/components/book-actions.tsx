import { Action, ActionPanel, Icon } from "@raycast/api";

import { Book } from "../models/book.model";
import { BookDetail } from "./book-detail";
import { addBookToNotionFromUI } from "../features/notion/add-book";

export function BookActions({ book }: { book: Book }) {
  return (
    <ActionPanel>
      <Action.Push title="View Book Details" icon={Icon.Eye} target={<BookDetail book={book} />} />
      <ActionPanel.Section>
        <BookActionItems book={book} />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

export function BookActionItems({ book }: { book: Book }) {
  const browserUrl = book.previewLink || book.link;

  return (
    <>
      <Action title="Add to Notion" icon={Icon.Plus} onAction={() => addBookToNotionFromUI(book)} />
      <Action.CopyToClipboard title="Copy Book Isbn" content={book.isbn13 || ""} />
      {browserUrl ? <Action.OpenInBrowser url={browserUrl} /> : null}
    </>
  );
}
