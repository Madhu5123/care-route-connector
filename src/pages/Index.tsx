
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    // Clear timeout if component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background animate-fade-in">
      <div className="text-center flex flex-col items-center">
        <Heart 
          className="h-24 w-24 text-ambulance-DEFAULT mb-4 animate-pulse" 
          fill="#FF6B6B"
        />
        <h1 className="text-4xl font-bold tracking-tight animate-scale-in">
          Lifeline AI
        </h1>
      </div>
    </div>
  );
};

export default Index;
