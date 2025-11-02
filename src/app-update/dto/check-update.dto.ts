export interface CheckUpdateResponse {
  hasUpdate: boolean;
  version?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  fileSize?: number;
  checksum?: string;
}
