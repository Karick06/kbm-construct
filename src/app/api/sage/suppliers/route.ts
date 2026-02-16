/**
 * API Route: Fetch Sage Suppliers
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET(request: NextRequest) {
  try {
    const suppliers = await sageAPI.getSuppliers();
    
    return NextResponse.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    console.error('Error fetching Sage suppliers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
      },
      { status: 500 }
    );
  }
}
