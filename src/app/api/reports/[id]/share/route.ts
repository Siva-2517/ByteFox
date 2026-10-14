import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;
    const body = await request.json().catch(() => ({}));
    const { expiresInHours } = body; // e.g. 1, 24, 168 (7 days), or null/undefined (no expiration)

    // Verify report ownership
    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const token = crypto.randomBytes(16).toString('hex');
    let expiresAt: Date | null = null;
    if (expiresInHours && typeof expiresInHours === 'number' && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const shareLink = await db.shareLink.create({
      data: {
        reportId,
        token,
        expiresAt,
        isRevoked: false,
      },
    });

    return NextResponse.json({
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        isRevoked: shareLink.isRevoked,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;
    const body = await request.json();
    const { shareLinkId } = body;

    // Verify report ownership
    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Instantly revoke the link
    const updated = await db.shareLink.updateMany({
      where: { id: shareLinkId, reportId },
      data: { isRevoked: true },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Share link revoked instantly.' });
  } catch (error: any) {
    console.error('Revoke share link error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
