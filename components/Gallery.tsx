import React from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

interface Photo {
  original: string;
  thumbnail: string;
  description?: string;
}

interface GalleryProps {
  photos: Photo[];
}
export default function Gallery({ photos }: GalleryProps) {
  return <ImageGallery items={photos} showPlayButton={false} />;
}
