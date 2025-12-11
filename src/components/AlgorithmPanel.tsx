import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Play, Settings, Cpu } from 'lucide-react';

export const AlgorithmPanel = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Algorithm Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Algorithm mode is ready for custom implementations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Code className="w-4 h-4" />
              Available Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Algorithm visualization</p>
            <p>• Step-by-step execution</p>
            <p>• Custom algorithm editor</p>
            <p>• Performance benchmarks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Play className="w-4 h-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Select an algorithm to begin...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Algorithm settings will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
