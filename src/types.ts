export type Environment = "development" | "production";
export type StorageType = "local-storage" | "indexeddb";
export type EventType = "login";
export type SdkOptions = {
    environment?: Environment;
    storage_type?: StorageType;
    api_key: string;
}
export type ReferralLink = {
    link: string;
    marketer_id: number;
    timestamp: number;
}