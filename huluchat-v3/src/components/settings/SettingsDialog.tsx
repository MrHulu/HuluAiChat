/**
 * Settings Dialog Component
 * API Key configuration, model selection, and other settings
 */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSettings, updateSettings, getModels, testConnection, type ModelInfo } from "@/api/client";

interface SettingsDialogProps {
  onSettingsChange?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ onSettingsChange, open: externalOpen, onOpenChange }: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings state
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);

  // Models
  const [models, setModels] = useState<ModelInfo[]>([]);

  // Load settings on open
  useEffect(() => {
    if (open) {
      loadSettings();
      loadModels();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      setBaseUrl(settings.openai_base_url || "");
      setModel(settings.openai_model);
      setHasApiKey(settings.has_api_key);
      if (settings.has_api_key) {
        setApiKey(""); // Don't show the actual key
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const modelList = await getModels();
      setModels(modelList);
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const updateData: Record<string, string> = {};

      // Only send API key if changed (not empty)
      if (apiKey.trim()) {
        updateData.openai_api_key = apiKey.trim();
      }

      if (baseUrl.trim()) {
        updateData.openai_base_url = baseUrl.trim();
      }

      if (model) {
        updateData.openai_model = model;
      }

      await updateSettings(updateData);
      setHasApiKey(true);
      setApiKey(""); // Clear the input after save
      toast.success("Settings saved successfully");
      onSettingsChange?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult({ success: true, message: result.message });
      toast.success("Connection successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      setTestResult({
        success: false,
        message,
      });
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API settings and preferences.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* API Key */}
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={hasApiKey ? "••••••••••••••••" : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
              </div>
              {hasApiKey && !apiKey && (
                <p className="text-xs text-muted-foreground">
                  API key is set. Enter a new key to update.
                </p>
              )}
            </div>

            {/* Base URL */}
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">Base URL (Optional)</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for default OpenAI API.
              </p>
            </div>

            {/* Model Selection */}
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col">
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {model && (
                <p className="text-xs text-muted-foreground">
                  {models.find((m) => m.id === model)?.description}
                </p>
              )}
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-md ${
                  testResult.success
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {testResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleTest} disabled={testing || !hasApiKey}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Test
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
