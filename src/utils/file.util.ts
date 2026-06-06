import path from "path";
import fs from 'fs/promises';

// supported file type keys
export type FileType = 'image' | 'csv' | 'audio' | 'video';

// file size limits for different file types
export const fileSizeLimits: Record<FileType, number> = {
    image: 10 * 1024 * 1024, // 10 MB
    csv: 10 * 1024 * 1024, // 10 MB
    audio: 8 * 1024 * 1024, // 8 MB
    video: 50 * 1024 * 1024 // 50 MB
};

// allowed file extensions / MIME types
export const fileTypes: Record<FileType, RegExp> = {
    image: /jpeg|jpg|png|svg|gif|webp|bmp/,
    csv: /csv/,
    audio: /mp3|wav|aac|ogg|flac/,
    video: /mp4|avi|mkv|mov|flv|webm/
};

/**
 * Upload a file from Multer memory storage to local filesystem.
 * Validates file size, file type, and creates folder dynamically.
 * @param file - Multer uploaded file
 * @param fileType - File category (image, csv, audio, video)
 * @param storagePath - Subdirectory under /uploads where the file should be stored
 * @returns URL path to the uploaded file
 */
export const uploadFile = async (file: Express.Multer.File, fileType: FileType, storagePath: string): Promise<string> => {
    // Validate file size
    if (file.size > fileSizeLimits[fileType]) {
        throw new Error(`File size exceeds the limit of ${fileSizeLimits[fileType] / (1024 * 1024)} MB`);
    }

    // Validate file type (extension + MIME)
    const extnameValid = fileTypes[fileType].test(path.extname(file.originalname).toLowerCase());
    const mimetypeValid = fileTypes[fileType].test(file.mimetype);
    if (!extnameValid || !mimetypeValid) {
        throw new Error(`Invalid file type. Only ${fileType} files are allowed.`);
    }

    // Ensure storage directory exists
    const directoryPath = path.join(__dirname, '../uploads', storagePath);
    await fs.mkdir(directoryPath, { recursive: true });

    // Construct safe filename
    const sanitizedName = file.originalname.replace(/\s+/g, '_');
    const filename = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(directoryPath, filename);

    // Write file from buffer
    await fs.writeFile(filePath, file.buffer);

    // Return URL path (relative to uploads folder)
    return `/uploads/${storagePath}/${filename}`;
};

/**
 * Delete a file from the filesystem if it exists.
 * @param filePath - Relative or absolute path of the file to remove
 */
export const removeFile = async (filePath: string): Promise<void> => {
    try {
        const baseDir = path.resolve(__dirname, '../');
        const absolutePath = path.join(baseDir, filePath);

        try {
            await fs.unlink(absolutePath);
        } catch (error) {
            console.warn(`File not found or cannot be accessed: ${absolutePath}`);
        }
    } catch (error) {
        console.error(`Error deleting file: ${filePath}`, error);
        throw error;
    }
};