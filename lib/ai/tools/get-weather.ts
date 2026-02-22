import { tool } from "ai";
import { z } from "zod";

async function geocodeCity(
	city: string,
): Promise<{ latitude: number; longitude: number } | null> {
	try {
		const response = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		if (!data.results || data.results.length === 0) {
			return null;
		}

		const result = data.results[0];
		return {
			latitude: result.latitude,
			longitude: result.longitude,
		};
	} catch {
		return null;
	}
}

export const getWeather = tool({
	description:
		"Get the current weather at a location. You can provide either coordinates or a city name.",
	inputSchema: z.object({
		latitude: z.number().optional().describe("Latitude coordinate"),
		longitude: z.number().optional().describe("Longitude coordinate"),
		city: z
			.string()
			.optional()
			.describe("City name (e.g., 'San Francisco', 'New York', 'London')"),
	}),
	execute: async ({ latitude, longitude, city }) => {
		let targetLat: number;
		let targetLon: number;

		if (city) {
			const coords = await geocodeCity(city);
			if (!coords) {
				return {
					error: `Could not find coordinates for "${city}". Please check the city name.`,
				};
			}
			targetLat = coords.latitude;
			targetLon = coords.longitude;
		} else if (latitude !== undefined && longitude !== undefined) {
			targetLat = latitude;
			targetLon = longitude;
		} else {
			return {
				error:
					"Please provide either a city name or both latitude and longitude coordinates.",
			};
		}

		const response = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
		);

		const weatherData = await response.json();

		if (city) {
			weatherData.cityName = city;
		}

		return weatherData;
	},
});
