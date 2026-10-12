// Shapes returned by the API (JSON-serialized).
import type { Pricing } from "@/lib/currency";
import type { ChannelId, PublishStatus } from "@/lib/channels/types";

export type ImageDTO = { url: string; publicId: string; provider: "cloudinary" | "local" };

export type ProductDTO = {
  _id: string;
  name: string;
  description: string;
  category: string | null;
  subcategory: string | null;
  brand: string;
  model: string;
  condition: "new" | "used" | "refurbished";
  quantity: number;
  sku: string;
  specifications: { key: string; value: string }[];
  pricing: Pricing;
  images: ImageDTO[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryDTO = { _id: string; name: string; parent: string | null; owner: string | null };

export type PublishingRecordDTO = {
  _id: string;
  product: { _id: string; name: string; images?: ImageDTO[] } | string;
  channel: ChannelId;
  status: PublishStatus;
  externalUrl?: string;
  externalId?: string;
  error?: { message: string; code?: string };
  manualContent?: string;
  attempts: number;
  history?: { status: PublishStatus; at: string }[];
  lastAttemptAt?: string;
  publishedAt?: string;
  updatedAt: string;
};

export type ChannelInfo = {
  id: ChannelId;
  mode: "api" | "manual" | "api_or_manual";
  configured: boolean;
};

export type Paginated<T> = { items: T[]; total: number; page: number; pages: number };
