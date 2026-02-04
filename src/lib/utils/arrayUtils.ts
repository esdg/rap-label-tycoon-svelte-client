/**
 * Array utility functions for common collection operations
 * These are generic, reusable functions for manipulating arrays of objects with IDs
 */

/**
 * Adds items to an array, skipping duplicates based on ID
 * @param items - Existing array of items
 * @param newItems - Items to add
 * @param getId - Function to extract ID from an item (defaults to item.id)
 * @returns New array with unique items added
 */
export function addUnique<T>(
    items: T[],
    newItems: T[],
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    const existingIds = new Set(items.map(getId));
    const uniqueNewItems = newItems.filter((item) => !existingIds.has(getId(item)));
    return [...items, ...uniqueNewItems];
}

/**
 * Adds a single item to an array if it doesn't already exist
 * @param items - Existing array of items
 * @param newItem - Item to add
 * @param getId - Function to extract ID from an item
 * @returns New array with item added if unique
 */
export function addUniqueItem<T>(
    items: T[],
    newItem: T,
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    const exists = items.some((item) => getId(item) === getId(newItem));
    return exists ? items : [...items, newItem];
}

/**
 * Removes an item from an array by ID
 * @param items - Array of items
 * @param id - ID of the item to remove
 * @param getId - Function to extract ID from an item
 * @returns New array without the specified item
 */
export function removeById<T>(
    items: T[],
    id: string,
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    return items.filter((item) => getId(item) !== id);
}

/**
 * Updates an item in an array by ID with partial data
 * @param items - Array of items
 * @param id - ID of the item to update
 * @param updates - Partial data to merge into the item
 * @param getId - Function to extract ID from an item
 * @returns New array with the updated item
 */
export function updateById<T>(
    items: T[],
    id: string,
    updates: Partial<T>,
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    return items.map((item) =>
        getId(item) === id ? { ...item, ...updates } : item
    );
}

/**
 * Finds an item in an array by ID
 * @param items - Array of items
 * @param id - ID to search for
 * @param getId - Function to extract ID from an item
 * @returns The found item or undefined
 */
export function findById<T>(
    items: T[],
    id: string,
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T | undefined {
    return items.find((item) => getId(item) === id);
}

/**
 * Filters items by a list of IDs
 * @param items - Array of items
 * @param ids - IDs to include
 * @param getId - Function to extract ID from an item
 * @returns Array of items matching the IDs
 */
export function filterByIds<T>(
    items: T[],
    ids: string[],
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    const idSet = new Set(ids);
    return items.filter((item) => idSet.has(getId(item)));
}

/**
 * Replaces an item in an array by ID, or adds it if not found
 * @param items - Array of items
 * @param newItem - Item to upsert
 * @param getId - Function to extract ID from an item
 * @returns New array with the item replaced or added
 */
export function upsertById<T>(
    items: T[],
    newItem: T,
    getId: (item: T) => string = (item) => (item as { id: string }).id
): T[] {
    const id = getId(newItem);
    const exists = items.some((item) => getId(item) === id);
    if (exists) {
        return items.map((item) => (getId(item) === id ? newItem : item));
    }
    return [...items, newItem];
}
