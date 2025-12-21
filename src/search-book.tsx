import { List } from "@raycast/api";
import { useState } from "react";

import { Book } from "./models/book.model";
import { BookActions } from "./components/book-actions";
import { useBookSearch } from "./hooks/use-book-search";

export default function Command() {
  const [searchQuery, setSearchQuery] = useState("");
  const { books, isLoading } = useBookSearch(searchQuery);

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

      {books.map((book) => (
        <BookListItem key={getBookKey(book)} book={book} />
      ))}
    </List>
  );
}

function BookListItem({ book }: { book: Book }) {
  return (
    <List.Item
      title={book.title}
      subtitle={book.authors?.join(", ")}
      accessories={[
        ...(book.publishDate ? [{ text: book.publishDate }] : []),
        ...(book.publisher ? [{ text: book.publisher }] : []),
      ]}
      detail={<BookListItemDetail book={book} />}
      actions={<BookActions book={book} />}
    />
  );
}

function BookListItemDetail({ book }: { book: Book }) {
  const coverUrl = book.coverUrl?.replace("http://", "https://");

  return (
    <List.Item.Detail
      markdown={coverUrl ? `<img src="${coverUrl}" width="128" height="192" style="object-fit: contain" />` : ""}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Link title="Image Url" target={book.previewLink || ""} text="Open in Browser" />
          <List.Item.Detail.Metadata.Label title="Title" text={book.title} />
          <List.Item.Detail.Metadata.Label title="Authors" text={book.authors?.join(", ") || "Unknown"} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Publisher" text={book.publisher || "Unknown"} />
          <List.Item.Detail.Metadata.Label title="Published Date" text={book.publishDate || "Unknown"} />
          <List.Item.Detail.Metadata.Label title="Page Count" text={book.totalPage?.toString() || "Unknown"} />
          <List.Item.Detail.Metadata.Label title="Categories" text={book.categories?.join(", ") || "Unknown"} />
          <List.Item.Detail.Metadata.Label title="ISBN-13" text={book.isbn13 || "Unknown"} />
          <List.Item.Detail.Metadata.Label title="ISBN-10" text={book.isbn10 || "Unknown"} />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function getBookKey(book: Book) {
  return book.isbn13 || book.isbn10 || book.previewLink || book.title;
}
