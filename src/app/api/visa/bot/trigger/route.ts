import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { applicantId, country } = await request.json();

    if (!applicantId || !country) {
      return NextResponse.json(
        { error: 'Missing applicantId or country' },
        { status: 400 }
      );
    }

    // Bot'u background'da başlat
    const botProcess = spawn('python', [
      'C:\\visa-watcher\\kosmos_auto_full.py'
    ], {
      cwd: 'C:\\visa-watcher',
      detached: true,
      stdio: 'ignore',
    });

    botProcess.unref();

    return NextResponse.json({
      success: true,
      message: `${country} için bot başlatıldı. Sonuç Telegram'a gelecek.`,
      applicantId,
      country,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), success: false },
      { status: 500 }
    );
  }
}
