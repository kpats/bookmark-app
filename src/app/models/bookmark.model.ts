export interface Bookmark {
  id: string; // Unique identifier
  name: string;
  url: string;
  favicon?: string; // Optional: URL to the site's favicon
}

export interface BookmarkGroup {
  id: string; // Unique identifier for the group
  name: string;
  bookmarks: Bookmark[];
}
