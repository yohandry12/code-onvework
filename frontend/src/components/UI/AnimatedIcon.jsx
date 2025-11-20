import React from "react";

const AnimatedIcon = ({ className, children, animation = "pulse" }) => {
  // Définir les classes d'animation basées sur la prop
  const animationClasses = {
    pulse: "animate-pulse",
    spin: "animate-spin",
    ping: "animate-ping",
    bounce: "animate-bounce",
    float: "animate-float", // Animation personnalisée
  };

  return (
    <div className={`absolute ${className} ${animationClasses[animation]}`}>
      {children}
    </div>
  );
};

export default AnimatedIcon;
