import {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../../core/config/s3Config.js';
import crypto from 'crypto';

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

class S3UploadHelper {
    static async uploadFile(file, folder = '') {
        try {
            if (!file || !file.buffer) {
                throw new Error('Invalid file object');
            }

            const fileName = generateFileName();
            const fileExtension = file.originalname.split('.').pop();
            const key = folder ? `${folder}/${fileName}.${fileExtension}` : `${fileName}.${fileExtension}`;

            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: {
                    originalname: file.originalname,
                    uploadedAt: new Date().toISOString()
                }
            });

            await s3Client.send(command);

            return {
                key: key,
                fileName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('S3 upload error:', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    static async uploadMultipleFiles(files, folder = '') {
        try {
            if (!Array.isArray(files)) {
                throw new Error('Files must be an array');
            }

            const uploadPromises = files.map(file => this.uploadFile(file, folder));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Multiple files upload error:', error);
            throw new Error(`Multiple files upload failed: ${error.message}`);
        }
    }

    static async deleteFile(key) {
        try {
            if (!key) {
                throw new Error('File key is required');
            }

            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });

            await s3Client.send(command);
            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('S3 delete error:', error);
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    static async deleteMultipleFiles(keys) {
        try {
            if (!Array.isArray(keys)) {
                throw new Error('Keys must be an array');
            }

            const deletePromises = keys.map(key => this.deleteFile(key));
            await Promise.all(deletePromises);
            return { success: true, message: 'Files deleted successfully' };
        } catch (error) {
            console.error('Multiple files delete error:', error);
            throw new Error(`Multiple files deletion failed: ${error.message}`);
        }
    }

    static async getSignedUrl(key, expiresIn = 3600) {
        try {
            if (!key) {
                throw new Error('File key is required');
            }

            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });

            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            console.error('Signed URL generation error:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    static async getFileMetadata(key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });

            const metadata = await s3Client.send(command);
            return {
                key,
                size: metadata.ContentLength,
                lastModified: metadata.LastModified,
                contentType: metadata.ContentType,
                metadata: metadata.Metadata
            };
        } catch (error) {
            console.error('File metadata error:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    static extractKeyFromUrl(url) {
        if (!url) return null;
        if (!url.includes('http')) return url;
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1);
    }
}

export default S3UploadHelper;