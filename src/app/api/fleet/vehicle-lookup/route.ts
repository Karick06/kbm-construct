import { NextRequest, NextResponse } from "next/server";

type VehicleLookupResponse = {
  found: boolean;
  brand?: string;
  model?: string;
  type?: string;
  source?: "dvla" | "none";
  message?: string;
};

function normalizeRegistration(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function titleCase(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function mapVehicleType(rawBodyType: string | undefined): string {
  const bodyType = (rawBodyType || "").toLowerCase();

  if (bodyType.includes("articulated") || bodyType.includes("tractor")) return "Articulated Lorry";
  if (bodyType.includes("lorry") || bodyType.includes("goods") || bodyType.includes("hgv")) return "Rigid Lorry";
  if (bodyType.includes("minibus") || bodyType.includes("bus")) return "Minibus";
  if (bodyType.includes("pick") || bodyType.includes("pickup")) return "Pickup";
  if (bodyType.includes("crew")) return "Crew Van";
  if (bodyType.includes("panel van") || bodyType.includes("van")) return "Panel Van";
  if (bodyType.includes("estate")) return "Estate Car";
  if (bodyType.includes("suv") || bodyType.includes("4x4")) return "SUV / 4x4";
  if (bodyType.includes("saloon") || bodyType.includes("sedan")) return "Saloon Car";
  if (bodyType.includes("hatch") || bodyType.includes("coupe") || bodyType.includes("convertible")) return "Small Car";

  return "Small Car";
}

export async function GET(request: NextRequest) {
  const registration = normalizeRegistration(request.nextUrl.searchParams.get("registration") || "");

  if (!registration) {
    return NextResponse.json<VehicleLookupResponse>(
      { found: false, source: "none", message: "registration is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.DVLA_VEHICLE_ENQUIRY_API_KEY;
  if (!apiKey) {
    return NextResponse.json<VehicleLookupResponse>({
      found: false,
      source: "none",
      message: "DVLA lookup key not configured",
    });
  }

  try {
    const response = await fetch("https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ registrationNumber: registration }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json<VehicleLookupResponse>({
        found: false,
        source: "none",
        message: "No vehicle record returned",
      });
    }

    const data = (await response.json()) as {
      make?: string;
      bodyType?: string;
      wheelplan?: string;
      monthOfFirstRegistration?: string;
    };

    const brand = titleCase(data.make);
    const type = mapVehicleType(data.bodyType || data.wheelplan);

    return NextResponse.json<VehicleLookupResponse>({
      found: Boolean(brand),
      brand,
      // DVLA endpoint does not reliably provide a model field.
      model: "",
      type,
      source: "dvla",
    });
  } catch {
    return NextResponse.json<VehicleLookupResponse>({
      found: false,
      source: "none",
      message: "Lookup request failed",
    });
  }
}
