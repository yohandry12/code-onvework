import React from "react";
import { Link } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";
import { Clock, BookOpen, User } from "lucide-react";
import { formatPoints } from "../../utils/format";

// Fonction utilitaire identique à celle de AllTrainings pour l'image
const getCourseImage = (path) => {
  if (!path) return "https://placehold.co/600x360?text=Cours";
  if (path.startsWith("http")) return path;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  return `${apiUrl.replace(/\/api$/, "")}${path}`;
};

const TrainingCard = ({ course }) => {
  // Calculs des données
  const rating = parseFloat(course.averageRating) || 0;
  const roundedRating = Math.round(rating);
  const studentCount = course.totalStudents || 0;

  // Calcul durée (Même logique que AllTrainings)
  const durationHours = Math.floor((course.duration || 0) / 60);
  const durationMinutes = (course.duration || 0) % 60;

  // Nom du formateur
  const trainerName = course.trainer?.trainerProfile
    ? `${course.trainer.trainerProfile.firstName} ${course.trainer.trainerProfile.lastName}`
    : "Formateur";

  return (
    <Link
      to={`/trainings/${course.id}`}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
    >
      {/* --- 1. Image & Badges --- */}
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden shrink-0">
        <img
          src={getCourseImage(course.thumbnail)}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge Niveau (Style identique à AllTrainings) */}
        <div className="absolute top-2 left-2">
          {course.level === "Débutant" ? (
            <span className="bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 uppercase shadow-sm rounded">
              {course.level}
            </span>
          ) : (
            <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 uppercase shadow-sm rounded backdrop-blur-sm">
              {course.level || "Niveau"}
            </span>
          )}
        </div>

        {/* Badge "Meilleure vente" si applicable */}
        {course.status === "published" && (
          <div className="absolute bottom-2 right-2 hidden group-hover:block">
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Voir le cours
            </span>
          </div>
        )}
      </div>

      {/* --- 2. Contenu --- */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Titre */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
          {course.title}
        </h3>

        {/* Formateur */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <User size={12} />
          <span className="truncate">{trainerName}</span>
        </div>

        {/* Description courte */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow">
          {course.description}
        </p>

        {/* Métadonnées (Durée & Leçons) */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>
              {durationHours}h{" "}
              {durationMinutes > 0 ? `${durationMinutes}m` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={14} />
            <span>{course.totalLessons || 0} leçons</span>
          </div>
        </div>

        {/* Notation */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center text-sm font-bold text-yellow-700">
            <span className="mr-1">{rating.toFixed(1)}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < roundedRating ? "text-yellow-500" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 font-normal ml-1 text-xs">
              ({studentCount})
            </span>
          </div>
        </div>
      </div>

      {/* --- 3. Prix (Footer) --- */}
      <div className="px-4 pb-4 pt-0 mt-auto flex items-end justify-between">
        <div className="flex flex-col">
          {course.discountPrice > 0 ? (
            <>
              <span className="text-xs text-gray-400 line-through">
                {formatPoints(course.discountPrice)}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatPoints(course.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatPoints(course.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TrainingCard;
