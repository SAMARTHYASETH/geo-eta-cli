#!/usr/bin/env node

import { parseArgs } from "node:util";
import { PRESETS, resolvePoint, estimateETA } from "./index.js";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m"
};

const MODE_BADGES = {
  walk: "🚶 Walk",
  bike: "🏍️  Bike",
  car: "🚗 Car",
  drone: "🛸 Drone"
};

function formatTitle(label) {
  return label
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

function buildRouteBar(distanceKm) {
  const segmentCount = Math.min(28, Math.max(4, Math.round(distanceKm / 2.5)));
  return `●${"─".repeat(segmentCount)}▶`;
}

function getContextualQuip(minutes, mode) {
  if (mode === "drone") {
    return "Airspace cleared! Straight-line flight path locked—zero traffic signals ahead.";
  }
  if (minutes <= 10) {
    return "Easy coffee distance—you will arrive before your espresso cools down.";
  }
  if (minutes <= 30) {
    return "Solid podcast distance—queue up one good episode and cruise.";
  }
  if (minutes <= 60) {
    return "Traffic warning: check live congestion, pack water, and expect bottlenecks.";
  }
  return "Full road-trip territory—charge your phone, grab snacks, and build a playlist.";
}

function printHelp() {
  console.log(`
${C.bold}${C.cyan}geo-eta${C.reset} — Geospatial distance & travel ETA estimator

${C.bold}USAGE:${C.reset}
  geo-eta <origin> <destination> [options]
  npx geo-eta-cli <origin> <destination> [options]

${C.bold}OPTIONS:${C.reset}
  -m, --mode <mode>   Transport mode: walk | bike | car | drone (default: "car")
  -p, --presets       List all built-in landmark presets and coordinates
  -h, --help          Show this help message

${C.bold}EXAMPLES:${C.reset}
  geo-eta "Sonipat" "Connaught Place"
  geo-eta "India Gate" "IGI Airport" --mode drone
  geo-eta "28.6315,77.2167" "Gurugram" -m bike
`);
}

function printPresets() {
  console.log(`\n${C.bold}${C.cyan}Built-in Landmark Presets:${C.reset}\n`);
  for (const [name, [lat, lng]] of Object.entries(PRESETS)) {
    const padded = formatTitle(name).padEnd(18, " ");
    console.log(`  ${C.green}${padded}${C.reset} ${C.dim}[${lat.toFixed(4)}, ${lng.toFixed(4)}]${C.reset}`);
  }
  console.log("");
}

function main() {
  let parsed;
  try {
    parsed = parseArgs({
      options: {
        mode: { type: "string", short: "m", default: "car" },
        presets: { type: "boolean", short: "p", default: false },
        help: { type: "boolean", short: "h", default: false }
      },
      allowPositionals: true
    });
  } catch (err) {
    console.error(`${C.red}Error:${C.reset} ${err.message}`);
    printHelp();
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return;
  }

  if (values.presets) {
    printPresets();
    return;
  }

  if (positionals.length < 2) {
    console.error(`${C.red}Error:${C.reset} Please provide both <origin> and <destination>.`);
    printHelp();
    process.exit(1);
  }

  const [rawOrigin, rawDest] = positionals;

  try {
    const originCoords = resolvePoint(rawOrigin);
    const destCoords = resolvePoint(rawDest);
    const { distanceKm, minutes, mode } = estimateETA(originCoords, destCoords, values.mode);

    const originLabel = Object.hasOwn(PRESETS, rawOrigin.trim().toLowerCase())
      ? formatTitle(rawOrigin)
      : `${originCoords[0].toFixed(4)}, ${originCoords[1].toFixed(4)}`;

    const destLabel = Object.hasOwn(PRESETS, rawDest.trim().toLowerCase())
      ? formatTitle(rawDest)
      : `${destCoords[0].toFixed(4)}, ${destCoords[1].toFixed(4)}`;

    const badge = MODE_BADGES[mode];
    const routeBar = buildRouteBar(distanceKm);
    const quip = getContextualQuip(minutes, mode);

    console.log("");
    console.log(`${C.bold}${C.cyan}GEO-ETA ROUTE SUMMARY${C.reset}  ${C.dim}[${badge}]${C.reset}`);
    console.log(`${C.bold}${originLabel}${C.reset} ${C.cyan}${routeBar}${C.reset} ${C.bold}${destLabel}${C.reset}`);
    console.log(`  Distance : ${C.bold}${C.green}${distanceKm.toFixed(2)} km${C.reset}`);
    console.log(`  Est. ETA : ${C.bold}${C.yellow}${formatDuration(minutes)}${C.reset}`);
    console.log(`  Tip      : ${C.magenta}${quip}${C.reset}`);
    console.log("");
  } catch (err) {
    console.error(`\n${C.red}Error:${C.reset} ${err.message}\n`);
    process.exit(1);
  }
}

main();
