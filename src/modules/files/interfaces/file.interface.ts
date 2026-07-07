/** Shape of a Multer-uploaded file (in-memory buffer). */
export interface BufferedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer | string;
}
