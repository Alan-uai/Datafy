
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';
import * as d3Base from 'd3';
import { geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

// UGLY HACK: d3-celestial expects d3 to be a global object with geo methods,
// so we need to construct this object and attach it to the window before requiring the module.
if (typeof window !== 'undefined') {
    const d3 = Object.assign({}, d3Base, { geoOrthographic, geoPath });
    (window as any).d3 = d3;
}
const Celestial = require('d3-celestial');


const CelestialSphereTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const containerRef = useRef<HTMLDivElement>(null);
    const celestialRef = useRef<any>(null);

    const initChart = useCallback(() => {
        if (!containerRef.current || celestialRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const projection = geoOrthographic().scale(width / 2.2).translate([width / 2, height / 2]).clipAngle(90);

        const celestial = Celestial();
        celestial.display({
            width: width,
            height: height,
            projection: projection,
            datapath: "https://ofrohn.github.io/d3-celestial/data/",
            stars: {
                show: true,
                limit: 6,
                colors: true,
                style: { fill: "#ffffff", opacity: 1 },
                size: 7 * (size / 100)
            },
            dsos: { show: false },
            constellations: {
                show: true,
                names: true,
                nameStyle: { fill: "#cccccc", font: "12px 'Helvetica Neue', Arial, sans-serif", align: "center", baseline: "middle" },
                lines: true,
                lineStyle: { stroke: "#cccccc", width: 1, opacity: 0.7 }
            },
            mw: {
                show: true,
                style: { fill: "#ffffff", opacity: 0.15 }
            },
            background: { fill: "transparent" },
            adaptable: true,
            interactive: false,
        });

        d3Base.select(containerRef.current).call(celestial.display);
        celestialRef.current = celestial;

    }, [size]);

    useEffect(() => {
        initChart();
        const containerNode = containerRef.current;
        window.addEventListener('resize', initChart);
        return () => {
             window.removeEventListener('resize', initChart);
             if (containerNode) {
                d3Base.select(containerNode).html(''); // Clear the d3 chart on unmount
                celestialRef.current = null;
             }
        };
    }, [initChart]);
    
    useEffect(() => {
        if (!celestialRef.current) return;
        
        let rotation = 0;
        const animate = () => {
            rotation += 0.05 * (speed / 100);
            celestialRef.current.rotate({ euler: [rotation, -20, 0] });
            animationFrameId.current = requestAnimationFrame(animate);
        };
        const animId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animId);

    }, [speed, celestialRef]);

    const animationFrameId = useRef<number | null>(null);

    return <div ref={containerRef} className="fixed inset-0 -z-10 bg-black" />;
};

export default CelestialSphereTheme;
