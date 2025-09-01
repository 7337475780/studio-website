import { PortfolioItem } from "@/components/Portfolio";
import { Service } from "@/components/ServiceCard";
import { Testimonial } from "@/components/Testimonials";

export const NavbarItems = [
  { label: "Home", path: "/" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Services", path: "/services" },
  { label: "Booking", path: "/booking" },
  { label: "Contact", path: "/contact" },
];

export const portfolio: PortfolioItem[] = [
  {
    id: 1,
    title: "Drone Photography",
    category: "Drone",
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
    id: 2,
    title: "Pre-Wedding Shoots",
    category: "Prewedding",
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
    id: 3,
    title: "Event Coverage",
    category: "Event",
    description: "Complete event photography and videography services.",
    image: "/images/event.jpg",
    galleryImages: ["/images/gallery/event1.jpg", "/images/gallery/event2.jpg"],
  },
  {
    id: 4,
    title: "Marriage Photography",
    category: "Marriage",
    description:
      "Capture the most special moments of your wedding day in style.",
    image: "/images/marriage.jpg",
    galleryImages: [
      "/images/gallery/marriage1.jpg",
      "/images/gallery/marriage2.jpg",
      "/images/gallery/marriage3.jpg",
    ],
  },
  {
    id: 5,
    title: "Passport & ID Photos",
    category: "Passport",
    description:
      "Professional and quick passport, visa, and ID photo services.",
    image: "/images/passport.jpg",
    galleryImages: [
      "/images/gallery/passport1.jpg",
      "/images/gallery/passport2.jpg",
    ],
  },
  {
    id: 6,
    title: "Corporate Events",
    category: "Event",
    description:
      "Professional coverage of corporate events, seminars, and parties.",
    image: "/images/corporate.jpg",
    galleryImages: [
      "/images/gallery/corporate1.jpg",
      "/images/gallery/corporate2.jpg",
    ],
  },
  {
    id: 7,
    title: "Fashion Shoots",
    category: "Fashion",
    description:
      "Creative fashion photography to showcase style and personality.",
    image: "/images/fashion.jpg",
    galleryImages: [
      "/images/gallery/fashion1.jpg",
      "/images/gallery/fashion2.jpg",
    ],
  },
];

// export const services: Service[] = [
//   {
//     title: "Drone Photography",
//     description:
//       "Capture breathtaking aerial views with our high-quality drones.",
//     image: "/images/drone.jpg",
//     galleryImages: [
//       "/images/gallery/drone1.jpg",
//       "/images/gallery/drone2.jpg",
//       "/images/gallery/drone3.jpg",
//     ],
//   },
//   {
//     title: "Pre-Wedding Shoots",
//     description:
//       "Beautifully curated pre-wedding shoots to capture your love story.",
//     image: "/images/prewedding.jpg",
//     galleryImages: [
//       "/images/gallery/pre1.jpg",
//       "/images/gallery/pre2.jpg",
//       "/images/gallery/pre3.jpg",
//     ],
//   },
//   {
//     title: "Event Coverage",
//     description: "Complete event photography and videography services.",
//     image: "/images/event.jpg",
//     galleryImages: ["/images/gallery/event1.jpg", "/images/gallery/event2.jpg"],
//   },
// ];

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Tharun Chandra Lingala",
    feedback: "Absolutely loved the drone shots! The quality is superb.",
    photo: "/images/clients/tharun.jpg",
    rating: 5,
  },
  {
    id: 2,
    name: "Ananya Sharma",
    feedback: "Pre-wedding shoot was magical. Highly professional team!",
    photo: "/images/clients/ananya.jpg",
    rating: 5,
  },
  {
    id: 3,
    name: "Suresh Bhat",
    feedback: "Event coverage was seamless and captured every moment.",
    photo: "/images/clients/suresh.jpg",
    rating: 4,
  },
];
