/**
 * Settings Dialog Component
 * API Key configuration, model selection, Ollama settings, and other settings
 */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Check, AlertCircle, Loader2, Server, ExternalLink } from "lucide-react";
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
import {
  getSettings,
  updateSettings,
  getModels,
  testConnection,
  getOllamaStatus,
  getOllamaModels,
  testOllamaConnection,
  type ModelInfo,
  type OllamaModel,
} from "@/api/client";

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

  // Ollama state
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [ollamaVersion, setOllamaVersion] = useState<string>("");
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load settings on open
  useEffect(() => {
    if (open) {
      loadSettings();
      loadModels();
      loadOllamaStatus();
    }
  }, [open]);

  const loadOllamaStatus = async () => {
    try {
      const [status, models] = await Promise.all([
        getOllamaStatus(),
        getOllamaModels(),
      ]);
      setOllamaAvailable(status.available);
      setOllamaBaseUrl(status.base_url);
      setOllamaVersion(status.version || "");
      setOllamaModels(models);
      setOllamaTestResult(null);
    } catch (error) {
      console.error("Failed to load Ollama status:", error);
      setOllamaAvailable(false);
    }
  };

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

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setOllamaTestResult(null);
    try {
      const result = await testOllamaConnection();
      setOllamaTestResult({ success: result.status === "ok", message: result.message });
      if (result.status === "ok") {
        toast.success("Ollama 连接成功");
        // 刷新状态
        await loadOllamaStatus();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "连接失败";
      setOllamaTestResult({ success: false, message });
      toast.error("Ollama 连接失败");
    } finally {
      setTestingOllama(false);
    }
  };

  const handleRefreshOllama = async () => {
    await loadOllamaStatus();
    toast.success("Ollama 状态已刷新");
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

            {/* Ollama Section */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Ollama (本地模型)
                </Label>
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  下载 Ollama
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Ollama Status Card */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg border mb-3 ${
                  ollamaAvailable
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-900/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      ollamaAvailable
                        ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                        : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    <Server className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {ollamaAvailable ? "Ollama 在线" : "Ollama 离线"}
                    </span>
                    {ollamaAvailable && (
                      <span className="text-xs text-muted-foreground">
                        {ollamaModels.length} 个本地模型
                        {ollamaVersion && ` · ${ollamaVersion}`}
                      </span>
                    )}
                    {!ollamaAvailable && (
                      <span className="text-xs text-muted-foreground">{ollamaBaseUrl}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshOllama}
                  className="h-8 w-8"
                >
                  <Loader2
                    className={`h-4 w-4 ${false ? "animate-spin" : ""}`}
                  />
                  <span className="sr-only">刷新状态</span>
                </Button>
              </div>

              {/* Ollama Models List */}
              {ollamaAvailable && ollamaModels.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">已安装的模型:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ollamaModels.map((m) => (
                      <span
                        key={m.name}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ollama Test Result */}
              {ollamaTestResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-md mb-3 ${
                    ollamaTestResult.success
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {ollamaTestResult.success ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{ollamaTestResult.message}</span>
                </div>
              )}

              {/* Ollama Test Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestOllama}
                disabled={testingOllama}
                className="w-full"
              >
                {testingOllama ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                测试 Ollama 连接
              </Button>
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
