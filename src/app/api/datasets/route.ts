import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { parseAndProfileCSV } from '@/lib/csv-parser';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const datasets = await db.dataset.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        filename: true,
        fileSizeBytes: true,
        rowCount: true,
        unparseableCount: true,
        columns: true,
        createdAt: true,
        _count: {
          select: { reports: true },
        },
      },
    });

    const parsedDatasets = datasets.map((d) => ({
      ...d,
      columns: JSON.parse(d.columns),
      reportCount: d._count.reports,
    }));

    return NextResponse.json({ datasets: parsedDatasets });
  } catch (error: any) {
    console.error('Fetch datasets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customName = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Limit file size (15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size of 15MB.' },
        { status: 400 }
      );
    }

    const filename = file.name;
    const isCsv = filename.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCsv) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a standard CSV file.' },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Parse & Profile
    const { profile, validRows } = parseAndProfileCSV(text);

    const datasetName = (customName && customName.trim()) || filename.replace(/\.csv$/i, '');

    // Transaction to insert Dataset and valid Rows
    const dataset = await db.dataset.create({
      data: {
        userId: session.id,
        name: datasetName,
        filename,
        fileSizeBytes: file.size,
        rowCount: profile.rowCount,
        unparseableCount: profile.unparseableCount,
        columns: JSON.stringify(profile.columns),
        unparseableRows: JSON.stringify(profile.unparseableRows),
      },
    });

    // Batch insert valid rows in chunks
    const CHUNK_SIZE = 500;
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      await db.datasetRow.createMany({
        data: chunk.map((r) => ({
          datasetId: dataset.id,
          rowNumber: r.rowNumber,
          data: JSON.stringify(r.data),
          isValid: true,
        })),
      });
    }

    return NextResponse.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        filename: dataset.filename,
        fileSizeBytes: dataset.fileSizeBytes,
        rowCount: dataset.rowCount,
        unparseableCount: dataset.unparseableCount,
        columns: profile.columns,
        unparseableRows: profile.unparseableRows,
        createdAt: dataset.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Dataset upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse and upload CSV' },
      { status: 400 }
    );
  }
}
