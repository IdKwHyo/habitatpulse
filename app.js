import * as THREE from "./assets/vendor/three-0.160.0.module.min.js";

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 767px)").matches;
const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
})[char]);
const safeHttpsUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch (error) {
    return "";
  }
};

const state = {
  lat: 13.7563,
  lng: 100.5018,
  radius: 5,
  place: "Bangkok, Thailand",
  observations: [],
  groups: new Set(),
  totalRecords: 0
};

const fallbackObservations = [
  {
    taxon: { preferred_common_name: "Plain Tiger", name: "Danaus chrysippus", iconic_taxon_name: "Insecta", default_photo: { medium_url: "https://static.inaturalist.org/photos/4504568/medium.jpg" } },
    geojson: { coordinates: [100.50, 13.75] }, observed_on: "recently"
  },
  {
    taxon: { preferred_common_name: "Asian Openbill", name: "Anastomus oscitans", iconic_taxon_name: "Aves", default_photo: { medium_url: "https://static.inaturalist.org/photos/6829675/medium.jpg" } },
    geojson: { coordinates: [100.52, 13.77] }, observed_on: "recently"
  },
  {
    taxon: { preferred_common_name: "Common Garden Lizard", name: "Calotes versicolor", iconic_taxon_name: "Reptilia", default_photo: { medium_url: "https://static.inaturalist.org/photos/6886074/medium.jpg" } },
    geojson: { coordinates: [100.48, 13.74] }, observed_on: "recently"
  },
  {
    taxon: { preferred_common_name: "Golden Pothos", name: "Epipremnum aureum", iconic_taxon_name: "Plantae", default_photo: { medium_url: "https://static.inaturalist.org/photos/14402610/medium.jpg" } },
    geojson: { coordinates: [100.51, 13.73] }, observed_on: "recently"
  }
];

async function fetchJSON(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function observationPhoto(observation) {
  const candidate = observation.photos?.[0]?.url?.replace("square", "medium") || observation.taxon?.default_photo?.medium_url || "";
  return safeHttpsUrl(candidate);
}

function observationName(observation) {
  return observation.taxon?.preferred_common_name || observation.taxon?.name || "Local species";
}

let map;
let areaCircle;
let infoWindow;
let AdvancedMarkerElement;
let observationMarkers = [];
let areaRequestId = 0;
let placeRequestId = 0;
let mapsLoader;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  if (mapsLoader) {
    return mapsLoader;
  }

  mapsLoader = new Promise((resolve, reject) => {
    const callbackName = "__habitatPulseMapsReady";
    const script = document.createElement("script");

    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };

    const params = new URLSearchParams({
      key: apiKey,
      loading: "async",
      v: "weekly",
      libraries: "marker",
      callback: callbackName,
      auth_referrer_policy: "origin"
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;

    script.onerror = () => {
      delete window[callbackName];
      reject(new Error("Google Maps failed to load."));
    };

    document.head.append(script);
  });

  return mapsLoader;
}

async function initMap() {
  if (!$('map')) return;
  const config = await fetchJSON("/api/maps-config");
  await loadGoogleMaps(config.apiKey);
  const [{ Map }, markerLibrary] = await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("marker")
  ]);
  AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement;
  map = new Map($('map'), {
    center: { lat: state.lat, lng: state.lng },
    zoom: 13,
    mapId: config.mapId,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: "cooperative"
  });
  infoWindow = new google.maps.InfoWindow();
  areaCircle = new google.maps.Circle({
    map,
    center: { lat: state.lat, lng: state.lng },
    radius: state.radius * 1000,
    strokeColor: "#b8db75",
    strokeOpacity: 0.8,
    strokeWeight: 1,
    fillColor: "#a9cf74",
    fillOpacity: 0.08,
    clickable: false
  });
}

function setApiMessage(message = "") {
  $('api-message').textContent = message;
}

function setLoading(isLoading) {
  $('map-loading').classList.toggle("active", isLoading);
  $('map-loading').setAttribute("aria-hidden", String(!isLoading));
  $('map-plane').setAttribute("aria-busy", String(isLoading));
}

