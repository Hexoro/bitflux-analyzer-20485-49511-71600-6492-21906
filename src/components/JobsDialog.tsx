import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface JobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobsDialog = ({ open, onOpenChange }: JobsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Jobs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Active Jobs</p>
                <p className="text-sm">Job queue is empty</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 text-cyan-500" />
                  <span>Running</span>
                </div>
                <p className="text-2xl font-bold mt-1">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Completed</span>
                </div>
                <p className="text-2xl font-bold mt-1">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Failed</span>
                </div>
                <p className="text-2xl font-bold mt-1">0</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
