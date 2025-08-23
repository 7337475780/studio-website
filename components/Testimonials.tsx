"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

export interface Testimonial {
  id: number;
  name: string;
  feedback: string;
  photo?: string;
  rating?: number; // 1-5 stars
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

gsap.registerPlugin(ScrollTrigger);

const Testimonials = ({ testimonials }: TestimonialsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const starsRefs = useRef<HTMLDivElement[][]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, idx) => {
        // Animate card entrance
        gsap.from(card, {
          opacity: 0,
          y: 80,
          scale: 0.85,
          rotationX: -10,
          rotationY: 5,
          transformOrigin: "center center",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            toggleActions: "play reverse play reverse",
          },
          onComplete: () => {
            // Animate stars
            const stars = starsRefs.current[idx];
            if (stars && stars.length > 0) {
              gsap.fromTo(
                stars,
                { scale: 0, opacity: 0, rotation: -20 },
                {
                  scale: 1,
                  opacity: 1,
                  rotation: 0,
                  stagger: 0.1,
                  duration: 0.4,
                  ease: "back.out(1.7)",
                }
              );
            }
          },
        });

        // Hover animation for stars
        if (starsRefs.current[idx]) {
          const stars = starsRefs.current[idx];
          card.addEventListener("mouseenter", () => {
            gsap.to(stars, {
              y: -5,
              rotation: 10,
              duration: 0.4,
              stagger: 0.05,
              ease: "power1.inOut",
            });
          });
          card.addEventListener("mouseleave", () => {
            gsap.to(stars, {
              y: 0,
              rotation: 0,
              duration: 0.4,
              stagger: 0.05,
              ease: "power1.inOut",
            });
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [testimonials]);

  return (
    <section className="py-16 bg-black text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-12">What Our Clients Say</h2>

        <div
          ref={containerRef}
          className="grid md:grid-cols-3 gap-8 perspective-1000"
        >
          {testimonials.map((t, idx) => (
            <div
              key={t.id}
              ref={(el) => el && (cardsRef.current[idx] = el)}
              className="bg-[rgba(255,255,255,0.05)] p-6 rounded-lg shadow-lg cursor-pointer hover:scale-105 hover:rotateY-2 transition-transform duration-300"
            >
              {t.photo && (
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-16 h-16 mx-auto rounded-full mb-4 object-cover"
                />
              )}
              <p className="mb-4 text-gray-200 italic">"{t.feedback}"</p>
              <h4 className="font-semibold">{t.name}</h4>

              {t.rating && (
                <div
                  className="flex justify-center mt-2"
                  ref={(el) => {
                    if (el)
                      starsRefs.current[idx] = Array.from(
                        el.children
                      ) as HTMLDivElement[];
                  }}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400 opacity-0 scale-0">
                      ★
                    </span>
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, i) => (
                    <span key={i} className="text-gray-500 opacity-0 scale-0">
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
