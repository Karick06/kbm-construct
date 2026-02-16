/**
 * API Route: Fetch Sage Customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET(request: NextRequest) {
  try {
    const customers = await sageAPI.getCustomers();
    
    return NextResponse.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching Sage customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
      },
      { status: 500 }
    );
  }
}
