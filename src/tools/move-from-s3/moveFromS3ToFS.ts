import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import {createWriteStream} from 'fs';
import fs from 'fs/promises';
import path from 'path';
import {pipeline} from 'stream/promises';

export interface MoveFromS3Config {
  bucketName: string;
  destinationPath: string;
  awsConfig: {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  concurrency?: number;
}

interface MoveStats {
  totalFiles: number;
  filesProcessed: number;
  skippedFiles: number;
  errors: Array<{
    key: string;
    error: Error;
  }>;
}

export async function moveFromS3ToFS(
  config: MoveFromS3Config
): Promise<MoveStats> {
  const stats: MoveStats = {
    totalFiles: 0,
    filesProcessed: 0,
    skippedFiles: 0,
    errors: [],
  };

  const s3Client = new S3Client(config.awsConfig);
  const concurrency = config.concurrency || 5;

  async function processFile(key: string) {
    const destinationFilePath = path.join(config.destinationPath, key);
    const destinationDir = path.dirname(destinationFilePath);

    try {
      // Get S3 object metadata first
      const getObjectCommand = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);
      const s3FileSize = response.ContentLength;

      // Check if file already exists and has the same size
      try {
        const fileStats = await fs.stat(destinationFilePath);
        if (s3FileSize === fileStats.size) {
          stats.skippedFiles++;
          return;
        }
      } catch {
        // File doesn't exist, proceed with download
      }

      // Ensure directory exists
      await fs.mkdir(destinationDir, {recursive: true});

      if (!response.Body) {
        throw new Error(`No body returned for key: ${key}`);
      }

      // Stream the file to disk
      await pipeline(
        response.Body as NodeJS.ReadableStream,
        createWriteStream(destinationFilePath)
      );

      stats.filesProcessed++;
    } catch (error) {
      stats.errors.push({
        key,
        error: error as Error,
      });
    }
  }

  async function processBatch(keys: string[]) {
    await Promise.all(keys.map(key => processFile(key)));
  }

  let continuationToken: string | undefined;
  const batchSize = 1000;
  let currentBatch: string[] = [];

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucketName,
      MaxKeys: batchSize,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(listCommand);
    continuationToken = response.NextContinuationToken;

    if (response.Contents) {
      stats.totalFiles += response.Contents.length;

      for (const object of response.Contents) {
        if (object.Key) {
          currentBatch.push(object.Key);

          if (currentBatch.length >= concurrency) {
            await processBatch(currentBatch);
            currentBatch = [];
          }
        }
      }
    }
  } while (continuationToken);

  // Process remaining files
  if (currentBatch.length > 0) {
    await processBatch(currentBatch);
  }

  return stats;
}
