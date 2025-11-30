import mongoose from 'mongoose';
import { GridFSBucket, GridFSBucketReadStream, GridFSBucketWriteStream } from 'mongodb';
import { Readable } from 'stream';

export class GridFSManager {
  private bucket: GridFSBucket;

  constructor() {
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection not established');
    }
    this.bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'planFiles'
    });
  }

  /**
   * Store a file in GridFS
   * @param buffer File buffer
   * @param filename Original filename
   * @param metadata Additional metadata
   * @returns Promise<ObjectId> File ID
   */
  async storeFile(
    buffer: Buffer,
    filename: string,
    metadata?: any
  ): Promise<mongoose.Types.ObjectId> {
    return new Promise((resolve, reject) => {
      const uploadStream: GridFSBucketWriteStream = this.bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          uploadDate: new Date(),
          contentType: 'application/pdf'
        }
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        console.log(`✅ File stored in GridFS: ${filename} (ID: ${uploadStream.id})`);
        resolve(uploadStream.id as mongoose.Types.ObjectId);
      });

      // Create a readable stream from buffer and pipe to GridFS
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Retrieve a file from GridFS as buffer
   * @param fileId GridFS file ID
   * @returns Promise<Buffer> File buffer
   */
  async getFileBuffer(fileId: mongoose.Types.ObjectId): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const downloadStream: GridFSBucketReadStream = this.bucket.openDownloadStream(fileId);

      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        reject(error);
      });

      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ File retrieved from GridFS: ${fileId} (${buffer.length} bytes)`);
        resolve(buffer);
      });
    });
  }

  /**
   * Get a readable stream for a file
   * @param fileId GridFS file ID
   * @returns GridFSBucketReadStream
   */
  getFileStream(fileId: mongoose.Types.ObjectId): GridFSBucketReadStream {
    return this.bucket.openDownloadStream(fileId);
  }

  /**
   * Delete a file from GridFS
   * @param fileId GridFS file ID
   * @returns Promise<void>
   */
  async deleteFile(fileId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.bucket.delete(fileId);
      console.log(`🗑️ File deleted from GridFS: ${fileId}`);
    } catch (error) {
      console.error('GridFS delete error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param fileId GridFS file ID
   * @returns Promise<any> File metadata
   */
  async getFileMetadata(fileId: mongoose.Types.ObjectId): Promise<any> {
    try {
      const files = await this.bucket.find({ _id: fileId }).toArray();
      if (files.length === 0) {
        throw new Error(`File not found: ${fileId}`);
      }
      return files[0];
    } catch (error) {
      console.error('GridFS metadata error:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists in GridFS
   * @param fileId GridFS file ID
   * @returns Promise<boolean>
   */
  async fileExists(fileId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const files = await this.bucket.find({ _id: fileId }).toArray();
      return files.length > 0;
    } catch (error) {
      console.error('GridFS exists check error:', error);
      return false;
    }
  }
}

// Singleton instance
let gridFSManager: GridFSManager | null = null;

export function getGridFSManager(): GridFSManager {
  if (!gridFSManager) {
    gridFSManager = new GridFSManager();
  }
  return gridFSManager;
}

export function resetGridFSManager(): void {
  gridFSManager = null;
}