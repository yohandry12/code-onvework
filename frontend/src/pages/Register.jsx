// import { motion } from "framer-motion";
// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { apiService } from "../services/api";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: "candidate",
//     company: "",
//     employerType: "",
//     age: "",
//     diplomas: [],
//     sector: "",
//     commercialName: "",
//     associationName: "",
//     phone: "",
//     locationCity: "",
//     locationCountry: "",
//   });

//   const [errors, setErrors] = useState({});
//   const [apiError, setApiError] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//     if (errors[name]) {
//       setErrors({ ...errors, [name]: "" });
//     }
//   };

//   // Gestion des diplômes
//   const handleDiplomaChange = (idx, field, value) => {
//     const newDiplomas = [...formData.diplomas];
//     newDiplomas[idx] = { ...newDiplomas[idx], [field]: value };
//     setFormData({ ...formData, diplomas: newDiplomas });
//   };
//   const addDiploma = () => {
//     setFormData({
//       ...formData,
//       diplomas: [...formData.diplomas, { type: "", scan: "" }],
//     });
//   };
//   const removeDiploma = (idx) => {
//     const newDiplomas = [...formData.diplomas];
//     newDiplomas.splice(idx, 1);
//     setFormData({ ...formData, diplomas: newDiplomas });
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.firstName.trim())
//       newErrors.firstName = "Le prénom est requis.";
//     if (!formData.lastName.trim()) newErrors.lastName = "Le nom est requis.";
//     if (!formData.email.trim()) {
//       newErrors.email = "L'email est requis.";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "L'email est invalide.";
//     }
//     if (formData.password.length < 8)
//       newErrors.password = "Le mot de passe doit faire au moins 8 caractères.";
//     if (formData.password !== formData.confirmPassword)
//       newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
//     if (formData.role === "client" && !formData.employerType)
//       newErrors.employerType = "Type d'employeur requis.";
//     if (
//       formData.role === "client" &&
//       formData.employerType === "Entreprise formelle" &&
//       !formData.company.trim()
//     ) {
//       newErrors.company =
//         "Le nom de l'entreprise est requis pour une entreprise formelle.";
//     }
//     if (
//       formData.role === "candidate" &&
//       (!formData.age || isNaN(formData.age) || Number(formData.age) < 16)
//     )
//       newErrors.age = "Âge requis (>= 16 ans).";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setApiError("");
//     setSuccessMsg("");
//     console.log("Soumission du formulaire", formData);
//     if (!validateForm()) {
//       setApiError("Veuillez corriger les erreurs du formulaire.");
//       return;
//     }
//     setLoading(true);
//     const payload = {
//       firstName: formData.firstName,
//       lastName: formData.lastName,
//       email: formData.email,
//       password: formData.password,
//       role: formData.role,
//     };
//     if (formData.role === "client") {
//       payload.company = formData.company;
//       payload.employerType = formData.employerType;
//       payload.sector = formData.sector;
//       payload.phone = formData.phone;
//       payload.location = {
//         city: formData.locationCity,
//         country: formData.locationCountry,
//       };
//       if (formData.commercialName)
//         payload.commercialName = formData.commercialName;
//       if (formData.associationName)
//         payload.associationName = formData.associationName;
//     }
//     if (formData.role === "candidate") {
//       payload.age = Number(formData.age);
//       if (formData.diplomas.length > 0) {
//         payload.diplomas = formData.diplomas.map((d) => ({
//           type: d.type,
//           scan: d.scan,
//         }));
//       }
//     }
//     try {
//       const response = await apiService.auth.register(payload);
//       console.log("Réponse API:", response);
//       if (response.success) {
//         setSuccessMsg("Compte créé avec succès ! Redirection...");
//         login(response.user, response.token);
//         setTimeout(() => navigate("/dashboard"), 1200);
//       } else {
//         setApiError(response.error || "Erreur inconnue.");
//       }
//     } catch (err) {
//       setApiError(
//         err.response?.data?.error ||
//           "Une erreur est survenue lors de l'inscription."
//       );
//       console.error("Erreur API:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isClient = formData.role === "client";
//   const isCandidate = formData.role === "candidate";
//   const employerType = formData.employerType;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="w-full max-w-lg p-8 space-y-8 bg-white/90 backdrop-blur shadow-2xl rounded-2xl border border-white/20">
//         <div className="mb-6 text-center">
//           <h2 className="text-3xl font-bold text-indigo-700 mb-2">
//             Créez votre compte
//           </h2>
//           <p className="text-sm text-gray-600">
//             Déjà inscrit ?{" "}
//             <Link
//               to="/login"
//               className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
//             >
//               Connectez-vous ici
//             </Link>
//           </p>
//         </div>
//         {/* Affichage des erreurs/succès globales */}
//         {(apiError || successMsg) && (
//           <div
//             className={`mb-4 text-center font-semibold text-sm ${
//               apiError ? "text-red-600" : "text-green-600"
//             }`}
//           >
//             {apiError && <span>{apiError}</span>}
//             {successMsg && <span>{successMsg}</span>}
//           </div>
//         )}
//         <form className="space-y-6" onSubmit={handleSubmit} noValidate>
//           {/* Sélecteur de rôle */}
//           <div className="flex justify-center gap-2 mb-6">
//             <button
//               type="button"
//               onClick={() => setFormData({ ...formData, role: "candidate" })}
//               className={`w-1/2 py-2 rounded-xl font-medium transition-colors ${
//                 !isClient
//                   ? "bg-indigo-600 text-white shadow"
//                   : "bg-slate-100 text-slate-700 hover:bg-indigo-50"
//               }`}
//             >
//               Je suis un candidat
//             </button>
//             <button
//               type="button"
//               onClick={() => setFormData({ ...formData, role: "client" })}
//               className={`w-1/2 py-2 rounded-xl font-medium transition-colors ${
//                 isClient
//                   ? "bg-indigo-600 text-white shadow"
//                   : "bg-slate-100 text-slate-700 hover:bg-indigo-50"
//               }`}
//             >
//               Je suis un recruteur
//             </button>
//           </div>

