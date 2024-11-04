export type Environment = "development" | "production";
export type StorageType = "local-storage" | "indexeddb" | "session-storage";
export type SdkOptions = {
    environment?: Environment;
    storage_type?: StorageType;
    api_key: string;
}