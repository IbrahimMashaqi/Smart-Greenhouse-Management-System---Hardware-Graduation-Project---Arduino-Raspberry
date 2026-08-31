import { TelemetryData } from '@/types/greenhouse';

// Helper to check if Web Serial API is supported in browser
export function isWebSerialSupported(): boolean {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

export class SerialManager {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private keepReading = false;
  private buffer = '';

  private onDataCallback: ((data: TelemetryData, rawJson: string) => void) | null = null;
  private onLogCallback: ((direction: 'IN' | 'OUT' | 'SYS', text: string) => void) | null = null;
  private onErrorCallback: ((err: Error) => void) | null = null;

  public setCallbacks(callbacks: {
    onData?: (data: TelemetryData, rawJson: string) => void;
    onLog?: (direction: 'IN' | 'OUT' | 'SYS', text: string) => void;
    onError?: (err: Error) => void;
  }) {
    if (callbacks.onData) this.onDataCallback = callbacks.onData;
    if (callbacks.onLog) this.onLogCallback = callbacks.onLog;
    if (callbacks.onError) this.onErrorCallback = callbacks.onError;
  }

  public async connect(baudRate: number = 9600): Promise<boolean> {
    if (!isWebSerialSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Use Chrome, Edge, or Opera.');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      this.log('SYS', `Serial port opened successfully at ${baudRate} baud`);

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      this.keepReading = true;
      this.readLoop();
      return true;
    } catch (err: any) {
      this.log('SYS', `Connection error: ${err.message || err}`);
      if (this.onErrorCallback) this.onErrorCallback(err);
      return false;
    }
  }

  private async readLoop() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          this.reader.releaseLock();
          break;
        }
        if (value) {
          this.processChunk(value);
        }
      }
    } catch (err: any) {
      if (this.keepReading) {
        this.log('SYS', `Read error: ${err.message || err}`);
        if (this.onErrorCallback) this.onErrorCallback(err);
      }
    }
  }

  private processChunk(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    // Keep the last incomplete fragment in buffer
    this.buffer = lines.pop() || '';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      this.log('IN', line);

      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const parsed = JSON.parse(line) as TelemetryData;
          if (this.onDataCallback) {
            this.onDataCallback(parsed, line);
          }
        } catch (e) {
          // Non-JSON message from Arduino (like "SYSTEM READY" or "PUMP ON")
        }
      }
    }
  }

  public async sendCommand(cmd: string): Promise<boolean> {
    if (!this.writer) {
      this.log('SYS', `Cannot send command "${cmd}": Serial port not connected`);
      return false;
    }
    try {
      const formattedCmd = cmd.endsWith('\n') ? cmd : cmd + '\n';
      await this.writer.write(formattedCmd);
      this.log('OUT', cmd);
      return true;
    } catch (err: any) {
      this.log('SYS', `Failed to send command "${cmd}": ${err.message || err}`);
      if (this.onErrorCallback) this.onErrorCallback(err);
      return false;
    }
  }

  public async disconnect() {
    this.keepReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      this.log('SYS', 'Serial port disconnected');
    } catch (err: any) {
      this.log('SYS', `Error during disconnect: ${err.message || err}`);
    }
  }

  private log(direction: 'IN' | 'OUT' | 'SYS', text: string) {
    if (this.onLogCallback) {
      this.onLogCallback(direction, text);
    }
  }
}

export const serialManager = new SerialManager();
