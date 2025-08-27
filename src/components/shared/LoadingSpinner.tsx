"use client";
import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface LoadingSpinnerProps {
  fullPage?: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullPage = true, text = "CARREGANDO" }) => {
  const { userProfile } = useUserProfile();
  const containerClasses = fullPage 
    ? "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
    : "flex flex-col items-center justify-center py-10";

  const appNameFontClass = userProfile?.preferences?.activeFont === "Datafy" ? "font-datafy" : "";

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 font-bold">
            <LayoutDashboard style={{ width: 40, height: 40 }} className="text-primary" />
            <h1 className={`text-3xl ${appNameFontClass}`}>Datafy</h1>
        </div>
      </motion.div>
      <div className="relative mt-4 w-64 h-8 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <p className="absolute inset-0 flex items-center justify-center text-sm font-bold tracking-widest text-background mix-blend-screen">
          {text}
        </p>
      </div>
    </div>
  );
};