//           {/* Section infos principales */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label
//                 htmlFor="firstName"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Prénom
//               </label>
//               <input
//                 id="firstName"
//                 name="firstName"
//                 type="text"
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 required
//                 className="input input-bordered w-full"
//                 placeholder="Prénom"
//               />
//               {errors.firstName && (
//                 <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
//               )}
//             </div>
//             <div>
//               <label
//                 htmlFor="lastName"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Nom de famille
//               </label>
//               <input
//                 id="lastName"
//                 name="lastName"
//                 type="text"
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 required
//                 className="input input-bordered w-full"
//                 placeholder="Nom de famille"
//               />
//               {errors.lastName && (
//                 <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
//               )}
//             </div>
//           </div>

//           {/* Section recruteur dynamique */}
//           {isClient && (
//             <div className="bg-slate-50 rounded-xl p-4 shadow-inner space-y-4">
//               <div>
//                 <label
//                   htmlFor="employerType"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Type d'employeur
//                 </label>
//                 <div className="relative">
//                   <select
//                     id="employerType"
//                     name="employerType"
//                     value={formData.employerType}
//                     onChange={handleChange}
//                     required
//                     className="input input-bordered w-full pr-10 appearance-none"
//                   >
//                     <option value="">Sélectionnez le type</option>
//                     <option value="Entreprise formelle">
//                       Entreprise formelle
//                     </option>
//                     <option value="Startup">Startup</option>
//                     <option value="Particulier">Particulier</option>
//                     <option value="Association">Association</option>
//                   </select>
//                   <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
//                     <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
//                       <path
//                         d="M6 8l4 4 4-4"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                     </svg>
//                   </span>
//                 </div>
//                 {errors.employerType && (
//                   <p className="text-red-500 text-xs mt-1">
//                     {errors.employerType}
//                   </p>
//                 )}
//               </div>
//               {employerType === "Entreprise formelle" && (
//                 <>
//                   <div>
//                     <label
//                       htmlFor="company"
//                       className="block text-sm font-medium text-gray-700 mb-1"
//                     >
//                       Raison sociale
//                     </label>
//                     <input
//                       id="company"
//                       name="company"
//                       type="text"
//                       value={formData.company}
//                       onChange={handleChange}
//                       required
//                       className="input input-bordered w-full"
//                       placeholder="Raison sociale"
//                     />
//                     {errors.company && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors.company}
//                       </p>
//                     )}
//                   </div>
//                 </>
//               )}
//               {employerType === "Startup" && (
//                 <div>
//                   <label
//                     htmlFor="commercialName"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Nom commercial (facultatif)
//                   </label>
//                   <input
//                     id="commercialName"
//                     name="commercialName"
//                     type="text"
//                     value={formData.commercialName}
//                     onChange={handleChange}
//                     className="input input-bordered w-full"
//                     placeholder="Nom commercial"
//                   />
//                 </div>
//               )}
//               {employerType === "Association" && (
//                 <div>
//                   <label
//                     htmlFor="associationName"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Nom de l'association
//                   </label>
//                   <input
//                     id="associationName"
//                     name="associationName"
//                     type="text"
//                     value={formData.associationName}
//                     onChange={handleChange}
//                     className="input input-bordered w-full"
//                     placeholder="Nom de l'association"
//                   />
//                 </div>
//               )}
//               <div>
//                 <label
//                   htmlFor="sector"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Secteur d'activité
//                 </label>
//                 <input
//                   id="sector"
//                   name="sector"
//                   type="text"
//                   value={formData.sector}
//                   onChange={handleChange}
//                   required
//                   className="input input-bordered w-full"
//                   placeholder="Secteur d'activité"
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="phone"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Téléphone ou WhatsApp
//                 </label>
//                 <input
//                   id="phone"
//                   name="phone"
//                   type="text"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   required
//                   className="input input-bordered w-full"
//                   placeholder="Téléphone ou WhatsApp"
//                 />
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                 <div>
//                   <label
//                     htmlFor="locationCity"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Ville
//                   </label>
//                   <input
//                     id="locationCity"
//                     name="locationCity"
//                     type="text"
//                     value={formData.locationCity}
//                     onChange={handleChange}
//                     required
//                     className="input input-bordered w-full"
//                     placeholder="Ville"
//                   />
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="locationCountry"
//                     className="block text-sm font-medium text-gray-700 mb-1"
//                   >
//                     Pays
//                   </label>
//                   <input
//                     id="locationCountry"
//                     name="locationCountry"
//                     type="text"
//                     value={formData.locationCountry}
//                     onChange={handleChange}
//                     required
//                     className="input input-bordered w-full"
//                     placeholder="Pays"
//                   />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Section candidat dynamique */}
//           {isCandidate && (
//             <div className="bg-slate-50 rounded-xl p-4 shadow-inner space-y-4">
//               <div>
//                 <label
//                   htmlFor="age"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Âge
//                 </label>
//                 <input
//                   id="age"
//                   name="age"
//                   type="number"
//                   min="16"
//                   value={formData.age}
//                   onChange={handleChange}
//                   required
//                   className="input input-bordered w-full"
//                   placeholder="Âge"
//                 />
//                 {errors.age && (
//                   <p className="text-red-500 text-xs mt-1">{errors.age}</p>
//                 )}
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Diplômes et certificats
//                 </label>
//                 {formData.diplomas.map((diploma, idx) => (
//                   <div key={idx} className="flex gap-2 mb-2 items-center">
//                     <select
//                       value={diploma.type}
//                       onChange={(e) =>
//                         handleDiplomaChange(idx, "type", e.target.value)
//                       }
//                       className="input input-bordered"
//                     >
//                       <option value="">Type de diplôme</option>
//                       <option value="CAMES">CAMES</option>
//                       <option value="GCE">GCE</option>
//                       <option value="HND">HND</option>
//                       <option value="Autre">Autre</option>
//                     </select>
//                     <input
//                       type="text"
//                       value={diploma.scan}
//                       onChange={(e) =>
//                         handleDiplomaChange(idx, "scan", e.target.value)
//                       }
//                       className="input input-bordered"
//                       placeholder="Lien ou nom du scan"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeDiploma(idx)}
//                       className="btn btn-sm btn-error"
//                     >
//                       Supprimer
//                     </button>
//                   </div>
//                 ))}
//                 <button
//                   type="button"
//                   onClick={addDiploma}
//                   className="btn btn-sm btn-primary mt-2"
//                 >
//                   Ajouter un diplôme
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Section contacts et accès */}
//           <div className="space-y-4">
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Adresse email
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//                 className="input input-bordered w-full"
//                 placeholder="Adresse email"
//               />
//               {errors.email && (
//                 <p className="text-red-500 text-xs mt-1">{errors.email}</p>
//               )}
//             </div>
//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Mot de passe
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//                 className="input input-bordered w-full"
//                 placeholder="Mot de passe"
//               />
//               {errors.password && (
//                 <p className="text-red-500 text-xs mt-1">{errors.password}</p>
//               )}
//             </div>
//             <div>
//               <label
//                 htmlFor="confirmPassword"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Confirmer le mot de passe
//               </label>
//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type="password"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 required
//                 className="input input-bordered w-full"
//                 placeholder="Confirmez votre mot de passe"
//               />
//               {errors.confirmPassword && (
//                 <p className="text-red-500 text-xs mt-1">
//                   {errors.confirmPassword}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* apiError déplacé en haut du formulaire */}
//           <div className="pt-2">
//             <button
//               type="submit"
//               disabled={loading}
//               className="btn btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
//             >
//               {loading ? "Création du compte..." : "S'inscrire"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Register;

