# geo-eta-cli

Zero-dependency Node.js library and terminal CLI for calculating geospatial distances using the Haversine formula, estimating travel ETAs across transport modes, and sorting nearby locations.

## Installation

```bash
# Run directly via npx
npx geo-eta-cli "Sonipat" "Connaught Place"

# Or install in a project
npm install geo-eta-cli
```

## CLI Usage

```bash
geo-eta <origin> <destination> [options]
```

### Options

| Flag | Alias | Description | Default |
| :--- | :--- | :--- | :--- |
| `--mode <mode>` | `-m` | Transport mode (`walk`, `bike`, `car`, `drone`) | `car` |
| `--presets` | `-p` | List all built-in landmark presets | `false` |
| `--help` | `-h` | Display usage instructions and examples | `false` |

### CLI Examples

```bash
geo-eta "Connaught Place" "IGI Airport"
geo-eta "India Gate" "Noida" --mode bike
geo-eta "28.9931,77.0151" "Gurugram" -m drone
geo-eta --presets
```

## Programmatic API (ESM & TypeScript)

```javascript
import {
  PRESETS,
  resolvePoint,
  getDistance,
  estimateETA,
  sortByNearest
} from "geo-eta-cli";

// 1. Resolve preset names, "lat,lng" strings, or [lat, lng] arrays
const start = resolvePoint("Sonipat"); // [28.9931, 77.0151]

// 2. Calculate Haversine distance ("km" or "mi")
const km = getDistance("Connaught Place", "India Gate", "km"); // 2.42
const miles = getDistance("Connaught Place", "India Gate", "mi"); // 1.5

// 3. Estimate travel ETA ("walk" | "bike" | "car" | "drone")
const eta = estimateETA("Connaught Place", "IGI Airport", "car");
// => { distanceKm: 14.15, minutes: 24, mode: "car" }

// 4. Filter and sort nearby locations
const hubs = [
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "Noida Hub", coords: PRESETS["noida"] },
  { name: "Sonipat Hub", coords: PRESETS["sonipat"] }
];

const nearby = sortByNearest("Connaught Place", hubs, {
  maxRadiusKm: 25,
  mode: "bike"
});
```

## License

MIT
