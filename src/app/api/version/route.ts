import { NextResponse } from 'next/server';

function shortCommit(value: string): string {
  if (!value) return 'unknown';
  return value.slice(0, 7);
}

export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_VERSION || 'local-dev';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'local';
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

  return NextResponse.json({
    success: true,
    data: {
      commit: shortCommit(commitSha),
      branch,
      environment,
      fullCommit: commitSha,
    },
  });
}
