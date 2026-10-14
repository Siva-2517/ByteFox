import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId, blockId } = await params;
    const body = await request.json();
    const { title, config } = body;

    // Verify report ownership
    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const block = await db.reportBlock.findFirst({
      where: { id: blockId, reportId },
    });

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    }

    const updated = await db.reportBlock.update({
      where: { id: blockId },
      data: {
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
      },
    });

    return NextResponse.json({
      block: {
        id: updated.id,
        orderIndex: updated.orderIndex,
        blockType: updated.blockType,
        title: updated.title,
        config: JSON.parse(updated.config),
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update block error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update block' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId, blockId } = await params;

    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.reportBlock.delete({
      where: { id: blockId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete block error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete block' },
      { status: 500 }
    );
  }
}
