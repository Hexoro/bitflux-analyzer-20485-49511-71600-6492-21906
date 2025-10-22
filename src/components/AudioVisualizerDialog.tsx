import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Play, Pause, Square, Volume2, Download } from 'lucide-react';
import { BinaryAudioGenerator } from '@/lib/audioUtils';

interface AudioVisualizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryData: string;
}

type AudioMode = 'pcm' | 'rhythm' | 'frequency' | 'melody';
type VisualizerStyle = 'waveform' | 'bars' | 'circle' | 'particles' | 'spiral';

export const AudioVisualizerDialog = ({ open, onOpenChange, binaryData }: AudioVisualizerDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatorRef = useRef<BinaryAudioGenerator | null>(null);
  const animationRef = useRef<number>();
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [playbackRate, setPlaybackRate] = useState([100]);
  const [audioMode, setAudioMode] = useState<AudioMode>('frequency');
  const [visualStyle, setVisualStyle] = useState<VisualizerStyle>('bars');
  const [showMirror, setShowMirror] = useState(false);
  const [colorCycle, setColorCycle] = useState(true);
  const [sensitivity, setSensitivity] = useState([100]);

  useEffect(() => {
    if (open && !generatorRef.current) {
      generatorRef.current = new BinaryAudioGenerator();
    }
    return () => {
      if (generatorRef.current) {
        generatorRef.current.cleanup();
        generatorRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!generatorRef.current || !open || !binaryData) return;
    try {
      const buffer = generatorRef.current.generateFromBinary(binaryData.slice(0, 50000), audioMode);
      audioBufferRef.current = buffer;
    } catch (error) {
      console.error('Failed to generate audio buffer:', error);
    }
  }, [binaryData, audioMode, open]);

  const handlePlay = () => {
    if (!generatorRef.current || !audioBufferRef.current) return;
    generatorRef.current.play(audioBufferRef.current, volume[0] / 100, playbackRate[0] / 100);
    setIsPlaying(true);
    startVisualization();
  };

  const handlePause = () => {
    if (!generatorRef.current) return;
    generatorRef.current.stop();
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleStop = () => {
    handlePause();
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    const analyser = generatorRef.current?.getAnalyser();
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    updateCanvasSize();

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let hueOffset = 0;

    const draw = () => {
      if (!isPlaying) return;

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      if (colorCycle) {
        hueOffset = (hueOffset + 1) % 360;
      }

      switch (visualStyle) {
        case 'waveform':
          drawWaveform(ctx, analyser, width, height, hueOffset);
          break;
        case 'bars':
          drawBars(ctx, dataArray, width, height, hueOffset);
          break;
        case 'circle':
          drawCircle(ctx, dataArray, width, height, hueOffset);
          break;
        case 'particles':
          drawParticles(ctx, dataArray, width, height, hueOffset);
          break;
        case 'spiral':
          drawSpiral(ctx, dataArray, width, height, hueOffset);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number, hueOffset: number) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    const sens = sensitivity[0] / 100;

    ctx.lineWidth = 3;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = ((dataArray[i] / 128.0) - 1) * sens;
      const y = (v * height / 2) + (height / 2);

      const hue = colorCycle ? (hueOffset + (i / bufferLength) * 120) % 360 : 180;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    if (showMirror) {
      ctx.save();
      ctx.scale(1, -1);
      ctx.translate(0, -height);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, hueOffset: number) => {
    const barCount = Math.min(dataArray.length, 128);
    const barWidth = width / barCount;
    const sens = sensitivity[0] / 100;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * height * sens;
      const x = i * barWidth;
      
      const hue = colorCycle ? (hueOffset + (i / barCount) * 360) % 360 : 180;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

      if (showMirror) {
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, 0, barWidth - 2, barHeight);
        ctx.globalAlpha = 1;
      }
    }
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, hueOffset: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const barCount = Math.min(dataArray.length, 128);
    const sens = sensitivity[0] / 100;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const barLength = (dataArray[i] / 255) * radius * sens;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      const hue = colorCycle ? (hueOffset + (i / barCount) * 360) % 360 : 180;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (showMirror) {
        const innerX = centerX + Math.cos(angle) * (radius - barLength);
        const innerY = centerY + Math.sin(angle) * (radius - barLength);
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(innerX, innerY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, hueOffset: number) => {
    const sens = sensitivity[0] / 100;

    // Add new particles based on audio
    for (let i = 0; i < dataArray.length; i += 10) {
      const amplitude = (dataArray[i] / 255) * sens;
      if (amplitude > 0.3 && Math.random() > 0.7) {
        particlesRef.current.push({
          x: (i / dataArray.length) * width,
          y: height / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - amplitude * 5,
          life: 1,
        });
      }
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life -= 0.01;

      if (p.life <= 0) return false;

      const size = p.life * 8;
      const hue = colorCycle ? (hueOffset + (p.x / width) * 360) % 360 : 180;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${p.life})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });

    // Limit particles
    if (particlesRef.current.length > 500) {
      particlesRef.current = particlesRef.current.slice(-500);
    }
  };

  const drawSpiral = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, hueOffset: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const barCount = Math.min(dataArray.length, 128);
    const sens = sensitivity[0] / 100;

    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 8;
      const radius = (i / barCount) * Math.min(width, height) / 2;
      const amplitude = (dataArray[i] / 255) * 50 * sens;
      
      const x = centerX + Math.cos(angle) * (radius + amplitude);
      const y = centerY + Math.sin(angle) * (radius + amplitude);

      const hue = colorCycle ? (hueOffset + (i / barCount) * 360) % 360 : 180;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  useEffect(() => {
    if (generatorRef.current) {
      generatorRef.current.setVolume(volume[0] / 100);
    }
  }, [volume]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh]">
        <DialogHeader>
          <DialogTitle>Audio Visualizer & Generator</DialogTitle>
        </DialogHeader>

        {!binaryData || binaryData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No binary data available. Please load or generate data first.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <canvas ref={canvasRef} className="w-full h-80 bg-black rounded border border-border" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Audio Generation Mode</Label>
              <Select value={audioMode} onValueChange={(v) => setAudioMode(v as AudioMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcm">Direct PCM (Raw)</SelectItem>
                  <SelectItem value="rhythm">Binary Rhythm (Beats)</SelectItem>
                  <SelectItem value="frequency">Frequency Mapping</SelectItem>
                  <SelectItem value="melody">Partition Melody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Visualizer Style</Label>
              <Select value={visualStyle} onValueChange={(v) => setVisualStyle(v as VisualizerStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waveform">Waveform (Oscilloscope)</SelectItem>
                  <SelectItem value="bars">Frequency Bars</SelectItem>
                  <SelectItem value="circle">Radial Spectrum</SelectItem>
                  <SelectItem value="particles">Particle System</SelectItem>
                  <SelectItem value="spiral">Spiral Galaxy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Switch id="mirror" checked={showMirror} onCheckedChange={setShowMirror} />
                <Label htmlFor="mirror" className="text-xs">Mirror Effect</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="color-cycle" checked={colorCycle} onCheckedChange={setColorCycle} />
                <Label htmlFor="color-cycle" className="text-xs">Color Cycling</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Volume: {volume[0]}%
              </Label>
              <Slider value={volume} onValueChange={setVolume} min={0} max={100} step={1} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Playback Speed: {(playbackRate[0] / 100).toFixed(2)}x
              </Label>
              <Slider value={playbackRate} onValueChange={setPlaybackRate} min={25} max={400} step={25} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Visual Sensitivity: {sensitivity[0]}%
              </Label>
              <Slider value={sensitivity} onValueChange={setSensitivity} min={10} max={300} step={10} />
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <Button onClick={handlePlay} disabled={isPlaying} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
            <Button onClick={handlePause} disabled={!isPlaying} variant="outline" size="lg">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button onClick={handleStop} variant="outline" size="lg">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
