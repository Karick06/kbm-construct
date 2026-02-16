/**
 * API Route: Fetch Sage Chart of Accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';

export async function GET(request: NextRequest) {
  try {
    const accounts = await sageAPI.getAccounts();
    
    return NextResponse.json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    console.error('Error fetching Sage accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch accounts',
      },
      { status: 500 }
    );
  }
}
