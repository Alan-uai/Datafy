
"use client";

import React from 'react';
import type { ThemeConfig } from '@/lib/types';

const UserMediaTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { userMediaUrl } = config;

    if (!userMediaUrl) {
        return (
            <div className="fixed inset-0 -z-10 bg-gray-800 flex items-center justify-center">
                <p className="text-white text-lg">Nenhuma URL de mídia fornecida. Vá para as configurações para adicionar uma.</p>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${userMediaUrl})` }}
        />
    );
};

export default UserMediaTheme;
