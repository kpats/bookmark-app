import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BookmarkGroup, Bookmark } from '../models/bookmark.model';

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private _bookmarkGroups = new BehaviorSubject<BookmarkGroup[]>([]);
  readonly bookmarkGroups$: Observable<BookmarkGroup[]> = this._bookmarkGroups.asObservable();

  // Initial mock data
  private initialGroups: BookmarkGroup[] = [
    {
      id: 'g1',
      name: 'Development',
      bookmarks: [
        { id: 'b1', name: 'Angular Docs', url: 'https://angular.dev/' },
        { id: 'b2', name: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
        { id: 'b3', name: 'Stack Overflow', url: 'https://stackoverflow.com/' }
      ]
    },
    {
      id: 'g2',
      name: 'News',
      bookmarks: [
        { id: 'b4', name: 'TechCrunch', url: 'https://techcrunch.com/' },
        { id: 'b5', name: 'Hacker News', url: 'https://news.ycombinator.com/' }
      ]
    },
     {
      id: 'g3',
      name: 'Social',
      bookmarks: [
        { id: 'b6', name: 'Twitter', url: 'https://twitter.com/' },
        { id: 'b7', name: 'LinkedIn', url: 'https://linkedin.com/' }
      ]
    }
  ];

  constructor() {
    // Load initial data
    this._bookmarkGroups.next(this.initialGroups);
  }

  getGroups(): Observable<BookmarkGroup[]> {
    return this.bookmarkGroups$;
  }

  // Basic search functionality (case-insensitive)
  searchBookmarks(query: string): Observable<BookmarkGroup[]> {
    const lowerCaseQuery = query.toLowerCase();
    return this.bookmarkGroups$.pipe(
      map(groups => {
        if (!query.trim()) {
          return groups; // Return all groups if query is empty
        }
        return groups.map(group => ({
          ...group,
          bookmarks: group.bookmarks.filter(bookmark =>
            bookmark.name.toLowerCase().includes(lowerCaseQuery) ||
            bookmark.url.toLowerCase().includes(lowerCaseQuery)
          )
        })).filter(group => group.bookmarks.length > 0); // Only include groups with matching bookmarks
      })
    );
  }

  // Method to add a new bookmark group
  addBookmarkGroup(newGroup: Omit<BookmarkGroup, 'id'> & { id?: string }): void {
    const currentGroups = this._bookmarkGroups.getValue();
    // Generate an ID if one isn't provided
    const groupToAdd: BookmarkGroup = {
      ...newGroup,
      id: newGroup.id || `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    this._bookmarkGroups.next([...currentGroups, groupToAdd]);
  }

  // Method to remove a bookmark from a specific group
  removeBookmark(groupId: string, bookmarkId: string): void {
    const currentGroups = this._bookmarkGroups.getValue();
    const updatedGroups = currentGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          bookmarks: group.bookmarks.filter(bookmark => bookmark.id !== bookmarkId)
        };
      }
      return group;
    });

    // Optional: remove group if it becomes empty after removing the bookmark
    // const finalGroups = updatedGroups.filter(group => group.bookmarks.length > 0);
    // this._bookmarkGroups.next(finalGroups);

    this._bookmarkGroups.next(updatedGroups);
  }

  // Method to add a new bookmark to a specific group
  addBookmark(groupId: string, newBookmarkData: Omit<Bookmark, 'id'>): void {
    const currentGroups = this._bookmarkGroups.getValue();
    const updatedGroups = currentGroups.map(group => {
      if (group.id === groupId) {
        const newBookmark: Bookmark = {
          ...newBookmarkData,
          id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // Generate unique ID
        };
        return {
          ...group,
          bookmarks: [...group.bookmarks, newBookmark]
        };
      }
      return group;
    });
    this._bookmarkGroups.next(updatedGroups);
  }

  // --- Example methods to add/remove groups ---
  // addGroup(name: string) { ... }
  // removeGroup(groupId: string) { ... }
}
