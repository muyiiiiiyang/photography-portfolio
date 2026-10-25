import type { Photo, PortfolioData, SiteConfig } from "@/lib/types";

export interface GitChange {
  code: string;
  path: string;
}

export interface GitStatus {
  isRepo: boolean;
  branch?: string;
  head?: string;
  clean?: boolean;
  changes: GitChange[];
  error?: string;
}

export interface AdminSnapshot {
  portfolio: PortfolioData;
  config: SiteConfig;
  git: GitStatus;
}

export interface ApiError {
  error: string;
}

export interface UploadSuccess {
  photos: Photo[];
  errors: { name: string; message: string }[];
  warnings: string[];
}

export interface CommitResult {
  committed: boolean;
  hash?: string;
  branch?: string;
  reason?: string;
  output?: string;
  pushed?: boolean;
  pushError?: string;
}
