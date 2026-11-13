export type Coordinates = {
	latitude: number;
	longitude: number;
};

export interface TravelTimeAdapter {
	getTravelTime(
		from: Coordinates,
		to: Coordinates,
	): Promise<{
		minutes: number;
		distanceKm: number;
		simulated: boolean;
	}>;
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineDistanceKm(from: Coordinates, to: Coordinates) {
	const earthRadiusKm = 6371;
	const latitudeDelta = radians(to.latitude - from.latitude);
	const longitudeDelta = radians(to.longitude - from.longitude);
	const a =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(radians(from.latitude)) *
			Math.cos(radians(to.latitude)) *
			Math.sin(longitudeDelta / 2) ** 2;
	return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class HaversineTravelAdapter implements TravelTimeAdapter {
	constructor(private readonly averageSpeedKph = 30) {}

	async getTravelTime(from: Coordinates, to: Coordinates) {
		const distanceKm = haversineDistanceKm(from, to);
		return {
			distanceKm,
			minutes: Math.ceil((distanceKm / this.averageSpeedKph) * 60),
			simulated: true,
		};
	}
}
