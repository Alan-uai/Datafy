
"use client";
import { MatrixBackground } from "@/components/shared/MatrixBackground";
import React from "react";

// This page is now a simple wrapper for the background component,
// useful for isolated testing or viewing.
export default function MatrixPage() {
    return <MatrixBackground mode="padrão" speed={100}/>
}
