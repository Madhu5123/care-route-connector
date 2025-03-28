
// Cloudinary configuration and upload utility
import { v2 as cloudinary } from 'cloudinary';

// Initialize the Cloudinary configuration
// Note: These values should ideally be stored in environment variables
cloudinary.config({
  cloud_name: 'your-cloud-name', // REPLACE WITH YOUR CLOUDINARY CLOUD NAME
  api_key: 'your-api-key',       // REPLACE WITH YOUR CLOUDINARY API KEY
  api_secret: 'your-api-secret', // REPLACE WITH YOUR CLOUDINARY API SECRET
  secure: true
});

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload
 * @param folderPath The folder path in Cloudinary
 * @returns Promise with the URL of the uploaded image
 */
export const uploadToCloudinary = async (file: File, folderPath: string): Promise<string> => {
  if (!file) return "";
  
  return new Promise((resolve, reject) => {
    // Convert the file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        // The base64 data URL
        const base64Data = reader.result as string;
        
        // Upload to Cloudinary
        const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file: base64Data,
            upload_preset: 'unsigned_upload', // Create an unsigned upload preset in your Cloudinary dashboard
            folder: folderPath
          })
        });
        
        const data = await response.json();
        
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error('Failed to upload to Cloudinary'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