function uniqueObservations(observations) {
  const unique = new Map();
  observations.forEach((observation) => {
    const key = observation.taxon?.id || observation.taxon?.name;
    if (key && !unique.has(key)) unique.set(key, observation);
  });
  return [...unique.values()];
}

function createMapPopup(observation) {
  const root = document.createElement("div");
  root.className = "map-popup";
  const photo = observationPhoto(observation);
  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = observationName(observation);
    root.append(image);
  }
  const title = document.createElement("strong");
  title.textContent = observationName(observation);
  const details = document.createElement("span");
  details.textContent = `${observation.taxon?.name || ""} · ${observation.observed_on || "recent observation"}`;
  root.append(title, details);
  return root;
}

function renderMap(observations, fitObservations = true) {
  if (!map || !AdvancedMarkerElement) return;
  observationMarkers.forEach((marker) => { marker.map = null; });
  observationMarkers = [];
  const bounds = new google.maps.LatLngBounds();
  observations.slice(0, 30).forEach((observation, index) => {
    const coordinates = observation.geojson?.coordinates;
    if (!coordinates || coordinates.length < 2) return;
    const position = { lat: Number(coordinates[1]), lng: Number(coordinates[0]) };
    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;
    const markerElement = document.createElement("span");
    markerElement.className = "species-marker";
    markerElement.style.setProperty("--marker-color", index % 4 === 0 ? "#e3bd7c" : "#b8db75");
    const marker = new AdvancedMarkerElement({
      map,
      position,
      title: observationName(observation),
      content: markerElement
    });
    marker.addListener("click", () => {
      infoWindow.setContent(createMapPopup(observation));
      infoWindow.open({ map, anchor: marker });
    });
    observationMarkers.push(marker);
    bounds.extend(position);
  });
  if (fitObservations && !bounds.isEmpty()) {
    map.fitBounds(bounds, 54);
    google.maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > 14) map.setZoom(14);
    });
  }
  areaCircle?.setCenter({ lat: state.lat, lng: state.lng });
  areaCircle?.setRadius(state.radius * 1000);
}

function renderSpeciesStage(observations, isSample = false) {
  const available = observations.filter((observation) => observationPhoto(observation)).slice(0, 3);
  const specimens = [...$('species-stage').querySelectorAll(".specimen")];
  specimens.forEach((specimen, index) => {
    specimen.innerHTML = `<div class="specimen-placeholder"></div><figcaption>${index === 0 ? "No photographed species in this reading" : "Try a wider radius or another place"}</figcaption>`;
  });
  available.forEach((observation, index) => {
    const common = observationName(observation);
    specimens[index].innerHTML = `<img src="${escapeHtml(observationPhoto(observation))}" alt="${escapeHtml(common)}" loading="lazy"><figcaption>${isSample ? "Sample — " : ""}${escapeHtml(common)} · ${escapeHtml(observation.taxon?.iconic_taxon_name || "wildlife")}</figcaption>`;
  });
}

function renderObservedStrip(observations, isSample = false) {
  const available = observations.filter((observation) => observationPhoto(observation)).slice(0, 4);
  if (!available.length) {
    $('observed-strip').innerHTML = '<p class="observed-empty">No photographed records surfaced here yet.</p>';
    return;
  }
  $('observed-strip').innerHTML = available.map((observation) => {
    const common = observationName(observation);
    return `<figure class="observed-item"><img src="${escapeHtml(observationPhoto(observation))}" alt="${escapeHtml(common)}" loading="lazy"><figcaption><strong>${isSample ? "Sample — " : ""}${escapeHtml(common)}</strong><span>${escapeHtml(observation.taxon?.iconic_taxon_name || "local life")}</span></figcaption></figure>`;
  }).join("");
}

