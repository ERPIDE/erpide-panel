import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const WATCHER_DATA_PATH = 'C:\\visa-watcher\\watcher_data.json';

function loadWatcherData() {
  try {
    const data = fs.readFileSync(WATCHER_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Watcher data load error:', error);
    return { applicants: [] };
  }
}

function saveWatcherData(data: any) {
  try {
    fs.writeFileSync(WATCHER_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Watcher data save error:', error);
    return false;
  }
}

export async function GET() {
  const data = loadWatcherData();
  return NextResponse.json(data.applicants || []);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loadWatcherData();

    const newApplicant = {
      ...body,
      id: Math.random().toString(36).substr(2, 9),
      owner: 'admin',
      form_status: {},
      bookings: {},
    };

    data.applicants.push(newApplicant);

    if (saveWatcherData(data)) {
      return NextResponse.json(newApplicant, { status: 201 });
    }

    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const data = loadWatcherData();
  data.applicants = data.applicants.filter((a: any) => a.id !== id);

  if (saveWatcherData(data)) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Save failed' }, { status: 500 });
}
