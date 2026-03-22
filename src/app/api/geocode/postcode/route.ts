import { NextRequest, NextResponse } from 'next/server';

type PostcodesIoResponse = {
  status: number;
  result?: {
    postcode: string;
    latitude: number;
    longitude: number;
  };
};

export async function GET(request: NextRequest) {
  try {
    const postcode = request.nextUrl.searchParams.get('postcode')?.trim();

    if (!postcode) {
      return NextResponse.json(
        { success: false, error: 'postcode is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      {
        cache: 'no-store',
      }
    );

    const data = (await response.json()) as PostcodesIoResponse;

    if (!response.ok || data.status !== 200 || !data.result) {
      return NextResponse.json(
        { success: false, error: 'Postcode not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      },
    });
  } catch (error) {
    console.error('Postcode geocode error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to geocode postcode' },
      { status: 500 }
    );
  }
}