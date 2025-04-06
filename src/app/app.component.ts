import { Component, OnInit } from '@angular/core';
import { BookmarkService } from './services/bookmark.service';
import { BookmarkGroup, Bookmark } from './models/bookmark.model';
import { Observable, of, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NgForm } from '@angular/forms'; // Import NgForm

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'bookmark-app';
  bookmarkGroups$: Observable<BookmarkGroup[]> | undefined;
  filteredBookmarkGroups$: Observable<BookmarkGroup[]> | undefined;
  searchTerm: string = '';
  openInNewTab: boolean = true;

  // State for the Add Bookmark form
  showAddBookmarkForm: boolean = false;
  newBookmark: { name: string; url: string; groupId: string } = {
    name: '',
    url: '',
    groupId: '' // Will be bound to the select dropdown
  };

  constructor(private bookmarkService: BookmarkService) {}

  ngOnInit() {
    this.bookmarkGroups$ = this.bookmarkService.getGroups();
    this.filteredBookmarkGroups$ = this.bookmarkGroups$; // Initialize with all groups
    this.searchBookmarks(); // Apply initial filter (which is none)
  }

  searchBookmarks(): void {
    this.filteredBookmarkGroups$ = this.bookmarkService.searchBookmarks(this.searchTerm);
  }

  openBookmark(url: string): void {
    if (this.openInNewTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }

  // Method to handle the file selection
  handleFileInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        this.parseAndImportBookmarks(content);
      }
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      alert("Failed to read the bookmark file.");
    };
    reader.readAsText(file);

    // Reset file input to allow importing the same file again
    element.value = '';
  }

  // Method to delete a bookmark
  deleteBookmark(event: MouseEvent, groupId: string, bookmarkId: string, bookmarkName: string): void {
    event.stopPropagation(); // Prevent the click from triggering openBookmark

    if (confirm(`Are you sure you want to delete the bookmark "${bookmarkName}"?`)) {
      this.bookmarkService.removeBookmark(groupId, bookmarkId);
      // The BehaviorSubject in the service will trigger view updates via the async pipe
    }
  }

  // Method to parse HTML and import bookmarks
  private parseAndImportBookmarks(htmlContent: string): void {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const importedBookmarks: Bookmark[] = [];
      let bookmarkCounter = 0;

      // Recursive function to find bookmarks (<a> tags)
      const findBookmarks = (element: Element | Document) => {
        element.querySelectorAll('a').forEach(a => {
          const url = a.getAttribute('href');
          const name = a.textContent?.trim();
          // Basic check to avoid javascript:, file:, etc. and ensure name exists
          if (url && name && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('/'))) {
            // Basic check to avoid javascript: or other protocols
            const newId = `imported-${Date.now()}-${bookmarkCounter++}`;
            importedBookmarks.push({ id: newId, name, url });
          }
        });

        // Look inside <DL> elements for nested structures typical in bookmark files
        element.querySelectorAll('dl > dt').forEach(dt => {
            findBookmarks(dt); // Recursively search within DT elements which often contain A tags or nested DLs
        });
      };

      findBookmarks(doc);

      if (importedBookmarks.length > 0) {
        const newGroupId = `imported-group-${Date.now()}`;
        this.bookmarkService.addBookmarkGroup({ id: newGroupId, name: 'Imported Bookmarks', bookmarks: importedBookmarks });
        // Optionally, refresh the view immediately or notify the user
        this.searchBookmarks(); // Refresh the filtered list
        alert(`Successfully imported ${importedBookmarks.length} bookmarks!`);
      } else {
        alert("No valid bookmarks found in the selected file.");
      }
    } catch (error) {
      console.error("Error parsing bookmark file:", error);
      alert("Failed to parse the bookmark file. Ensure it's a valid browser bookmark HTML export.");
    }
  }

  // Toggle the visibility of the Add Bookmark form
  toggleAddBookmarkForm(): void {
    this.showAddBookmarkForm = !this.showAddBookmarkForm;
    if (!this.showAddBookmarkForm) {
      this.resetAddBookmarkForm(); // Reset form if hiding
    }
  }

  // Handle the submission of the Add Bookmark form
  onAddBookmarkSubmit(form?: NgForm): void { // Optional NgForm parameter
    if (!this.newBookmark.groupId || !this.newBookmark.name || !this.newBookmark.url) {
      console.error('Form is invalid, cannot submit.');
       // Although button is disabled, good to have a check
      return;
    }

    this.bookmarkService.addBookmark(this.newBookmark.groupId, {
      name: this.newBookmark.name,
      url: this.newBookmark.url
    });

    // Reset the form fields and optionally hide the form
    this.resetAddBookmarkForm(form);
    this.showAddBookmarkForm = false; // Hide form after successful submission
  }

  // Helper to reset the form model
  private resetAddBookmarkForm(form?: NgForm): void {
     this.newBookmark = { name: '', url: '', groupId: '' };
     form?.resetForm(); // Also reset the form's state (touched, dirty, etc.) if form object is passed
  }
}
