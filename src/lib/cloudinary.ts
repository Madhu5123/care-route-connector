export const uploadToCloudinary = async (file: File, folderPath: string): Promise<string> => {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "my_unsigned_preset"); // Set this in Cloudinary
  formData.append("folder", folderPath);

  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/dlfudfaih/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("Failed to upload to Cloudinary");
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return "";
  }
};
