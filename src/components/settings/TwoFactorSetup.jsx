import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, CheckCircle, AlertTriangle, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function TwoFactorSetup({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/2fa/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const enableTwoFactor = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setBackupCodes(data.backupCodes);
        toast.success('2FA setup initiated');
      } else {
        const errBody = await response.text().catch(() => null);
        throw new Error(errBody || 'Failed to enable 2FA');
      }
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        setTwoFactorEnabled(true);
        setSecret("");
        setQrCodeUrl("");
        setVerificationCode("");
        toast.success('2FA enabled successfully');
        onClose();
      } else {
        const errBody = await response.text().catch(() => null);
        throw new Error(errBody || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        setSecret("");
        setQrCodeUrl("");
        setBackupCodes([]);
        toast.success('2FA disabled successfully');
      } else {
        const errBody = await response.text().catch(() => null);
        throw new Error(errBody || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled ? 'Enabled - Your account is secured' : 'Disabled - Enable for additional security'}
                  </p>
                </div>
                <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!twoFactorEnabled && !secret && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enable Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app.
                </p>
                <Button onClick={enableTwoFactor} disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>
          )}

          {secret && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Setup Your Authenticator App
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    1. Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Scan the QR code below or manually enter the secret key
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Enter the 6-digit code from your app to verify
                  </p>
                </div>

                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="QR Code" className="border rounded-lg" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Secret Key (Manual Entry)</Label>
                  <div className="flex gap-2">
                    <Input value={secret} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Verification Code</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <Button onClick={verifyAndEnable} disabled={loading || verificationCode.length !== 6}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Verify & Enable 2FA
                </Button>
              </CardContent>
            </Card>
          )}

          {backupCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Backup Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm bg-muted p-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Codes
                </Button>
              </CardContent>
            </Card>
          )}

          {twoFactorEnabled && !secret && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Manage Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication is currently enabled for your account. You can disable it if needed, but this will reduce your account security.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={disableTwoFactor}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                    Disable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
