/** @format */

// next/image loader: Cloudinary resizes and picks the format itself, so images
// never go through the host's image optimizer. c_limit avoids upscaling.
export default function cloudinaryLoader({ src, width, quality }) {
  const marker = "/image/upload/";
  const index = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || index < 0) return src;

  const transformations = [
    "f_auto",
    `q_${quality || "auto"}`,
    `w_${width}`,
    "c_limit",
  ].join(",");
  const start = index + marker.length;
  return `${src.slice(0, start)}${transformations}/${src.slice(start)}`;
}
