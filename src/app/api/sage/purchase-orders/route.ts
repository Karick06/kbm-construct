/**
 * API Route: Fetch Sage Purchase Orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET(request: NextRequest) {
  try {
    const purchaseOrders = await sageAPI.getPurchaseOrders();
    
    return NextResponse.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders,
    });
  } catch (error) {
    console.error('Error fetching Sage purchase orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch purchase orders',
      },
      { status: 500 }
    );
  }
}
