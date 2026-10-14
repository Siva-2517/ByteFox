import { NextResponse } from 'next/server';
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
    const body = await request.json();
    const { blockType, title, config } = body;

    if (!blockType || !config) {
      return NextResponse.json(
        { error: 'Block type and configuration are required.' },
        { status: 400 }
      );
    }

    // Ensure report belongs to user
    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
      include: {
        blocks: {
          select: { orderIndex: true },
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const nextOrderIndex =
      report.blocks.length > 0 ? report.blocks[0].orderIndex + 1 : 0;

    const block = await db.reportBlock.create({
      data: {
        reportId,
        orderIndex: nextOrderIndex,
        blockType,
        title: title?.trim() || null,
        config: JSON.stringify(config),
      },
    });

    return NextResponse.json({
      block: {
        id: block.id,
        orderIndex: block.orderIndex,
        blockType: block.blockType,
        title: block.title,
        config: JSON.parse(block.config),
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create block error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create report block' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { orderedBlockIds } = body;

    if (!Array.isArray(orderedBlockIds)) {
      return NextResponse.json(
        { error: 'orderedBlockIds must be an array of block IDs.' },
        { status: 400 }
      );
    }

    // Ensure report belongs to user
    const report = await db.report.findFirst({
      where: { id: reportId, userId: session.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update orderIndex for each block
    for (let i = 0; i < orderedBlockIds.length; i++) {
      await db.reportBlock.updateMany({
        where: { id: orderedBlockIds[i], reportId },
        data: { orderIndex: i },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reorder blocks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder blocks' },
      { status: 500 }
    );
  }
}
