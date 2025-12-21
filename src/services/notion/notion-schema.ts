import { NotionDatabaseSchema, NotionPropertyMapping, NotionValidationResult } from "./notion.types";

const REQUIRED_PROPERTIES = [
  { key: "Title", label: "Name", alternatives: ["Title", "Book Title", "Book Name"] },
  { key: "Authors", label: "Author", alternatives: ["Authors", "Author", "Writer", "Writers"] },
  {
    key: "Published Date",
    label: "Year",
    alternatives: ["Published Date", "Publish Date", "Publication Date", "Date Published", "Year"],
  },
  { key: "Publisher", label: "Publisher", alternatives: ["Publisher", "Publishing House"] },
  { key: "ISBN", label: "ISBN", alternatives: ["ISBN", "ISBN-13", "ISBN-10"] },
  { key: "Page Count", label: "Page Count", alternatives: ["Page Count", "Pages", "Length"] },
  { key: "Categories", label: "Tag", alternatives: ["Categories", "Tags", "Genre", "Genres", "Category"] },
  { key: "Reading Status", label: "Reading Status", alternatives: ["Reading Status", "Status", "Read Status"] },
];

export function buildPropertyMapping(schema: NotionDatabaseSchema): NotionValidationResult {
  const properties = Object.keys(schema?.properties || {});
  const lowerCased = properties.map((property) => property.toLowerCase());

  const propertyMapping: NotionPropertyMapping = {};

  REQUIRED_PROPERTIES.forEach((requirement) => {
    const candidate = properties.find((property) =>
      [requirement.label, ...requirement.alternatives].some((name) => property.toLowerCase() === name.toLowerCase()),
    );

    if (candidate) {
      propertyMapping[requirement.key] = candidate;
    }
  });

  const missingProperties = REQUIRED_PROPERTIES.filter((requirement) => {
    const names = [requirement.label, ...requirement.alternatives].map((name) => name.toLowerCase());
    return !names.some((name) => lowerCased.includes(name));
  }).map((requirement) => requirement.label);

  return {
    propertyMapping,
    missingProperties,
  };
}
