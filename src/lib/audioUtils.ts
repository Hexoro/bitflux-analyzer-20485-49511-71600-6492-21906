// Audio generation utilities for binary data

export class BinaryAudioGenerator {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private startTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    }
  }

  generateFromBinary(bits: string, mode: 'pcm' | 'rhythm' | 'frequency' | 'melody' = 'frequency'): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = Math.min(bits.length / 8000, 30); // Max 30 seconds
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    switch (mode) {
      case 'pcm':
        this.generatePCM(bits, channelData);
        break;
      case 'rhythm':
        this.generateRhythm(bits, channelData, sampleRate);
        break;
      case 'frequency':
        this.generateFrequency(bits, channelData, sampleRate);
        break;
      case 'melody':
        this.generateMelody(bits, channelData, sampleRate);
        break;
    }

    return buffer;
  }

  private generatePCM(bits: string, data: Float32Array) {
    for (let i = 0; i < data.length && i < bits.length; i++) {
      data[i] = bits[i] === '1' ? 0.3 : -0.3;
    }
  }

  private generateRhythm(bits: string, data: Float32Array, sampleRate: number) {
    const beatDuration = sampleRate * 0.1; // 100ms beats
    let bitIndex = 0;

    for (let i = 0; i < data.length; i++) {
      const beatPos = i % beatDuration;
      const bit = bits[bitIndex % bits.length];
      
      if (bit === '1' && beatPos < beatDuration * 0.3) {
        const decay = 1 - (beatPos / (beatDuration * 0.3));
        data[i] = Math.sin(i * 0.5) * 0.3 * decay;
      }
      
      if (beatPos === 0) bitIndex++;
    }
  }

  private generateFrequency(bits: string, data: Float32Array, sampleRate: number) {
    const baseFreq = 220; // A3
    const noteDuration = sampleRate * 0.05; // 50ms per bit
    
    for (let i = 0; i < data.length; i++) {
      const bitIndex = Math.floor(i / noteDuration) % bits.length;
      const byteStr = bits.slice(Math.max(0, bitIndex - 7), bitIndex + 1).padStart(8, '0');
      const byteValue = parseInt(byteStr, 2);
      const freq = baseFreq + (byteValue / 256) * 880;
      
      const decay = 1 - ((i % noteDuration) / noteDuration);
      data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.2 * decay;
    }
  }

  private generateMelody(bits: string, data: Float32Array, sampleRate: number) {
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
    const noteDuration = sampleRate * 0.15;
    
    for (let i = 0; i < data.length; i++) {
      const bitIndex = Math.floor(i / noteDuration);
      const chunk = bits.slice(bitIndex * 3, bitIndex * 3 + 3).padEnd(3, '0');
      const noteIndex = parseInt(chunk, 2) % notes.length;
      const freq = notes[noteIndex];
      
      const envelope = Math.min(1, (i % noteDuration) / (noteDuration * 0.1));
      const decay = Math.max(0, 1 - ((i % noteDuration) / noteDuration));
      data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.2 * envelope * decay;
    }
  }

  play(buffer: AudioBuffer, volume: number = 0.5, playbackRate: number = 1) {
    if (!this.audioContext || !this.gainNode) return;

    this.stop();
    
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.playbackRate.value = playbackRate;
    this.sourceNode.loop = true; // Enable looping
    this.sourceNode.connect(this.gainNode);
    this.gainNode.gain.value = volume;
    this.startTime = this.audioContext.currentTime;
    this.sourceNode.start(0);
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.sourceNode) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.sourceNode?.buffer?.duration || 0;
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  cleanup() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
