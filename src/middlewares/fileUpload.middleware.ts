import { NextFunction, Request, Response } from "express";
import { catchResponse, errorResponse, fileSizeLimits, uploadFile } from "../utils";
import multer from "multer";

// file type keys based on your utils
type FileType = keyof typeof fileSizeLimits;

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