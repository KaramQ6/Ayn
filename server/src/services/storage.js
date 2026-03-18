import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadAvatarFile(localFilePath) {
  if (cloudinaryConfigured()) {
    configureCloudinary();
    const uploaded = await cloudinary.uploader.upload(localFilePath, {
      folder: 'forestguard/avatars',
      resource_type: 'image',
    });
    await fs.unlink(localFilePath);
    return uploaded.secure_url;
  }

  return `/uploads/${path.basename(localFilePath)}`;
}