function updateFieldReading(unique, weather, isSample = false) {
  const groupText = [...state.groups].slice(0, 3).map((group) => group.toLowerCase()).join(" · ") || "local wildlife";
  const temperature = weather?.current?.temperature_2m;
  const rainChance = weather?.daily?.precipitation_probability_max?.[0];
  $('records').textContent = isSample ? "Sample" : state.totalRecords.toLocaleString();
  $('taxa').textContent = unique.length.toLocaleString();
  $('temp').textContent = Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : "—";
  $('rain').textContent = Number.isFinite(rainChance) ? `${rainChance}%` : "—";
  $('group-count').textContent = state.groups.size || "—";
  $('field-place').textContent = state.place;
  $('nav-place').textContent = `${state.place.split(",")[0]} · ${isSample ? "sample" : "live"}`;
  $('hero-count').textContent = isSample ? `${unique.length} sample species` : `${unique.length} species shown`;
  $('hero-groups').textContent = groupText;
  $('hero-weather').textContent = Number.isFinite(temperature) ? `${Math.round(temperature)}°C in the field` : "live field reading";
  $('field-status').textContent = `${isSample ? "Sample interface" : "Field reading loaded"}: ${unique.length} species shown near ${state.place}.`;
}

async function loadArea() {
  const requestId = ++areaRequestId;
  setLoading(true);
  setApiMessage("");
  if (map) {
    map.setCenter({ lat: state.lat, lng: state.lng });
    map.setZoom(state.radius <= 2 ? 14 : state.radius <= 5 ? 13 : 12);
    areaCircle?.setCenter({ lat: state.lat, lng: state.lng });
    areaCircle?.setRadius(state.radius * 1000);
  }

  const observationsUrl = `https://api.inaturalist.org/v1/observations?lat=${state.lat}&lng=${state.lng}&radius=${state.radius}&quality_grade=research&photos=true&per_page=60&order_by=observed_on&order=desc`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lng}&current=temperature_2m,relative_humidity_2m&daily=precipitation_probability_max&forecast_days=1&timezone=auto`;
  try {
    const [observationsResult, weatherResult] = await Promise.allSettled([
      fetchJSON(observationsUrl),
      fetchJSON(weatherUrl)
    ]);
    if (requestId !== areaRequestId) return;

    const usedFallback = observationsResult.status !== "fulfilled";
    if (!usedFallback) {
      state.observations = (observationsResult.value.results || []).filter((item) => item.taxon).slice(0, 50);
      state.totalRecords = observationsResult.value.total_results || 0;
    } else {
      state.observations = fallbackObservations;
      state.totalRecords = 0;
    }

    const unique = uniqueObservations(state.observations);
    state.groups = usedFallback ? new Set() : new Set(unique.map((observation) => observation.taxon?.iconic_taxon_name).filter(Boolean));
    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;

    renderMap(usedFallback ? [] : unique, !usedFallback);
    renderSpeciesStage(unique, usedFallback);
    renderObservedStrip(unique, usedFallback);
    updateFieldReading(unique, weather, usedFallback);
    generatePlan(false);
    if (usedFallback) {
      setApiMessage("Live biodiversity data is unavailable, so a clearly labeled interface sample is shown; sample species are not local evidence.");
    } else if (!unique.length) {
      setApiMessage("No research-grade photographed observations surfaced in this radius. Try 10 km or another place.");
    }
  } catch (error) {
    if (requestId === areaRequestId) setApiMessage("The field reading could not be rendered. The planner is still available below.");
  } finally {
    if (requestId === areaRequestId) {
      setLoading(false);
      window.ScrollTrigger?.refresh();
    }
  }
}

async function searchCity() {
  const query = $('city').value.trim();
  if (!query) return;
  const requestId = ++placeRequestId;
  setLoading(true);
  try {
    const locations = await fetchJSON(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    if (requestId !== placeRequestId) return;
    if (!locations.length) throw new Error("No matching place");
    state.lat = Number(locations[0].lat);
    state.lng = Number(locations[0].lon);
    state.place = locations[0].display_name.split(",").slice(0, 2).join(",");
    await loadArea();
  } catch (error) {
    if (requestId === placeRequestId) {
      setLoading(false);
      setApiMessage("That place could not be resolved. Try a city and country.");
    }
  }
}

function useGeolocation() {
  const requestId = ++placeRequestId;
  if (!navigator.geolocation) {
    setApiMessage("Geolocation is not supported here. Search a city instead.");
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    if (requestId !== placeRequestId) return;
    state.lat = coords.latitude;
    state.lng = coords.longitude;
    state.place = "Your current area";
    $('city').value = "Current location";
    await loadArea();
  }, () => {
    if (requestId === placeRequestId) {
      setLoading(false);
      setApiMessage("Location permission was not granted. Search a city instead.");
    }
  }, { timeout: 9000, maximumAge: 300000 });
}

const actionTemplates = {
  pollinators: [
    ["Plant a native flower cluster", "Use at least three species with staggered bloom times", 17],
    ["Keep the patch pesticide-free", "Protect insects and the food web they support", 14],
    ["Add a shallow water landing spot", "Pebbles create safe footing for small visitors", 11],
    ["Leave one quiet nesting corner", "Stems, bare soil, or a small insect hotel", 9]
  ],
  birds: [
    ["Add a layered native shrub", "Dense cover offers refuge from heat and predators", 17],
    ["Provide shallow, clean water", "Refresh often to avoid mosquito breeding", 14],
    ["Grow seed or berry plants", "Choose locally native, non-invasive species", 12],
    ["Prevent window collisions", "Use visible exterior markers about 5 cm apart", 10]
  ],
  mixed: [
    ["Plant at three heights", "Groundcover, flowers, and a shrub create structure", 18],
    ["Add water with safe exits", "A shallow dish with stones serves more species", 12],
    ["Keep leaf litter in one corner", "Microhabitat for insects, fungi, and reptiles", 11],
    ["Avoid pesticides and glue traps", "Protect the local food web", 13]
  ],
  cooling: [
    ["Cover hard surfaces with plants", "Prioritize leafy, drought-tolerant native species", 18],
    ["Add vertical growing layers", "Use trellises without blocking safe access", 12],
    ["Capture rain for irrigation", "A covered container reduces tap-water demand", 11],
    ["Mulch exposed soil", "Retain moisture and buffer root temperatures", 10]
  ]
};

function selectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function updateScore() {
  const base = Number($('readiness-vessel').dataset.base || 24);
  const checked = [...$('actions-list').querySelectorAll("input:checked")];
  const score = clamp(base + checked.reduce((sum, input) => sum + Number(input.dataset.points), 0), 0, 100);
  $('score').textContent = score;
  $('readiness-vessel').style.setProperty("--score", score);
  $('readiness-vessel').setAttribute("aria-valuenow", String(score));
  $('plan-status').textContent = `Habitat plan updated. Readiness ${score} out of 100.`;
  if (window.gsap && !reduceMotion) {
    window.gsap.fromTo('#readiness-vessel', { rotate: -1.5, scale: .985 }, { rotate: 0, scale: 1, duration: .42, ease: "power3.out", overwrite: true });
  }
}

function generatePlan(animate = true) {
  const goal = selectedValue("goal") || "pollinators";
  const space = selectedValue("space") || "balcony";
  const sunlight = $('sunlight').value;
  const surface = $('surface').value;
  const size = Number($('size').value);
  let base = surface === "green" ? 48 : surface === "mixed" ? 35 : 24;
  if (sunlight === "full" && goal === "pollinators") base += 5;

  const localHint = state.groups.has("Insecta") && goal === "pollinators"
    ? " Pollinators are already being recorded nearby."
    : state.groups.has("Aves") && goal === "birds"
      ? " Nearby bird records show this can join an existing urban network."
      : " This patch can add a useful stepping stone to the neighborhood.";
  const labels = { pollinators: "pollinator stop", birds: "bird refuge", mixed: "tiny wildlife corridor", cooling: "cooler green pocket" };
  const lightCopy = sunlight === "full" ? "Strong sun creates good planting options." : sunlight === "partial" ? "Partial sun suits a diverse, layered patch." : "Shade-tolerant structure and water will do the most work.";

  $('plan-title').textContent = `Your ${space} can become a ${labels[goal]}.`;
  $('plan-copy').textContent = `${lightCopy}${localHint}`;
  $('actions-list').innerHTML = actionTemplates[goal].map((action, index) => `<label class="action-item"><input type="checkbox" data-points="${action[2]}" ${index === 0 ? "checked" : ""}><span><strong>${action[0]}</strong><small>${action[1]}</small></span><span class="action-points">+${action[2]}</span></label>`).join("");
  $('actions-list').querySelectorAll("input").forEach((input) => input.addEventListener("change", updateScore));
  $('readiness-vessel').dataset.base = base;
  const greenRatio = surface === "green" ? .85 : surface === "mixed" ? .67 : .52;
  $('green-area').textContent = `${(size * greenRatio).toFixed(1)} m²`;
  $('guilds').textContent = `${goal === "mixed" ? 4 : 3} wildlife groups`;
  $('runoff').textContent = `${Math.round(size * greenRatio * 6)} L`;
  updateScore();

  if (animate && window.gsap && !reduceMotion) {
    window.gsap.fromTo('#patch-result .patch-result__copy, #patch-result .action-item, #patch-result .impact-sentence',
      { y: 18, opacity: .35 },
      { y: 0, opacity: 1, duration: .62, stagger: .045, ease: "power3.out", overwrite: true }
    );
  }
}

async function generateGeminiPlan() {
  generatePlan(true);
  const button = document.querySelector(".shape-button");
  const buttonText = button?.querySelector("span");
  const originalText = buttonText?.textContent || "Shape this habitat";
  if (button) button.disabled = true;
  if (buttonText) buttonText.textContent = "Reading the habitat…";
  $('plan-status').textContent = "Generating an AI-refined habitat plan.";
  const payload = {
    place: state.place,
    space: selectedValue("space") || "balcony",
    goal: selectedValue("goal") || "pollinators",
    sunlight: $('sunlight').value,
    surface: $('surface').value,
    size: Number($('size').value),
    wildlifeGroups: [...state.groups],
    nearbySpecies: uniqueObservations(state.observations).slice(0, 10).map(observationName)
  };
  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Recommendation failed with ${response.status}`);
    const recommendation = await response.json();
    if (!Array.isArray(recommendation.actions) || recommendation.actions.length !== 4) throw new Error("Invalid habitat plan");
    $('plan-title').textContent = recommendation.title || "Your habitat plan";
    $('plan-copy').textContent = recommendation.summary || "A locally informed plan for this space.";
    $('actions-list').innerHTML = recommendation.actions.map((action, index) => {
      const points = clamp(Number(action.points) || 10, 8, 18);
      return `<label class="action-item"><input type="checkbox" data-points="${points}" ${index === 0 ? "checked" : ""}><span><strong>${escapeHtml(action.title)}</strong><small>${escapeHtml(action.rationale)}</small></span><span class="action-points">+${points}</span></label>`;
    }).join("");
    $('actions-list').querySelectorAll("input").forEach((input) => input.addEventListener("change", updateScore));
    document.querySelector(".method-note").textContent = `${recommendation.caution || "Confirm local suitability with an expert."} AI-assisted planning estimate, not an ecological assessment.`;
    updateScore();
    $('plan-status').textContent = `AI habitat plan generated. Readiness ${$('score').textContent} out of 100.`;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    $('plan-status').textContent = "AI refinement was unavailable. The transparent local plan is still shown.";
  } finally {
    if (button) button.disabled = false;
    if (buttonText) buttonText.textContent = originalText;
  }
}

