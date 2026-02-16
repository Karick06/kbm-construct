/**
 * API Route: BoQ Templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { BOQ_TEMPLATES, getTemplatesByStandard } from '@/lib/boq-templates';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const standard = searchParams.get('standard');

  try {
    let templates = BOQ_TEMPLATES;

    if (standard && ['SMM7', 'CESMM', 'SHW'].includes(standard)) {
      templates = getTemplatesByStandard(standard as 'SMM7' | 'CESMM' | 'SHW');
    }

    return NextResponse.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching BoQ templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
