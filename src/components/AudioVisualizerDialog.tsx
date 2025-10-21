import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { BinaryAudioGenerator } from '@/lib/audioUtils';

interface AudioVisualizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryData: string;
}

type AudioMode = 'pcm' | 'rhythm' | 'frequency' | 'melody';
type VisualizerStyle = 'waveform' | 'bars' | 'circle' | 'particles';

export const AudioVisualizerDialog = ({ open, onOpenChange, binaryData }: AudioVisualizerDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatorRef = useRef<BinaryAudioGenerator | null>(null);
  const animationRef = useRef<number>();
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [playbackRate, setPlaybackRate] = useState([100]);
  const [audioMode, setAudioMode] = useState<AudioMode>('frequency');
  const [visualStyle, setVisualStyle] = useState<VisualizerStyle>('bars');

  useEffect(() => {
    if (open) {
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
    if (!generatorRef.current) return;
    const buffer = generatorRef.current.generateFromBinary(binaryData.slice(0, 50000), audioMode);
    audioBufferRef.current = buffer;
  }, [binaryData, audioMode]);

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

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (visualStyle) {
        case 'waveform':
          drawWaveform(ctx, analyser, canvas.width, canvas.height);
          break;
        case 'bars':
          drawBars(ctx, dataArray, canvas.width, canvas.height);
          break;
        case 'circle':
          drawCircle(ctx, dataArray, canvas.width, canvas.height);
          break;
        case 'particles':
          drawParticles(ctx, dataArray, canvas.width, canvas.height);
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.strokeStyle = 'rgb(0, 255, 255)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgb(0, 255, 255)';

    ctx.beginPath();
    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
    const barWidth = (width / dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      
      const hue = (i / dataArray.length) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const barLength = (dataArray[i] / 255) * radius;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      const hue = (i / dataArray.length) * 360;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
    for (let i = 0; i < dataArray.length; i += 5) {
      const amplitude = dataArray[i] / 255;
      const x = (i / dataArray.length) * width;
      const y = height / 2;
      const size = amplitude * 20;

      const hue = (i / dataArray.length) * 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${amplitude})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

      ctx.beginPath();
      ctx.arc(x, y + (Math.random() - 0.5) * amplitude * 100, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (generatorRef.current) {
      generatorRef.current.setVolume(volume[0] / 100);
    }
  }, [volume]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Audio Visualizer</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          <canvas ref={canvasRef} className="w-full h-64 bg-black rounded border border-border" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Audio Mode</label>
              <Select value={audioMode} onValueChange={(v) => setAudioMode(v as AudioMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcm">Direct PCM</SelectItem>
                  <SelectItem value="rhythm">Binary Rhythm</SelectItem>
                  <SelectItem value="frequency">Frequency Mapping</SelectItem>
                  <SelectItem value="melody">Partition Melody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Visualizer Style</label>
              <Select value={visualStyle} onValueChange={(v) => setVisualStyle(v as VisualizerStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waveform">Waveform</SelectItem>
                  <SelectItem value="bars">Frequency Bars</SelectItem>
                  <SelectItem value="circle">Circle Spectrum</SelectItem>
                  <SelectItem value="particles">Particle System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Volume: {volume[0]}%
              </label>
              <Slider value={volume} onValueChange={setVolume} min={0} max={100} step={1} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Playback Speed: {(playbackRate[0] / 100).toFixed(2)}x
              </label>
              <Slider value={playbackRate} onValueChange={setPlaybackRate} min={25} max={400} step={25} />
            </div>
          </div>

          <div className="flex gap-2 justify-center">
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
      </DialogContent>
    </Dialog>
  );
};
