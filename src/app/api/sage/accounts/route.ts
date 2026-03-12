/**
 * API Route: Fetch Sage Chart of Accounts
 */

import { NextResponse } from 'next/server';
import { sageAPI } from '@/lib/sage-api';
import { getSageConfig } from '@/lib/sage-config';

export async function GET() {
  try {
    const accounts = await sageAPI.getAccounts();
    
    return NextResponse.json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch accounts';

    if (message.includes('(404)') || message.includes('Resource not found')) {
      const config = getSageConfig();

      try {
        const businesses = await sageAPI.getBusinesses();
        return NextResponse.json({
          success: true,
          count: 0,
          data: [],
          connected: true,
          fallback: true,
          message:
            'Connected to Sage OAuth. Chart of accounts endpoint is unavailable for this account/API variant.',
          businesses,
        });
      } catch {
        if (config.businessId.trim()) {
          return NextResponse.json({
            success: true,
            count: 0,
            data: [],
            connected: true,
            fallback: true,
            message:
              'Connected to Sage OAuth. Using configured business because chart of accounts endpoint is unavailable for this account/API variant.',
            businesses: [
              {
                id: config.businessId,
                name: config.businessName || 'Configured Business',
              },
            ],
          });
        }

        return NextResponse.json(
          {
            success: false,
            error:
              'Connected to Sage OAuth, but this account does not expose the configured chart of accounts endpoint.',
          },
          { status: 500 }
        );
      }
    }

    console.error('Error fetching Sage accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
