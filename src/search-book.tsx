import { ActionPanel, Action, List, Icon, showToast, Toast, Detail, getPreferenceValues } from "@raycast/api";
import { usePromise } from "@raycast/utils";

import { Book } from "./models/book.model";
import { useState } from "react";
import { addBookToNotion } from "./utils/notion";
import { useGoogleBooksApi } from "./apis/base_api.ts";

export default function Command() {
  const [searchQuery, setSearchQuery] = useState("five views");

  const { isLoading, data: books } = usePromise(
    async (query) => {
      if (!query) return [];

      try {
        const api = useGoogleBooksApi({
          localePreference: "en",
          enableCoverImageEdgeCurl: true,
          apiKey: getPreferenceValues().googleBooksApiKey || undefined,
        });

        const data = (await api.getByQuery(query)) as Book[];
        return data;
      } catch (error) {
        console.error(error);
        showToast(Toast.Style.Failure, "Failed to search for books");
        return [];
      }
    },
    [searchQuery],
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchQuery}
      searchBarPlaceholder="Search for books..."
      throttle
      isShowingDetail
    >
      {searchQuery && books && books.length === 0 && (
        <List.EmptyView title="No books found" description="Please try a different search query" />
      )}

      {books &&
        books.length > 0 &&
        books.map((book) => (
          <List.Item
            key={book.title + book.isbn13 || book.isbn10}
            detail={
              <List.Item.Detail
                markdown={`<img src="${book.coverUrl?.replace("http://", "https://")}" width="128" height="192" style="object-fit: contain" />`}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Link
                      title="Image Url"
                      target={book.previewLink || ""}
                      text="Open in Browser"
                    />
                    <List.Item.Detail.Metadata.Label title="Title" text={book.title} />
                    <List.Item.Detail.Metadata.Label title="Authors" text={book.authors?.join(", ")} />
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label title="Publisher" text={book.publisher} />
                    <List.Item.Detail.Metadata.Label title="Published Date" text={book.publishDate} />
                    <List.Item.Detail.Metadata.Label title="Page Count" text={book.totalPage?.toString()} />
                    <List.Item.Detail.Metadata.Label title="Categories" text={book.categories?.join(", ")} />
                    <List.Item.Detail.Metadata.Label title="ISBN-13" text={book.isbn13} />
                    <List.Item.Detail.Metadata.Label title="ISBN-10" text={book.isbn10} />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            title={book.title}
            subtitle={book?.authors?.join(", ")}
            accessories={[{ text: book.publishDate }, { text: book.publisher }]}
            actions={<BookActions book={book} />}
          />
        ))}
    </List>
  );
}

function BookActions({ book }: { book: Book }) {
  return (
    <ActionPanel>
      <Action.Push title="View Book Details" icon={Icon.Eye} target={<BookDetail book={book} />} />
      <Action title="Add to Notion" icon={Icon.Plus} onAction={() => addToNotion(book)} />

      <Action.CopyToClipboard title="Copy ISBN-13" content={book.isbn13 || ""} />
      <Action.OpenInBrowser url={book.previewLink || ""} />
    </ActionPanel>
  );
}

async function addToNotion(book: Book) {
  try {
    await showToast(Toast.Style.Animated, "Adding book to Notion...");
    const notionResponse = await addBookToNotion(book);
    if (notionResponse) {
      await showToast(Toast.Style.Success, "Book added to Notion", notionResponse.id);
    } else {
      await showToast(Toast.Style.Failure, "Failed to add book to Notion");
    }
  } catch (error) {
    console.error(error);
    await showToast(Toast.Style.Failure, "Failed to add book to Notion", error as string);
  }
}

function BookDetail({ book }: { book: Book }) {
  const markdown = `
  # ${book.title}


  **Authors**: ${book.authors.join(", ")}

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
  return (
    <ActionPanel>
      <Action title="Add to Notion" icon={Icon.Plus} onAction={() => addToNotion(book)} />
      <Action.CopyToClipboard title="Copy ISBN-13" content={book.isbn13 || ""} />
      <Action.OpenInBrowser url={book.previewLink || ""} />
    </ActionPanel>
  );
}
