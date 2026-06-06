import { NextFunction, Request, Response } from "express";
import { catchResponse, errorResponse, fileSizeLimits, uploadFile } from "../utils";
import multer, { StorageEngine } from "multer";

// file type keys based on your utils
type FileType = keyof typeof fileSizeLimits;

export const fileUploadMiddleware = (fileType: FileType, storagePath: string): any => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use Multer's memory storage
    const storage: StorageEngine = multer.memoryStorage();

    // Initialize Multer with memory storage and dynamic file size limit
    const upload = multer({
      storage,
      limits: { fileSize: fileSizeLimits[fileType] }
    }).single('file'); // Expecting 'file' key from form data

    upload(req, res, async (err: any) => {
      if (err) return errorResponse(res, 400, err.message || 'File upload error', err);

      // If no file uploaded, just move on
      if (!req.file) {
        (req as any).fileUrl = null;
        return next();
      }

      try {
        // Upload file using custom utility
        const fileUrl = await uploadFile(req.file, fileType, storagePath);

        // Attach file URL to request for downstream use
        (req as any).fileUrl = fileUrl;

        next();
      } catch (error) {
        return catchResponse(res, 'Error uploading file', error);
      }
    });
  };
};

export const multiFileUploadMiddleware = (fields: { name: string; fileType: FileType; storagePath: string }[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const storage = multer.memoryStorage();

    // Prepare field definitions for multer
    const multerFields = fields.map(f => ({ name: f.name, maxCount: 1 }));

    const upload = multer({
      storage,
      limits: { fileSize: Math.max(...fields.map(f => fileSizeLimits[f.fileType])) } // largest size among all
    }).fields(multerFields);

    upload(req, res, async (err: any) => {
      if (err) return errorResponse(res, 400, err.message || 'File upload error', err);

      try {
        // Process each uploaded file
        for (const f of fields) {
          const file = (req.files as any)?.[f.name]?.[0];
          if (!file) continue;

          const fileUrl = await uploadFile(file, f.fileType, f.storagePath);
          (req as any)[`${f.name}Url`] = fileUrl; // e.g. req.bannerUrl, req.profileImageUrl
        }

        next();
      } catch (error) {
        return catchResponse(res, 'Error uploading file(s)', error);
      }
    });
  };
};

export const multiFileUploadMiddlewareV2 = (
  fileType: FileType,
  storagePath: string,
  keyName: string = "files" // default form-data key
): any => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const storage: StorageEngine = multer.memoryStorage();

    const upload = multer({
      storage,
      limits: { fileSize: fileSizeLimits[fileType] },
    }).array(keyName); // multiple files with same key

    upload(req, res, async (err: any) => {
      if (err)
        return errorResponse(
          res,
          400,
          err.message || "File upload error",
          err
        );

      const files = req.files as Express.Multer.File[];

      // If no files uploaded
      if (!files || files.length === 0) {
        (req as any).fileUrls = [];
        return next();
      }

      try {
        const fileUrls: string[] = [];

        // Upload each file using your custom function
        for (const file of files) {
          const fileUrl = await uploadFile(file, fileType, storagePath);
          fileUrls.push(fileUrl);
        }

        // Attach uploaded file URLs to request
        (req as any).fileUrls = fileUrls;
        next();
      } catch (error) {
        return catchResponse(res, "Error uploading files", error);
      }
    });
  };
};