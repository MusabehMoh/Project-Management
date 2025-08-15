/**
 * Unified Search Service for the entire application
 * Provides consistent search functionality across all components
 */

export interface SearchableUser {
  id: number;
  name: string;
  militaryNumber: string;
  username: string;
  email?: string;
  department?: string;
  rank?: string;
  phone?: string;
  isActive?: boolean;
}

export interface SearchOptions {
  searchFields?: ('name' | 'militaryNumber' | 'username' | 'email')[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
  minLength?: number;
}

export class SearchService {
  /**
   * Default search options
   */
  private static defaultOptions: SearchOptions = {
    searchFields: ['name', 'militaryNumber', 'username'],
    caseSensitive: false,
    exactMatch: false,
    minLength: 0,
  };

  /**
   * Search users with flexible options
   * @param users Array of users to search
   * @param searchTerm The search term
   * @param options Search configuration options
   * @returns Filtered array of users
   */
  static searchUsers(
    users: SearchableUser[],
    searchTerm: string,
    options: SearchOptions = {}
  ): SearchableUser[] {
    const config = { ...this.defaultOptions, ...options };

    // Return all users if search term is empty or too short
    if (!searchTerm || searchTerm.length < config.minLength!) {
      return users;
    }

    const normalizedSearchTerm = config.caseSensitive 
      ? searchTerm 
      : searchTerm.toLowerCase();

    return users.filter(user => {
      return config.searchFields!.some(field => {
        const fieldValue = user[field];
        if (!fieldValue) return false;

        const normalizedFieldValue = config.caseSensitive 
          ? fieldValue 
          : fieldValue.toLowerCase();

        return config.exactMatch
          ? normalizedFieldValue === normalizedSearchTerm
          : normalizedFieldValue.includes(normalizedSearchTerm);
      });
    });
  }

  /**
   * Search users by military number only
   * @param users Array of users to search
   * @param militaryNumber The military number to search for
   * @returns Filtered array of users
   */
  static searchByMilitaryNumber(
    users: SearchableUser[],
    militaryNumber: string
  ): SearchableUser[] {
    return this.searchUsers(users, militaryNumber, {
      searchFields: ['militaryNumber'],
      caseSensitive: false,
    });
  }

  /**
   * Search users by name only
   * @param users Array of users to search
   * @param name The name to search for
   * @returns Filtered array of users
   */
  static searchByName(
    users: SearchableUser[],
    name: string
  ): SearchableUser[] {
    return this.searchUsers(users, name, {
      searchFields: ['name'],
      caseSensitive: false,
    });
  }

  /**
   * Combined search for name, military number, and username
   * This is the most commonly used search function
   * @param users Array of users to search
   * @param searchTerm The search term
   * @returns Filtered array of users
   */
  static universalSearch(
    users: SearchableUser[],
    searchTerm: string
  ): SearchableUser[] {
    return this.searchUsers(users, searchTerm, {
      searchFields: ['name', 'militaryNumber', 'username'],
      caseSensitive: false,
    });
  }

  /**
   * Advanced search with multiple criteria
   * @param users Array of users to search
   * @param criteria Object with different search criteria
   * @returns Filtered array of users
   */
  static advancedSearch(
    users: SearchableUser[],
    criteria: {
      name?: string;
      militaryNumber?: string;
      username?: string;
      email?: string;
      department?: string;
      rank?: string;
      isActive?: boolean;
    }
  ): SearchableUser[] {
    return users.filter(user => {
      // Check each criteria
      for (const [field, value] of Object.entries(criteria)) {
        if (value === undefined || value === null || value === '') continue;

        const userValue = user[field as keyof SearchableUser];
        
        if (typeof value === 'boolean') {
          if (userValue !== value) return false;
        } else if (typeof value === 'string') {
          if (!userValue || !userValue.toString().toLowerCase().includes(value.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Highlight search terms in text (useful for UI display)
   * @param text The text to highlight
   * @param searchTerm The term to highlight
   * @param highlightClass CSS class for highlighting
   * @returns HTML string with highlighted terms
   */
  static highlightSearchTerm(
    text: string,
    searchTerm: string,
    highlightClass: string = 'bg-yellow-200'
  ): string {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
  }

  /**
   * Sort search results by relevance
   * @param users Array of users
   * @param searchTerm The search term used
   * @returns Sorted array with most relevant results first
   */
  static sortByRelevance(
    users: SearchableUser[],
    searchTerm: string
  ): SearchableUser[] {
    if (!searchTerm) return users;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return [...users].sort((a, b) => {
      // Exact name match gets highest priority
      const aNameExact = a.name?.toLowerCase() === lowerSearchTerm ? 1 : 0;
      const bNameExact = b.name?.toLowerCase() === lowerSearchTerm ? 1 : 0;
      if (aNameExact !== bNameExact) return bNameExact - aNameExact;

      // Military number exact match gets second priority
      const aMilExact = a.militaryNumber?.toLowerCase() === lowerSearchTerm ? 1 : 0;
      const bMilExact = b.militaryNumber?.toLowerCase() === lowerSearchTerm ? 1 : 0;
      if (aMilExact !== bMilExact) return bMilExact - aMilExact;

      // Name starts with search term gets third priority
      const aNameStarts = a.name?.toLowerCase().startsWith(lowerSearchTerm) ? 1 : 0;
      const bNameStarts = b.name?.toLowerCase().startsWith(lowerSearchTerm) ? 1 : 0;
      if (aNameStarts !== bNameStarts) return bNameStarts - aNameStarts;

      // Military number starts with search term gets fourth priority
      const aMilStarts = a.militaryNumber?.toLowerCase().startsWith(lowerSearchTerm) ? 1 : 0;
      const bMilStarts = b.militaryNumber?.toLowerCase().startsWith(lowerSearchTerm) ? 1 : 0;
      if (aMilStarts !== bMilStarts) return bMilStarts - aMilStarts;

      // Default alphabetical sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }
}

export default SearchService;
