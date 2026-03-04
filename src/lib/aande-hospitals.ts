export interface AandeHospital {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface NearestAandeHospital {
  hospital: AandeHospital;
  distanceKm: number;
}

const AANDE_HOSPITALS: AandeHospital[] = [
  // England - South
  { name: "St Thomas' Hospital A&E", address: "Westminster Bridge Rd, London", postcode: "SE1 7EH", phone: "020 7188 7188", lat: 51.4981, lng: -0.1187 },
  { name: "Royal London Hospital A&E", address: "Whitechapel Rd, London", postcode: "E1 1FR", phone: "020 7377 7000", lat: 51.5190, lng: -0.0592 },
  { name: "Royal Sussex County Hospital A&E", address: "Eastern Rd, Brighton", postcode: "BN2 5BE", phone: "01273 696955", lat: 50.8195, lng: -0.1180 },
  { name: "University Hospital Southampton A&E", address: "Tremona Rd, Southampton", postcode: "SO16 6YD", phone: "023 8077 7222", lat: 50.9324, lng: -1.4310 },
  { name: "Derriford Hospital A&E", address: "Derriford Rd, Plymouth", postcode: "PL6 8DH", phone: "01752 202082", lat: 50.4196, lng: -4.1186 },
  { name: "Kent and Canterbury Hospital A&E", address: "Ethelbert Rd, Canterbury", postcode: "CT1 3NG", phone: "01227 766877", lat: 51.2743, lng: 1.0900 },
  // England - Midlands & Central
  { name: "Queen Elizabeth Hospital Birmingham A&E", address: "Mindelsohn Way, Birmingham", postcode: "B15 2WB", phone: "0121 371 2000", lat: 52.4532, lng: -1.9399 },
  { name: "University Hospital Coventry A&E", address: "Clifford Bridge Rd, Coventry", postcode: "CV2 2DX", phone: "024 7696 4000", lat: 52.4211, lng: -1.4435 },
  { name: "Royal Stoke University Hospital A&E", address: "Newcastle Rd, Stoke-on-Trent", postcode: "ST4 6QG", phone: "01782 715444", lat: 53.0031, lng: -2.2124 },
  { name: "Nottingham QMC A&E", address: "Derby Rd, Nottingham", postcode: "NG7 2UH", phone: "0115 924 9924", lat: 52.9437, lng: -1.1854 },
  // England - North
  { name: "Manchester Royal Infirmary A&E", address: "Oxford Rd, Manchester", postcode: "M13 9WL", phone: "0161 276 1234", lat: 53.4608, lng: -2.2275 },
  { name: "Leeds General Infirmary A&E", address: "Great George St, Leeds", postcode: "LS1 3EX", phone: "0113 243 2799", lat: 53.8011, lng: -1.5537 },
  { name: "Barnsley Hospital A&E", address: "Gawber Road, Barnsley", postcode: "S75 2EP", phone: "01226 730000", lat: 53.5512, lng: -1.4694 },
  { name: "Royal Victoria Infirmary A&E", address: "Queen Victoria Rd, Newcastle", postcode: "NE1 4LP", phone: "0191 233 6161", lat: 54.9800, lng: -1.6174 },
  { name: "James Cook University Hospital A&E", address: "Marton Rd, Middlesbrough", postcode: "TS4 3BW", phone: "01642 850850", lat: 54.5514, lng: -1.2148 },
  // England - South West
  { name: "Southmead Hospital A&E", address: "Southmead Rd, Bristol", postcode: "BS10 5NB", phone: "0117 950 5050", lat: 51.4948, lng: -2.5928 },
  { name: "Norfolk and Norwich University Hospital A&E", address: "Colney Ln, Norwich", postcode: "NR4 7UY", phone: "01603 286286", lat: 52.6183, lng: 1.2201 },
  // Wales
  { name: "University Hospital of Wales A&E", address: "Heath Park, Cardiff", postcode: "CF14 4XW", phone: "029 2074 7747", lat: 51.5081, lng: -3.1840 },
  { name: "University Hospital Llandough A&E", address: "Penarth Rd, Cardiff", postcode: "CF64 2XX", phone: "029 2071 1711", lat: 51.4408, lng: -3.1897 },
  // Scotland
  { name: "Royal Infirmary of Edinburgh A&E", address: "Little France Cres, Edinburgh", postcode: "EH16 4SA", phone: "0131 536 1000", lat: 55.9230, lng: -3.1368 },
  { name: "Glasgow Royal Infirmary A&E", address: "84 Castle St, Glasgow", postcode: "G4 0SF", phone: "0141 211 4000", lat: 55.8628, lng: -4.2341 },
  { name: "Ayr Hospital A&E", address: "Dalmellington Rd, Ayr", postcode: "KA8 0DX", phone: "01292 610555", lat: 55.4577, lng: -4.6389 },
  { name: "Dumfries and Galloway Royal Infirmary A&E", address: "Bankend Rd, Dumfries", postcode: "DG1 4AP", phone: "01387 246246", lat: 55.3753, lng: -3.6082 },
  { name: "Ninewells Hospital A&E", address: "Dundee", postcode: "DD1 9SY", phone: "01382 660111", lat: 56.4580, lng: -2.9932 },
  { name: "Aberdeen Royal Infirmary A&E", address: "Aberdeen", postcode: "AB25 2ZN", phone: "01224 681818", lat: 57.1625, lng: -2.0975 },
  { name: "Raigmore Hospital A&E", address: "Inverness", postcode: "IV2 3UJ", phone: "01463 704000", lat: 57.4755, lng: -4.2248 },
];

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function findNearestAandeHospital(lat: number, lng: number): NearestAandeHospital | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (AANDE_HOSPITALS.length === 0) return null;

  let nearest = AANDE_HOSPITALS[0];
  let nearestDistanceKm = haversineDistanceKm(lat, lng, nearest.lat, nearest.lng);

  for (const hospital of AANDE_HOSPITALS.slice(1)) {
    const distanceKm = haversineDistanceKm(lat, lng, hospital.lat, hospital.lng);
    if (distanceKm < nearestDistanceKm) {
      nearest = hospital;
      nearestDistanceKm = distanceKm;
    }
  }

  return {
    hospital: nearest,
    distanceKm: Number(nearestDistanceKm.toFixed(1)),
  };
}
