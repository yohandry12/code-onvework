import React from "react";
import { EnvelopeIcon, BriefcaseIcon } from "@heroicons/react/24/outline";

// Un petit utilitaire pour obtenir les codes de pays pour les drapeaux
const getCountryCode = (countryName) => {
  const countryMap = {
    Germany: "DE",
    Australia: "AU",
    Brazil: "BR",
    Singapore: "SG",
    France: "FR",
    Canada: "CA",
    "United States": "US",
    "United Kingdom": "GB",
    Italy: "IT",
    Spain: "ES",
    Netherlands: "NL",
    // Ajoutez d'autres pays au besoin
  };
  return countryMap[countryName] || null;
};

const TalentCard = ({ talent, onViewProfile }) => {
  const { profile } = talent;
  const countryCode = getCountryCode(profile.location?.country);
  const completedJobs = talent.profile?.completedJobs ?? 0;
  const fullName =
    profile.fullName || `${profile.firstName} ${profile.lastName}`;

  return (
    <div
      onClick={onViewProfile}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
    >
      {/* Bouton Options */}
      <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Avatar */}
      <img
        src={
          profile.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName
          )}&background=random`
        }
        alt={fullName}
        className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm"
      />

      {/* Nom et Localisation */}
      <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
      {profile.location?.country && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          {countryCode && (
            <img
              src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
              alt={profile.location.country}
            />
          )}
          <span>{profile.location.country}</span>
        </div>
      )}

      {/* Compétences */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
        <BriefcaseIcon className="w-5 h-5 text-gray-400" />
        <p className="line-clamp-1">
          {profile.skills?.slice(0, 2).join(" • ") ||
            "Aucune compétence listée"}
        </p>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <EnvelopeIcon className="w-5 h-5 text-gray-400" />
        <span className="text-gray-600">{talent.email}</span>
      </div>

      {/* Nombre de missions complétées */}
      <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
        {completedJobs} mission{completedJobs !== 1 ? "s" : ""} complétée
        {completedJobs !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TalentCard;
