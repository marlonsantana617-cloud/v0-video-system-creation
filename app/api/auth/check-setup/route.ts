import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Check if any users exist (for setup page)
export async function GET() {
  try {
    const users = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    )

    const hasUsers = users[0] && users[0].count > 0

    return NextResponse.json({ hasUsers })
  } catch {
    // If table doesn't exist or error, allow setup
    return NextResponse.json({ hasUsers: false })
  }
}
