import { execSync, spawn } from 'child_process';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface AutomationStatus {
  isInstalled: boolean;
  isRunning: boolean;
  ollamaPath: string | null;
  models: string[];
  hasVisionModel: boolean;
  recommendedModel: string;
}

export function findOllamaExe(): string | null {
  try {
    const stdout = execSync('where.exe ollama', { encoding: 'utf-8' }).trim();
    if (stdout) {
      const first = stdout.split(/\r?\n/)[0].trim();
      if (fs.existsSync(first)) return first;
    }
  } catch {}

  const localAppData = process.env.LOCALAPPDATA || '';
  const defaultPath = path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe');
  if (fs.existsSync(defaultPath)) return defaultPath;

  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const pfPath = path.join(progFiles, 'Ollama', 'ollama.exe');
  if (fs.existsSync(pfPath)) return pfPath;

  return null;
}

export function checkOllamaRunning(): Promise<{ isRunning: boolean; models: any[] }> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ isRunning: true, models: json.models || [] });
        } catch {
          resolve({ isRunning: true, models: [] });
        }
      });
    });
    req.on('error', () => resolve({ isRunning: false, models: [] }));
    req.setTimeout(3500, () => {
      req.destroy();
      resolve({ isRunning: false, models: [] });
    });
  });
}

export async function getFullStatus(): Promise<AutomationStatus> {
  const exePath = findOllamaExe();
  const isInstalled = Boolean(exePath);
  const { isRunning, models } = await checkOllamaRunning();

  const modelNames: string[] = models.map((m: any) => m.name || '');
  const hasVision = modelNames.some((n) =>
    n.toLowerCase().includes('gemma4') ||
    n.toLowerCase().includes('qwen') ||
    n.toLowerCase().includes('vision')
  );

  let recommended = 'gemma4:e4b';
  if (modelNames.some((n) => n.includes('gemma4:e4b'))) {
    recommended = 'gemma4:e4b';
  } else if (modelNames.some((n) => n.includes('qwen2.5-vl'))) {
    recommended = modelNames.find((n) => n.includes('qwen2.5-vl')) || 'qwen2.5-vl:3b';
  } else if (modelNames.length > 0) {
    recommended = modelNames[0];
  }

  return {
    isInstalled,
    isRunning,
    ollamaPath: exePath,
    models: modelNames,
    hasVisionModel: hasVision,
    recommendedModel: recommended
  };
}

export async function launchOllamaEngine(): Promise<boolean> {
  const status = await checkOllamaRunning();
  if (status.isRunning) return true;

  const exe = findOllamaExe();
  if (!exe) return false;

  const appExe = path.join(path.dirname(exe), 'ollama app.exe');
  const targetExe = fs.existsSync(appExe) ? appExe : exe;
  const args = targetExe.endsWith('ollama app.exe') ? [] : ['serve'];

  try {
    const child = spawn(targetExe, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    child.unref();
  } catch (err) {
    console.error('Failed to spawn ollama:', err);
  }

  // Poll for up to 10 seconds
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const chk = await checkOllamaRunning();
    if (chk.isRunning) return true;
  }

  return false;
}

export async function downloadInstaller(onProgress?: (pct: number) => void): Promise<string> {
  const installerPath = path.join(os.tmpdir(), 'OllamaSetup.exe');
  if (fs.existsSync(installerPath) && fs.statSync(installerPath).size > 10000000) {
    return installerPath;
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(installerPath);
    https.get('https://ollama.com/download/OllamaSetup.exe', (res) => {
      // Handle redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redRes) => {
          pipeDownload(redRes);
        }).on('error', reject);
      } else {
        pipeDownload(res);
      }

      function pipeDownload(response: any) {
        const total = parseInt(response.headers['content-length'] || '0', 10);
        let cur = 0;
        response.on('data', (chunk: Buffer) => {
          cur += chunk.length;
          if (total > 0 && onProgress) {
            onProgress(Math.round((cur / total) * 100));
          }
        });
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(installerPath);
        });
        response.on('error', (err: any) => {
          fs.unlink(installerPath, () => {});
          reject(err);
        });
      }
    }).on('error', reject);
  });
}

