import { Service } from "@/components/ServiceCard";

export const NavbarItems = [
  { label: "Home", path: "/" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Services", path: "/services" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "/contact" },
  { label: "Booking", path: "/booking" },
];

export const services: Service[] = [
  {
    title: "Drone Photography",
    description:
      "Capture breathtaking aerial views with our high-quality drones.",
    image: "/images/drone.jpg",
    galleryImages: [
      "/images/gallery/drone1.jpg",
      "/images/gallery/drone2.jpg",
      "/images/gallery/drone3.jpg",
    ],
  },
  {
    title: "Pre-Wedding Shoots",
    description:
      "Beautifully curated pre-wedding shoots to capture your love story.",
    image: "/images/prewedding.jpg",
    galleryImages: [
      "/images/gallery/pre1.jpg",
      "/images/gallery/pre2.jpg",
      "/images/gallery/pre3.jpg",
    ],
  },
  {
    title: "Event Coverage",
    description: "Complete event photography and videography services.",
    image: "/images/event.jpg",
    galleryImages: ["/images/gallery/event1.jpg", "/images/gallery/event2.jpg"],
  },
];
