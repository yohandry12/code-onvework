import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

// Import Swiper React components
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// Icônes (utilisez heroicons ou lucide-react selon votre préférence)
import { StarIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

// --- Sous-composant pour les boutons de navigation personnalisés ---
const SwiperNavButtons = () => {
  const swiper = useSwiper();
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => swiper.slidePrev()}
        className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => swiper.slideNext()}
        className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
      >
        <ArrowRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// --- Sous-composant pour une carte de témoignage ---
const TestimonialCard = ({ testimonial }) => {
  const { author, content } = testimonial;
  const fullName = `${author.profile.firstName} ${author.profile.lastName}`;
  const roleAndCompany =
    author.role === "client"
      ? `Client, ${author.profile.company || "Entreprise"}`
      : `${author.profile.profession || "Freelance"}`;

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-white/10 p-8 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <img
          src={
            author.profile.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              fullName
            )}&background=2dd4bf&color=000&bold=true`
          }
          alt={fullName}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <p className="font-bold text-white">{fullName}</p>
          <p className="text-sm text-gray-400">{roleAndCompany}</p>
        </div>
      </div>
      {/* L'API actuelle n'a pas de notes, on les met en dur pour le style */}
      <div className="flex items-center my-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
        ))}
        <span className="ml-2 text-white font-bold">5.0</span>
      </div>
      <p className="text-gray-300 italic flex-grow">"{content}"</p>
    </div>
  );
};

// --- Composant principal de la section ---
const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true; // Pour éviter les mises à jour d'état sur un composant démonté
    setLoading(true);

    apiService.testimonials
      .getFeatured()
      .then((response) => {
        if (!mounted) return;

        // --- LA CORRECTION EST ICI ---
        // On vérifie que la réponse est bonne ET que la clé 'testimonials' est bien un tableau.
        if (response.success && Array.isArray(response.testimonials)) {
          setTestimonials(response.testimonials);
        } else {
          console.warn(
            "La réponse de l'API pour les témoignages n'a pas le format attendu."
          );
          setTestimonials([]); // On met un tableau vide en cas de problème
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Erreur chargement témoignages:", err);
          setTestimonials([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-white">
        Chargement des témoignages...
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // Ne rien afficher si aucun témoignage n'est disponible
  }

  return (
    <section className="bg-[#1a1a1a] text-white py-24">
      <div className="max-w-6xl mx-auto px-8 text-center">
        <span className="inline-block px-4 py-1.5 bg-white/10 text-sm font-semibold rounded-full border border-white/20 mb-4">
          NOS CLIENTS & FREELANCES
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Nos histoires à succès
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
          Découvrez comment notre plateforme a aidé des leaders à trouver les
          talents parfaits et des freelances à réaliser leurs ambitions.
        </p>

        <Swiper
          modules={[Navigation]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial._id}>
              <TestimonialCard testimonial={testimonial} />
            </SwiperSlide>
          ))}
          <SwiperNavButtons />
        </Swiper>
      </div>
    </section>
  );
};

export default TestimonialsSection;
