export interface IStorage {
    getItem: () => Promise<string | null>;
    setItem: (value: string) => Promise<void>;
    removeItem: () => Promise<void>;
}