function setupInterface() {
  $('search-btn').addEventListener("click", searchCity);
  $('city').addEventListener("keydown", (event) => { if (event.key === "Enter") searchCity(); });
  $('geo-btn').addEventListener("click", useGeolocation);
  document.querySelectorAll("[data-radius]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-radius]").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    state.radius = Number(button.dataset.radius);
    loadArea();
  }));
  $('size').addEventListener("input", () => { $('size-label').textContent = $('size').value; });
  $('patch-form').addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isMobile) $('patch-result').scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    await generateGeminiPlan();
  });
}

function supportsWebGL() {
  try {
    const probe = document.createElement("canvas");
    const context = window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl"));
    const supported = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return supported;
  } catch (error) {
    return false;
  }
}

function createEcosystem() {
  const canvas = $('ecosystem-canvas');
  if (!canvas || !supportsWebGL()) {
    document.documentElement.classList.add("no-webgl");
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  } catch (error) {
    document.documentElement.classList.add("no-webgl");
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, .1, 70);
  camera.position.set(0, 0, 8.6);

  const count = isMobile ? 900 : 2200;
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const glows = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.2 + Math.pow(Math.random(), .55) * 5.8;
    positions[offset] = Math.cos(angle) * radius + (Math.random() - .5) * 1.8;
    positions[offset + 1] = Math.sin(angle) * radius * .63 + (Math.random() - .5) * 1.4;
    positions[offset + 2] = -5.2 + Math.random() * 6.8;

    const progress = index / Math.max(1, count - 1);
    const targetAngle = progress * Math.PI * 18;
    const targetRadius = .65 + Math.sin(progress * Math.PI) * 1.25;
    targets[offset] = Math.cos(targetAngle) * targetRadius;
    targets[offset + 1] = Math.sin(targetAngle) * targetRadius * .58;
    targets[offset + 2] = 2.6 - progress * 9.2;
    sizes[index] = .65 + Math.random() * 1.7;
    phases[index] = Math.random() * Math.PI * 2;
    glows[index] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(glows, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorA: { value: new THREE.Color("#72aa8d") },
    uColorB: { value: new THREE.Color("#badf79") }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aTarget;
      attribute float aSize;
      attribute float aPhase;
      attribute float aGlow;
      uniform float uTime;
      uniform float uMorph;
      uniform float uScroll;
      uniform float uPixelRatio;
      uniform vec2 uMouse;
      varying float vGlow;
      varying float vMorph;
      void main() {
        float morph = smoothstep(0.0, 1.0, uMorph);
        vec3 point = mix(position, aTarget, morph);
        float drift = (1.0 - morph) * 0.085;
        point.x += sin(uTime * 0.18 + aPhase) * drift;
        point.y += cos(uTime * 0.14 + aPhase * 1.7) * drift;
        point.xy += uMouse * (0.035 + aGlow * 0.055) * (1.0 - morph * 0.6);
        point.z += sin(uScroll * 3.14159 + aPhase) * 0.035;
        vec4 mvPosition = modelViewMatrix * vec4(point, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = min(14.0, (aSize * uPixelRatio * 34.0) / max(1.0, -mvPosition.z));
        vGlow = aGlow;
        vMorph = morph;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vGlow;
      varying float vMorph;
      void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);
        alpha *= 0.28 + vGlow * 0.56 + vMorph * 0.12;
        vec3 color = mix(uColorA, uColorB, clamp(vGlow * 0.7 + vMorph * 0.35, 0.0, 1.0));
        gl_FragColor = vec4(color, alpha);
      }
    `
  });

  const points = new THREE.Points(geometry, material);
  points.rotation.set(.08, -.18, 0);
  scene.add(points);

  const mouseTarget = new THREE.Vector2(0, 0);
  const onPointerMove = (event) => {
    mouseTarget.set((event.clientX / window.innerWidth - .5) * 2, (event.clientY / window.innerHeight - .5) * -2);
  };
  if (!isMobile && !reduceMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

  let visible = !document.hidden;
  let narrativeVisible = true;
  const sceneVisibility = new Map();
  const narrativeObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => sceneVisibility.set(entry.target, entry.isIntersecting));
    narrativeVisible = [...sceneVisibility.values()].some(Boolean);
  }, { rootMargin: "12% 0px" }) : null;
  document.querySelectorAll("#arrival, #signal, #connection, #resolution").forEach((section) => narrativeObserver?.observe(section));
  let contextLost = false;
  const onVisibility = () => { visible = !document.hidden; };
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", (event) => { event.preventDefault(); contextLost = true; });
  canvas.addEventListener("webglcontextrestored", () => { contextLost = false; material.needsUpdate = true; });

  let resizeFrame = 0;
  const onResize = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 768 ? 1 : 1.5));
      renderer.setSize(width, height, false);
      uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, width < 768 ? 1 : 1.5);
    });
  };
  window.addEventListener("resize", onResize, { passive: true });

  const render = (timeSeconds = 0) => {
    if (!visible || !narrativeVisible || contextLost) return;
    uniforms.uTime.value = timeSeconds;
    uniforms.uMouse.value.lerp(mouseTarget, .045);
    renderer.render(scene, camera);
  };

  const dispose = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    narrativeObserver?.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };

  return { renderer, scene, camera, points, uniforms, render, dispose };
}

function setupDepthPlate() {
  const plate = document.querySelector(".depth-plate");
  if (!plate || isMobile || reduceMotion || !window.gsap) return;
  const rotateX = window.gsap.quickTo(plate, "rotateX", { duration: .55, ease: "power3.out" });
  const rotateY = window.gsap.quickTo(plate, "rotateY", { duration: .55, ease: "power3.out" });
  plate.addEventListener("pointermove", (event) => {
    const rect = plate.getBoundingClientRect();
    rotateY(((event.clientX - rect.left) / rect.width - .5) * 8);
    rotateX(((event.clientY - rect.top) / rect.height - .5) * -7);
  });
  plate.addEventListener("pointerleave", () => { rotateX(0); rotateY(0); });
}

function setupMotion(ecosystem) {
  if (!window.gsap || !window.ScrollTrigger) {
    ecosystem?.render(0);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);

  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ lerp: .075, smoothWheel: true, syncTouch: false, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
  }

  if (!reduceMotion) {
    gsap.ticker.add((time) => {
      lenis?.raf(time * 1000);
      ecosystem?.render(time);
    });
  } else {
    ecosystem?.render(0);
  }

  if (!reduceMotion) {
    gsap.from(".title-mask > span", { yPercent: 112, rotate: 2.5, duration: 1.25, stagger: .085, ease: "power4.out", delay: .12 });
    gsap.from(".arrival-intro, .arrival-copy .text-link, .arrival-caption", { y: 24, opacity: 0, duration: .8, stagger: .08, ease: "power3.out", delay: .62 });
    gsap.from(".observation-float", { x: 80, rotateY: -15, opacity: 0, duration: 1.05, ease: "power3.out", delay: .55 });

    if (ecosystem) {
      gsap.to(ecosystem.uniforms.uScroll, {
        value: 4,
        ease: "none",
        scrollTrigger: { trigger: "#main", start: "top top", end: "bottom bottom", scrub: .5 }
      });
      const finalColorA = new THREE.Color("#a38f69");
      const finalColorB = new THREE.Color("#badf79");
      gsap.to(ecosystem.uniforms.uColorA.value, {
        r: finalColorA.r, g: finalColorA.g, b: finalColorA.b, ease: "none",
        scrollTrigger: { trigger: "#resolution", start: "top bottom", end: "top 35%", scrub: .55 }
      });
      gsap.to(ecosystem.uniforms.uColorB.value, {
        r: finalColorB.r, g: finalColorB.g, b: finalColorB.b, ease: "none",
        scrollTrigger: { trigger: "#resolution", start: "top bottom", end: "top 35%", scrub: .55 }
      });
    }

    gsap.timeline({ scrollTrigger: { trigger: "#arrival", start: "top top", end: "bottom top", scrub: .65 } })
      .to(".arrival-copy", { yPercent: -15, scale: .91, transformOrigin: "left center", ease: "none" }, 0)
      .to(".observation-float", { yPercent: 22, xPercent: 18, rotateY: 8, ease: "none" }, 0)
      .to(".pulse-line i", { scaleX: 2.6, ease: "none" }, 0);

    gsap.from(".signal-copy", { xPercent: -10, rotateY: 7, opacity: .28, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: "#signal", start: "top 72%" } });
    gsap.utils.toArray(".specimen").forEach((specimen, index) => {
      const depth = Number(specimen.dataset.depth || 1);
      gsap.fromTo(specimen,
        { y: 90 * depth, rotateY: index % 2 ? -7 : 6, opacity: .35 },
        { y: -70 * depth, rotateY: index % 2 ? 3 : -2, opacity: 1, ease: "none", scrollTrigger: { trigger: "#signal", start: "top bottom", end: "bottom top", scrub: .65 } }
      );
    });

    const sceneMedia = gsap.matchMedia();
    sceneMedia.add({
      cinematic: "(min-width: 768px) and (min-height: 650px) and (pointer: fine)",
      compact: "(max-width: 767px), (max-height: 649px), (pointer: coarse)"
    }, ({ conditions }) => {
      if (conditions.cinematic) {
      gsap.set(".letterbox--top", { y: 0, yPercent: -105 });
      gsap.set(".letterbox--bottom", { y: 0, yPercent: 105 });
      const connectionTimeline = gsap.timeline({
        scrollTrigger: { trigger: "#connection", start: "top top", end: "+=220%", pin: true, scrub: .65, anticipatePin: 1 }
      });
      connectionTimeline
        .to(".letterbox--top", { yPercent: 0, duration: .12, ease: "power3.out" }, 0)
        .to(".letterbox--bottom", { yPercent: 0, duration: .12, ease: "power3.out" }, 0)
        .fromTo(".connection-kicker", { opacity: .35, y: 22 }, { opacity: 1, y: 0, duration: .18, ease: "power3.out" }, .04)
        .to(".connection-line--one", { x: 0, z: 120, scale: 1.08, duration: .34, ease: "power2.inOut" }, .08)
        .to(".connection-line--two", { x: 0, z: 40, scale: .96, duration: .34, ease: "power2.inOut" }, .18)
        .to(".connection-line--three", { x: 0, z: -30, scale: .9, duration: .34, ease: "power2.inOut" }, .28)
        .fromTo(".connection-thesis span", { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: .18, ease: "power3.out" }, .52)
        .fromTo(".connection-thesis strong", { y: 60, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .25, ease: "power4.out" }, .61)
        .to(".connection-orbit", { rotateX: 62, rotateZ: 24, scale: 1.35, opacity: .55, duration: .52, ease: "power2.inOut" }, .18)
        .to(".letterbox--top", { yPercent: -105, duration: .12, ease: "power3.out" }, .88)
        .to(".letterbox--bottom", { yPercent: 105, duration: .12, ease: "power3.out" }, .88);

      if (ecosystem) {
        connectionTimeline
          .to(ecosystem.uniforms.uMorph, { value: 1, duration: .66, ease: "power2.inOut" }, .12)
          .to(ecosystem.camera.position, { z: 5.2, y: .25, duration: .58, ease: "power2.inOut" }, .16)
          .to(ecosystem.points.rotation, { y: .5, z: .34, duration: .7, ease: "none" }, .12)
          .to(ecosystem.camera.position, { z: 7.1, y: 0, duration: .22, ease: "power3.out" }, .78);
      }

      gsap.fromTo("#map-plane", { rotateX: 12, rotateY: -2, z: -110, scale: .92 }, {
        rotateX: 0, rotateY: 0, z: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: "#evidence", start: "top 88%", end: "top 18%", scrub: .72 }
      });
      } else if (conditions.compact && ecosystem) {
        gsap.set(ecosystem.uniforms.uMorph, { value: .82 });
        ecosystem.render(0);
      }
    });

    gsap.from(".evidence-heading h2", { xPercent: -9, rotateY: 5, opacity: .3, duration: 1.05, ease: "power3.out", scrollTrigger: { trigger: ".evidence-heading", start: "top 78%" } });
    gsap.from(".planner-heading h2", { clipPath: "inset(0 100% 0 0)", duration: 1.15, ease: "power4.inOut", scrollTrigger: { trigger: ".planner-heading", start: "top 78%" } });
    gsap.from("#patch-result", { y: 80, rotateY: -4, opacity: .45, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".planner-layout", start: "top 72%" } });
    gsap.from(".resolution-copy h2", { scale: .87, z: -100, opacity: .25, transformOrigin: "left center", duration: 1.3, ease: "power4.out", scrollTrigger: { trigger: "#resolution", start: "top 70%" } });
    if (ecosystem) {
      gsap.to(ecosystem.points.rotation, { y: 1.15, z: .55, ease: "none", scrollTrigger: { trigger: "#resolution", start: "top bottom", end: "bottom top", scrub: .65 } });
    }
  }

  ScrollTrigger.create({
    trigger: "#evidence",
    start: "top 80px",
    endTrigger: "#planner",
    end: "bottom 80px",
    onToggle: ({ isActive }) => document.querySelector(".site-header").classList.toggle("on-light", isActive)
  });
  ScrollTrigger.refresh();
}

setupInterface();
generatePlan(false);
const ecosystem = createEcosystem();
setupMotion(ecosystem);
setupDepthPlate();
initMap().catch((error) => {
  console.error("Google Maps initialization failed:", error);
  setApiMessage("Google Maps could not load. Biodiversity data and the planner remain available.");
}).finally(loadArea);
window.addEventListener("beforeunload", () => ecosystem?.dispose(), { once: true });
