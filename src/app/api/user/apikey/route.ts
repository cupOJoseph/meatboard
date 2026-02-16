import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/db';
import { hashApiKey } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const walletAddress = body.wallet_address as string | undefined;
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet_address', code: 'INVALID_REQUEST' }, { status: 400 });
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { address: walletAddress.toLowerCase() },
      update: {},
      create: { address: walletAddress.toLowerCase() },
    });

    // Generate key
    const plaintext = 'mb_' + randomBytes(32).toString('hex');
    const hashed = hashApiKey(plaintext);

    await prisma.apiKey.create({
      data: {
        key: hashed,
        userId: user.id,
        label: body.label || 'default',
      },
    });

    return NextResponse.json({
      api_key: plaintext,
      message: 'Store this key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Failed to generate API key', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
