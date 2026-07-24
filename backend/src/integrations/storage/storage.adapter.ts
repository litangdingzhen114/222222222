export interface StoredFile {
  filename: string;
  path: string;
  url: string;
}

export interface StorageAdapter {
  save(file: Express.Multer.File): Promise<StoredFile>;
}
