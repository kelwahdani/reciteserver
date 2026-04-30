/* eslint-disable no-console */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

dotenv.config({ path: path.join(process.cwd(), '.env') });

interface UploadResponse {
  Location: string;
}

const s3Client = new S3Client({
  region: 'us-east-1', // Set any valid region
  endpoint: `${process.env.DO_SPACE_ENDPOINT}`,
  credentials: {
    accessKeyId: `${process.env.DO_SPACE_ACCESS_KEY}`,
    secretAccessKey: `${process.env.DO_SPACE_SECRET_KEY}`,
  },
});

export const uploadToDigitalOceanAWS = async (
  // eslint-disable-next-line no-undef
  file: Express.Multer.File,
): Promise<UploadResponse> => {
  try {
    // Ensure the file exists before uploading
    await fs.promises.access(file.path, fs.constants.F_OK);

    const fileStream: Readable = fs.createReadStream(file.path);

    // Prepare the upload command
    const command = new PutObjectCommand({
      Bucket: `${process.env.DO_SPACE_BUCKET}`,
      Key: `${file.originalname}`,
      Body: fileStream,
      ACL: 'public-read',
      ContentType: file.mimetype,
    });

    // Execute the upload
    await s3Client.send(command);

    // Construct the direct URL to the uploaded file
    const Location = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${file.originalname}`;

    return { Location };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error uploading file: ${file.path}`, error);
    throw error;
  }
};

export const deleteFromDigitalOceanAWS = async (
  fileUrl: string,
): Promise<void> => {
  try {
    // Extract the file key from the URL
    const key = fileUrl.replace(
      `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/`,
      '',
    );

    // Prepare the delete command
    const command = new DeleteObjectCommand({
      Bucket: `${process.env.DO_SPACE_BUCKET}`,
      Key: key,
    });

    // Execute the delete command
    await s3Client.send(command);

   
  } catch (error: any) {
    console.error(`Error deleting file: ${fileUrl}`, error);
    throw new Error(`Failed to delete file: ${error?.message}`);
  }
};
