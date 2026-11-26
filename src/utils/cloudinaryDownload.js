export const getCloudinaryAttachmentUrl = (assetUrl, fileName) => {
  const url = new URL(assetUrl);
  const uploadPath = "/video/upload/";
  const uploadPathIndex = url.pathname.indexOf(uploadPath);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    uploadPathIndex === -1
  ) {
    throw new Error("The video download URL is invalid.");
  }

  const safeFileName = fileName
    .replace(/[^a-z0-9._-]/gi, "-")
    .replace(/\.[^.]+$/, "");
  if (!safeFileName) {
    throw new Error("A valid file name is required to download the video.");
  }

  const transformationIndex = uploadPathIndex + uploadPath.length;
  url.pathname = `${url.pathname.slice(0, transformationIndex)}fl_attachment:${safeFileName}/${url.pathname.slice(transformationIndex)}`;

  return url.toString();
};
