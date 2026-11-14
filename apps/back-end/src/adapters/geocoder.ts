import type { Coordinates } from "./travel";

export interface GeocoderAdapter {
	geocode(address: string): Promise<Coordinates | null>;
}

export class SeededGeocoderAdapter implements GeocoderAdapter {
	constructor(private readonly coordinates: ReadonlyMap<string, Coordinates>) {}

	async geocode(address: string) {
		return this.coordinates.get(address) ?? null;
	}
}
