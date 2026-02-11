import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/settings/TwoFactorSetup";
import { BackupRestore } from "@/components/settings/BackupRestore";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";
import { ActivityLog } from "@/components/settings/ActivityLog";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Clock, Trophy, Shield, Wrench, Save, Lock } from "lucide-react";
import "../styles/game.css";

export default function Settings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    platformRules: {
      termsUrl: 'https://chessmaster.io/legal/terms',
      communityGuidelines:
        '1. No Cheating or Engine Assistance\n2. Respect other players\n3. No harassment\n4. Fair Play',
      requireAgreement: true,
    },
    timeControls: {
      bullet: true,
      blitz: true,
      rapid: true,
      classical: true,
    },
    ratingSystem: {
      algorithm: 'glicko2',
      initialRating: 1200,
      kFactorProvisional: 40,
      kFactorStandard: 20,
    },
    system: {
      maintenanceMode: false,
      maintenanceMessage: '',
      userRegistration: true,
    },
  });

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/system', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/system', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 game-bg relative">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-gradient-to-b from-indigo-400 to-cyan-300 rounded-full" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure platform, games and system options</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="ghost" size="sm" onClick={() => setShowTwoFactor(true)} className="rounded-lg glow-outline">
              <Shield className="h-4 w-4 mr-2 text-amber-400" />
              2FA
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowActivityLog(true)} className="rounded-lg glow-outline">
              <SettingsIcon className="h-4 w-4 mr-2 text-sky-400" />
              Activity
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowBackupRestore(true)} className="rounded-lg glow-outline">
              <Wrench className="h-4 w-4 mr-2 text-lime-400" />
              Backup
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowApiKeys(true)} className="rounded-lg glow-outline">
              <Lock className="h-4 w-4 mr-2 text-rose-400" />
              API
            </Button>
            <Button onClick={saveSettings} disabled={loading} className="rounded-xl px-5 h-10 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg neon-button">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Platform Rules */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900/60 to-black/40 border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Platform Rules</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Terms & Policies</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider ml-1">Terms of Service URL</Label>
              <Input
                value={settings.platformRules.termsUrl}
                onChange={(e) => updateSetting('platformRules', 'termsUrl', e.target.value)}
                className="h-10 rounded-lg bg-white/[0.03] border-white/5 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider ml-1">Community Guidelines</Label>
              <Textarea
                value={settings.platformRules.communityGuidelines}
                onChange={(e) => updateSetting('platformRules', 'communityGuidelines', e.target.value)}
                className="bg-white/[0.03] border-white/5 rounded-lg min-h-[140px] text-white resize-none p-4 placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Require Agreement</p>
                <p className="text-xs text-muted-foreground">Users must accept terms on signup</p>
              </div>
              <Switch
                checked={settings.platformRules.requireAgreement}
                onCheckedChange={(checked) => updateSetting('platformRules', 'requireAgreement', checked)}
              />
            </div>
          </div>
        </div>

        {/* Time Controls */}
        <div className="rounded-[2rem] p-8 border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Time Controls</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Game Formats</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'bullet', name: 'Bullet (1+0)', desc: 'Fast paced' },
              { key: 'blitz', name: 'Blitz (3+0, 5+0)', desc: 'Standard speed' },
              { key: 'rapid', name: 'Rapid (10+0, 15+10)', desc: 'More time to think' },
              { key: 'classical', name: 'Classical (30+0)', desc: 'Long games' }
            ].map((gr) => (
              <div key={gr.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white/90">{gr.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{gr.desc}</p>
                </div>
                <Switch
                  checked={settings.timeControls?.[gr.key] ?? false}
                  onCheckedChange={(checked) => updateSetting('timeControls', gr.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rating System */}
        <div className="rounded-[2rem] p-8 border border-white/5 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Rating System</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">ELO Configuration</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Algorithm</Label>
                <Select
                  value={settings.ratingSystem.algorithm}
                  onValueChange={(value) => updateSetting('ratingSystem', 'algorithm', value)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white/[0.03] border-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white rounded-xl">
                    <SelectItem value="elo">Legacy ELO</SelectItem>
                    <SelectItem value="glicko2">Glicko-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Initial Rating</Label>
                <Input
                  type="number"
                  value={settings.ratingSystem.initialRating}
                  onChange={(e) => updateSetting('ratingSystem', 'initialRating', parseInt(e.target.value))}
                  className="h-10 rounded-xl bg-white/[0.03] border-white/5 text-white tabular-nums"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">K-Factor (Provisional)</Label>
                <Input
                  type="number"
                  value={settings.ratingSystem.kFactorProvisional}
                  onChange={(e) => updateSetting('ratingSystem', 'kFactorProvisional', parseInt(e.target.value))}
                  className="h-10 rounded-xl bg-white/[0.03] border-white/5 text-white tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">K-Factor (Standard)</Label>
                <Input
                  type="number"
                  value={settings.ratingSystem.kFactorStandard}
                  onChange={(e) => updateSetting('ratingSystem', 'kFactorStandard', parseInt(e.target.value))}
                  className="h-10 rounded-xl bg-white/[0.03] border-white/5 text-white tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-[2rem] p-8 border border-rose-500/20 bg-rose-500/5 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Maintenance</h3>
              <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mt-0.5">Restricted Access</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-100">Maintenance Mode</p>
                <p className="text-xs text-rose-300/60">Disable public access</p>
              </div>
              <Switch
                checked={settings.system.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('system', 'maintenanceMode', checked)}
              />
            </div>

            {settings.system.maintenanceMode && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-bold uppercase text-rose-400/60 tracking-wider ml-1">Maintenance Message</Label>
                <Textarea
                  value={settings.system.maintenanceMessage}
                  onChange={(e) => updateSetting('system', 'maintenanceMessage', e.target.value)}
                  placeholder="System undergoing maintenance..."
                  className="bg-black/20 border-rose-500/20 rounded-xl min-h-[80px] text-rose-100 placeholder:text-rose-500/50 resize-none p-4"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">User Registration</p>
                <p className="text-xs text-muted-foreground">Allow new users to sign up</p>
              </div>
              <Switch
                checked={settings.system.userRegistration}
                onCheckedChange={(checked) => updateSetting('system', 'userRegistration', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      {showTwoFactor && (
        <TwoFactorSetup
          onClose={() => setShowTwoFactor(false)}
        />
      )}

      {showActivityLog && (
        <ActivityLog
          onClose={() => setShowActivityLog(false)}
        />
      )}

      {showBackupRestore && (
        <BackupRestore
          onClose={() => setShowBackupRestore(false)}
        />
      )}

      {showApiKeys && (
        <ApiKeyManager
          onClose={() => setShowApiKeys(false)}
        />
      )}

      {showWebhooks && (
        <WebhookManager
          onClose={() => setShowWebhooks(false)}
        />
      )}
    </div>
  );
}