// src/components/Register.jsx

import { motion } from "framer-motion";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "candidate",
    company: "",
    employerType: "",
    sector: "",
    commercialName: "",
    associationName: "",
    phone: "",
    locationCity: "",
    locationCountry: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "Le prénom est requis.";
    if (!formData.lastName.trim()) newErrors.lastName = "Le nom est requis.";
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email est invalide.";
    }
    if (formData.password.length < 8)
      newErrors.password = "Le mot de passe doit faire au moins 8 caractères.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";

    if (formData.role === "client" && !formData.employerType)
      newErrors.employerType = "Type d'employeur requis.";
    if (
      formData.role === "client" &&
      formData.employerType === "Entreprise formelle" &&
      !formData.company.trim()
    ) {
      newErrors.company =
        "Le nom de l'entreprise est requis pour une entreprise formelle.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");
    if (!validateForm()) {
      setApiError("Veuillez corriger les erreurs du formulaire.");
      return;
    }
    setLoading(true);

    let payload;
    if (formData.role === "candidate") {
      payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: "candidate",
      };
    } else {
      // 'client'
      payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: "client",
        company:
          formData.company ||
          formData.commercialName ||
          formData.associationName,
        employerType: formData.employerType,
        sector: formData.sector,
        phone: formData.phone,
        location: {
          city: formData.locationCity,
          country: formData.locationCountry,
        },
        commercialName: formData.commercialName || undefined,
        associationName: formData.associationName || undefined,
      };
    }

    try {
      const response = await apiService.auth.register(payload);
      if (response.success) {
        setSuccessMsg("Compte créé avec succès ! Redirection...");
        login(response.user, response.token);

        if (response.user.role === "candidate") {
          setTimeout(() => navigate("/onboarding/candidate"), 1200);
        } else {
          setTimeout(() => navigate("/dashboard"), 1200);
        }
      } else {
        setApiError(response.error || "Erreur inconnue.");
      }
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          "Une erreur est survenue lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  const isClient = formData.role === "client";
  const isCandidate = formData.role === "candidate";
  const employerType = formData.employerType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white/90 backdrop-blur shadow-2xl rounded-2xl border border-white/20">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-indigo-700 mb-2">
            Créez votre compte
          </h2>
          <p className="text-sm text-gray-600">
            Déjà inscrit ?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>

        {(apiError || successMsg) && (
          <div
            className={`mb-4 text-center font-semibold text-sm ${
              apiError ? "text-red-600" : "text-green-600"
            }`}
          >
            {apiError && <span>{apiError}</span>}
            {successMsg && <span>{successMsg}</span>}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="flex justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "candidate" })}
              className={`w-1/2 py-2 rounded-xl font-medium transition-colors ${
                isCandidate
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-indigo-50"
              }`}
            >
              Je suis un candidat
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "client" })}
              className={`w-1/2 py-2 rounded-xl font-medium transition-colors ${
                isClient
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-indigo-50"
              }`}
            >
              Je suis un recruteur
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Prénom"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom de famille
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Nom de famille"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {isCandidate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-center text-sm text-gray-500">
                Vous êtes sur le point de créer votre profil candidat. Les
                détails supplémentaires vous seront demandés à l'étape suivante.
              </p>
            </motion.div>
          )}

          {isClient && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-50 rounded-xl p-4 shadow-inner space-y-4"
            >
              <div>
                <label
                  htmlFor="employerType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type d'employeur
                </label>
                <select
                  id="employerType"
                  name="employerType"
                  value={formData.employerType}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                >
                  <option value="">Sélectionnez le type</option>
                  <option value="Entreprise formelle">
                    Entreprise formelle
                  </option>
                  <option value="Startup">Startup</option>
                  <option value="Particulier">Particulier</option>
                  <option value="Association">Association</option>
                </select>
                {errors.employerType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.employerType}
                  </p>
                )}
              </div>

              {employerType === "Entreprise formelle" && (
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Raison sociale
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="input input-bordered w-full"
                    placeholder="Raison sociale"
                  />
                  {errors.company && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.company}
                    </p>
                  )}
                </div>
              )}
              {employerType === "Startup" && (
                <div>
                  <label
                    htmlFor="commercialName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom commercial (facultatif)
                  </label>
                  <input
                    id="commercialName"
                    name="commercialName"
                    type="text"
                    value={formData.commercialName}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Nom commercial"
                  />
                </div>
              )}
              {employerType === "Association" && (
                <div>
                  <label
                    htmlFor="associationName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom de l'association
                  </label>
                  <input
                    id="associationName"
                    name="associationName"
                    type="text"
                    value={formData.associationName}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Nom de l'association"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="sector"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Secteur d'activité
                </label>
                <input
                  id="sector"
                  name="sector"
                  type="text"
                  value={formData.sector}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  placeholder="Secteur d'activité"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone ou WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  placeholder="Téléphone ou WhatsApp"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="locationCity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ville
                  </label>
                  <input
                    id="locationCity"
                    name="locationCity"
                    type="text"
                    value={formData.locationCity}
                    onChange={handleChange}
                    required
                    className="input input-bordered w-full"
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <label
                    htmlFor="locationCountry"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pays
                  </label>
                  <input
                    id="locationCountry"
                    name="locationCountry"
                    type="text"
                    value={formData.locationCountry}
                    onChange={handleChange}
                    required
                    className="input input-bordered w-full"
                    placeholder="Pays"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Adresse email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Mot de passe"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                placeholder="Confirmez votre mot de passe"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? "Création du compte..." : "S'inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
