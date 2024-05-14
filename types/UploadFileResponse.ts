export interface UploadFileResponse {
  kind: string;
  id: string;
  selfLink: string;
  mediaLink: string;
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  storageClass: string;
  size: number;
  md5Hash: string;
  contentEncoding: string;
  crc32c: string;
  etag: string;
  timeCreated: Date;
  updated: Date;
  timeStorageClassUpdated: Date;
}
