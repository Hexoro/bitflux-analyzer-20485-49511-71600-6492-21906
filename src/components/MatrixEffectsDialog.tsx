import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { X } from 'lucide-react';

interface MatrixEffectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryData: string;
}

type EffectMode = 'matrix' | 'cascade' | 'glitch' | 'waves';
type ColorScheme = 'green' | 'cyan' | 'red' | 'rainbow';

export const MatrixEffectsDialog = ({ open, onOpenChange, binaryData }: MatrixEffectsDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mode, setMode] = useState<EffectMode>('matrix');
  const [speed, setSpeed] = useState([50]);
  const [density, setDensity] = useState([50]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('cyan');

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0);
    const glitchOffsets: number[] = Array(columns).fill(0);

    const getColor = (alpha: number = 1): string => {
      switch (colorScheme) {
        case 'green': return `rgba(0, 255, 70, ${alpha})`;
        case 'cyan': return `rgba(0, 255, 255, ${alpha})`;
        case 'red': return `rgba(255, 0, 70, ${alpha})`;
        case 'rainbow': {
          const hue = (Date.now() / 20) % 360;
          return `hsla(${hue}, 100%, 50%, ${alpha})`;
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      const speedFactor = speed[0] / 50;
      const densityFactor = density[0] / 50;

      for (let i = 0; i < columns; i++) {
        if (Math.random() > densityFactor) continue;

        let char: string;
        switch (mode) {
          case 'cascade':
            char = binaryData[Math.floor(Math.random() * binaryData.length)] || '0';
            break;
          case 'glitch':
            char = Math.random() > 0.5 ? '█' : (Math.random() > 0.5 ? '▓' : '░');
            glitchOffsets[i] = Math.random() * 10 - 5;
            break;
          case 'waves':
            const wave = Math.sin(i * 0.1 + Date.now() * 0.001);
            char = wave > 0 ? '1' : '0';
            break;
          default:
            char = Math.random() > 0.5 ? '1' : '0';
        }

        const x = i * fontSize + (mode === 'glitch' ? glitchOffsets[i] : 0);
        const y = drops[i] * fontSize;

        ctx.fillStyle = getColor(1);
        ctx.shadowBlur = 10;
        ctx.shadowColor = getColor(0.8);
        ctx.fillText(char, x, y);

        // Dim trail
        ctx.fillStyle = getColor(0.3);
        ctx.shadowBlur = 0;
        ctx.fillText(char, x, y - fontSize);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speedFactor;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open, binaryData, mode, speed, density, colorScheme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-screen p-0 border-0 bg-black">
        <canvas ref={canvasRef} className="absolute inset-0" />
        
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-black/80 p-4 rounded-lg border border-border backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="self-end"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="space-y-4 min-w-[200px]">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Effect Mode</label>
              <Select value={mode} onValueChange={(v) => setMode(v as EffectMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matrix">Matrix Rain</SelectItem>
                  <SelectItem value="cascade">Binary Cascade</SelectItem>
                  <SelectItem value="glitch">Glitch Mode</SelectItem>
                  <SelectItem value="waves">Partition Waves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Color Scheme</label>
              <Select value={colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Classic Green</SelectItem>
                  <SelectItem value="cyan">Cyan Theme</SelectItem>
                  <SelectItem value="red">Red Alert</SelectItem>
                  <SelectItem value="rainbow">Rainbow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Speed: {speed[0]}%</label>
              <Slider value={speed} onValueChange={setSpeed} min={10} max={200} step={10} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Density: {density[0]}%</label>
              <Slider value={density} onValueChange={setDensity} min={10} max={100} step={10} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-black/80 px-3 py-2 rounded backdrop-blur">
          Press ESC or click X to close
        </div>
      </DialogContent>
    </Dialog>
  );
};