export async function handleSetupStream(res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const send = (data: Record<string, any>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send({ step: 1, stage: 'detect', title: 'Checking Engine', message: 'Detecting local AI installation...' });

    let status = await getFullStatus();

    // 1. If not installed on system, download & launch installer
    if (!status.isInstalled) {
      send({ step: 1, stage: 'downloading_installer', title: 'Downloading Engine', message: 'Downloading official Ollama installer...' });
      try {
        const installer = await downloadInstaller((pct) => {
          send({ step: 1, stage: 'downloading_installer', percent: pct, message: `Downloading installer (${pct}%)...` });
        });
        send({ step: 1, stage: 'running_installer', title: 'Installing Engine', message: 'Running automated installer...' });
        
        // Spawn installer silently or normally
        spawn(installer, ['/silent'], { detached: true, stdio: 'ignore' }).unref();

        // Wait up to 30 seconds for installation to finish
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          if (findOllamaExe()) break;
        }
      } catch (err: any) {
        send({ step: 1, stage: 'error', error: 'Failed to download installer: ' + err.message });
        res.end();
        return;
      }
    }

    send({ step: 1, stage: 'engine_found', title: 'Engine Detected', message: 'Ollama local engine is installed.' });

    // 2. Ensure engine is running
    status = await getFullStatus();
    if (!status.isRunning) {
      send({ step: 1, stage: 'starting_service', title: 'Starting Service', message: 'Launching Ollama background service...' });
      const started = await launchOllamaEngine();
      if (!started) {
        send({ step: 1, stage: 'error', error: 'Could not automatically start Ollama. Please ensure it is running in your system tray.' });
        res.end();
        return;
      }
    }

    send({ step: 1, stage: 'service_running', title: 'Engine Connected', message: 'Local AI service is active and responsive.' });

    // 3. Check for vision model
    status = await getFullStatus();
    const targetModel = 'gemma4:e4b';

    if (status.models.some((m) => m.toLowerCase().includes('gemma4') || m.toLowerCase().includes('qwen') || m.toLowerCase().includes('vision'))) {
      const active = status.recommendedModel;
      send({
        step: 2,
        stage: 'model_ready',
        title: 'Model Ready',
        message: `High-accuracy vision model (${active}) is installed.`,
        model: active
      });
    } else {
      send({
        step: 2,
        stage: 'pulling_model',
        title: 'Setting Up Model',
        message: `Downloading ${targetModel} vision model (this runs once)...`,
        percent: 0
      });

      // Stream pull from Ollama native API
      await new Promise<void>((resolve, reject) => {
        const postData = JSON.stringify({ name: targetModel, stream: true });
        const req = http.request(
          'http://127.0.0.1:11434/api/pull',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          },
          (pullRes) => {
            let buffer = '';
            pullRes.on('data', (chunk) => {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const parsed = JSON.parse(line);
                  let pct = 0;
                  if (parsed.total && parsed.completed) {
                    pct = Math.round((parsed.completed / parsed.total) * 100);
                  }
                  send({
                    step: 2,
                    stage: 'pulling_model',
                    status: parsed.status,
                    percent: pct,
                    completed: parsed.completed,
                    total: parsed.total,
                    message: parsed.status || 'Downloading model...'
                  });
                } catch {}
              }
            });
            pullRes.on('end', () => resolve());
            pullRes.on('error', reject);
          }
        );
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    }

    // 4. Completed!
    const finalStatus = await getFullStatus();
    send({
      step: 3,
      stage: 'completed',
      title: 'Setup Complete!',
      message: 'Local AI engine and vision parser are 100% ready.',
      success: true,
      model: finalStatus.recommendedModel
    });
  } catch (err: any) {
    send({ step: 1, stage: 'error', error: err.message || 'Unexpected setup error' });
  } finally {
    res.end();
  }
}
