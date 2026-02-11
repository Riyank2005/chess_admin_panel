import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  Gamepad2,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ReportsGenerator({ onClose }) {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const reportTypes = [
    { value: 'user-activity', label: 'User Activity Report', icon: Users },
    { value: 'game-statistics', label: 'Game Statistics Report', icon: Gamepad2 },
    { value: 'revenue-analytics', label: 'Revenue Analytics Report', icon: TrendingUp },
    { value: 'moderation-summary', label: 'Moderation Summary Report', icon: BarChart3 },
    { value: 'comprehensive', label: 'Comprehensive Analytics Report', icon: FileText }
  ];

  const handleGenerateReport = async () => {
    if (!reportType || !dateRange.from || !dateRange.to) {
      toast.error('Please select report type and date range');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const params = new URLSearchParams({
        type: reportType,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        includeCharts: includeCharts.toString(),
        includeRawData: includeRawData.toString()
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/generate-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report: ' + error.message);
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
      }, 1000);
    }
  };

  const handleScheduleReport = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/schedule-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: reportType,
          frequency: 'weekly',
          recipients: ['admin@chessplatform.com']
        })
      });

      if (!response.ok) throw new Error('Failed to schedule report');

      toast.success('Report scheduled successfully');
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule report: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Generate Analytics Report</h2>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <Label className="text-white mb-2 block">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-white mb-2 block">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Report Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={setIncludeCharts}
              />
              <Label htmlFor="include-charts" className="text-white">
                Include charts and visualizations
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-raw-data"
                checked={includeRawData}
                onCheckedChange={setIncludeRawData}
              />
              <Label htmlFor="include-raw-data" className="text-white">
                Include raw data tables
              </Label>
            </div>
          </div>

          {/* Progress Bar */}
          {generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Generating report...</span>
                <span className="text-white">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={generating || !reportType || !dateRange.from || !dateRange.to}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleScheduleReport}
              disabled={!reportType}
            >
              Schedule Weekly
            </Button>
          </div>

          {/* Report Types Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Report Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400 space-y-2">
                <div><strong>User Activity:</strong> User registrations, logins, activity patterns</div>
                <div><strong>Game Statistics:</strong> Game outcomes, popular openings, time controls</div>
                <div><strong>Revenue Analytics:</strong> Subscription data, premium features usage</div>
                <div><strong>Moderation Summary:</strong> Bans, warnings, flagged content</div>
                <div><strong>Comprehensive:</strong> All metrics combined in one report</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
