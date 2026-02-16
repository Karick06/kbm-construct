/**
 * API Route: Fetch Sage Invoices
 * Syncs invoice data from Sage 50
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET(request: NextRequest) {
  try {
    const invoices = await sageAPI.getInvoices();
    
    return NextResponse.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching Sage invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices',
      },
      { status: 500 }
    );
  }
}
