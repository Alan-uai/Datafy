// src/app/api/astro-info/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import {
  Observer,
  MoonPhase,
  SearchLunarEclipse,
  SearchGlobalSolarEclipse
} from 'astronomy-engine';

// Helper function to get coordinates from a timezone identifier.
// This is a rough approximation and may not be accurate for all timezones.
async function getCoordsFromTimezone(tz: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(tz.replace('_', ' '))}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Datafy/1.0 (contact@example.com)' } });
    if (!res.ok) {
        throw new Error(`Nominatim API failed with status: ${res.status}`);
    }
    const data = await res.json();
    if (!data || data.length === 0) {
        // Fallback for common IANA timezone formats
        const city = tz.split('/').pop()?.replace('_', ' ');
        if (city) {
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
            const fallbackRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Datafy/1.0' } });
            const fallbackData = await fallbackRes.json();
            if (fallbackData && fallbackData.length > 0) {
                 return { name: fallbackData[0].display_name, lat: parseFloat(fallbackData[0].lat), lon: parseFloat(fallbackData[0].lon) };
            }
        }
       throw new Error(`Timezone not found on Nominatim: ${tz}`);
    }
    return { name: data[0].display_name, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (error) {
     console.error("Error fetching coordinates from timezone:", error);
     // Fallback to a default location (São Paulo, Brazil) if API fails
     return { name: "São Paulo, Brazil", lat: -23.55, lon: -46.63 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tz = searchParams.get('tz') || 'America/Sao_Paulo';
    
    // Using a default location as getCoordsFromTimezone can be unreliable.
    // This provides a stable experience. For true location-based features,
    // client-side Geolocation API would be more robust.
    const lat = -23.55; // São Paulo Latitude
    const lon = -46.63; // São Paulo Longitude
    const city = "São Paulo, Brazil";
    
    // const { name: city, lat, lon } = await getCoordsFromTimezone(tz);

    const now = new Date();
    const observer = new Observer(lat, lon, 1); // Elevation 1 meter

    // 1. Get Moon Phase
    const moonIllumination = MoonPhase(now);

    // 2. Check for Solar Eclipse Today
    const solarEclipseInfo = SearchGlobalSolarEclipse(now);
    let solarEclipseToday = false;
    if (solarEclipseInfo && now.getUTCFullYear() === solarEclipseInfo.date.getUTCFullYear() &&
        now.getUTCMonth() === solarEclipseInfo.date.getUTCMonth() &&
        now.getUTCDate() === solarEclipseInfo.date.getUTCDate()) {
      solarEclipseToday = true;
      // Optional: Check if visible from location (commented out as requested)
      // const solarEclipseEvent = EclipseEvent(solarEclipseInfo, observer);
      // if (solarEclipseEvent.total || solarEclipseEvent.partial) {
      //   solarEclipseToday = true;
      // }
    }
    
    // 3. Check for Lunar Eclipse Today
    const lunarEclipseInfo = SearchLunarEclipse(now);
    let lunarEclipseToday = false;
    if (lunarEclipseInfo && now.getUTCFullYear() === lunarEclipseInfo.date.getUTCFullYear() &&
        now.getUTCMonth() === lunarEclipseInfo.date.getUTCMonth() &&
        now.getUTCDate() === lunarEclipseInfo.date.getUTCDate()) {
      lunarEclipseToday = true;
      // Optional: Check if visible from location (commented out as requested)
      // const lunarEclipseEvent = EclipseEvent(lunarEclipseInfo, observer);
      // if (lunarEclipseEvent.total || lunarEclipseEvent.partial || lunarEclipseEvent.penumbral) {
      //  lunarEclipseToday = true;
      // }
    }

    const eclipseToday = solarEclipseToday ? 'solar' : (lunarEclipseToday ? 'lunar' : null);

    return NextResponse.json({ city, lat, lon, moonIllumination, eclipseToday });

  } catch (err: any) {
    console.error("Error in astro-info API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
