/**
 * Settings Dialog Component
 * API Key configuration, model selection, Ollama settings, and plugin management
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Check,
  AlertCircle,
  Loader2,
  Server,
  ExternalLink,
  Sliders,
  Puzzle,
} from "lucide-react";
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
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PluginSettings } from "./PluginSettings";

interface SettingsDialogProps {
  onSettingsChange?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ onSettingsChange, open: externalOpen, onOpenChange }: SettingsDialogProps) {
  const { t } = useTranslation();
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
  const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);

  // Model parameters state
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [maxTokensError, setMaxTokensError] = useState<string | null>(null);

  // Models
  const [models, setModels] = useState<ModelInfo[]>([]);

  // Ollama state
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [ollamaVersion, setOllamaVersion] = useState<string>("");
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [refreshingOllama, setRefreshingOllama] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (open) {
      loadSettings();
      loadModels();
      loadOllamaStatus();
    }
  }, [open]);

  // Validate URL format
  const validateBaseUrl = (url: string): string | null => {
    if (!url.trim()) return null; // Empty is valid (will use default)

    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        return t("settings.invalidUrlProtocol");
      }
      return null;
    } catch {
      return t("settings.invalidUrl");
    }
  };

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    setBaseUrlError(validateBaseUrl(value));
  };

  // Validate Max Tokens range (256 - 128000)
  const validateMaxTokens = (value: number): string | null => {
    if (isNaN(value)) return t("settings.fieldInvalid");
    if (value < 256) return t("settings.maxTokensMinError");
    if (value > 128000) return t("settings.maxTokensMaxError");
    return null;
  };

  const handleMaxTokensChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setMaxTokens(numValue || 0);
    setMaxTokensError(validateMaxTokens(numValue));
  };

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
      // Load model parameters
      setTemperature(settings.temperature ?? 0.7);
      setTopP(settings.top_p ?? 1.0);
      setMaxTokens(settings.max_tokens ?? 4096);
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
      const updateData: Record<string, string | number> = {};

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

      // Model parameters
      updateData.temperature = temperature;
      updateData.top_p = topP;
      updateData.max_tokens = maxTokens;

      await updateSettings(updateData);
      setHasApiKey(true);
      setApiKey(""); // Clear the input after save
      toast.success(t("settings.settingsSaved"));
      onSettingsChange?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settings.settingsSaveFailed"));
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
      toast.success(t("settings.connectionSuccessful"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.connectionFailed");
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
        toast.success(t("ollama.connectionSuccessful"));
        // 刷新状态
        await loadOllamaStatus();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.connectionFailed");
      setOllamaTestResult({ success: false, message });
      toast.error(t("ollama.connectionFailed"));
    } finally {
      setTestingOllama(false);
    }
  };

  const handleRefreshOllama = async () => {
    setRefreshingOllama(true);
    try {
      await loadOllamaStatus();
      toast.success(t("ollama.statusRefreshed"));
    } finally {
      setRefreshingOllama(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("settings.title")} className="group/settings">
          <Settings className="h-5 w-5 transition-transform duration-300 ease-out group-hover/settings:rotate-45" aria-hidden="true" />
          <span className="sr-only">{t("settings.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>
            {t("settings.description")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        ) : (
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api">{t("settings.tabApi")}</TabsTrigger>
              <TabsTrigger value="ollama">{t("settings.tabOllama")}</TabsTrigger>
              <TabsTrigger value="plugins">
                <Puzzle className="h-4 w-4 mr-1" />
                {t("settings.tabPlugins")}
              </TabsTrigger>
            </TabsList>

            {/* API Settings Tab */}
            <TabsContent value="api" className="space-y-4 py-4">
              {/* API Key */}
              <div className="grid gap-2">
                <Label htmlFor="apiKey">{t("settings.apiKey")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={hasApiKey ? "••••••••••••••••" : t("settings.apiKeyPlaceholder")}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {hasApiKey && !apiKey && (
                  <p className="text-xs text-muted-foreground">
                    {t("settings.apiKeySet")}
                  </p>
                )}
              </div>

              {/* Base URL */}
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">{t("settings.baseUrl")}</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder={t("settings.baseUrlPlaceholder")}
                  value={baseUrl}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  aria-invalid={!!baseUrlError}
                  aria-errormessage={baseUrlError ? "baseUrl-error" : undefined}
                  aria-describedby={baseUrlError ? "baseUrl-error" : "baseUrl-hint"}
                />
                {baseUrlError ? (
                  <p id="baseUrl-error" className="text-xs text-destructive" role="alert">
                    {baseUrlError}
                  </p>
                ) : (
                  <p id="baseUrl-hint" className="text-xs text-muted-foreground">
                    {t("settings.baseUrlHint")}
                  </p>
                )}
              </div>

              {/* Model Selection */}
              <div className="grid gap-2">
                <Label htmlFor="model">{t("settings.model")}</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger
                    id="model"
                    aria-describedby={model ? "model-description" : undefined}
                  >
                    <SelectValue placeholder={t("settings.selectModel")} />
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
                  <p id="model-description" className="text-xs text-muted-foreground">
                    {models.find((m) => m.id === model)?.description}
                  </p>
                )}
              </div>

              {/* Model Parameters */}
              <div className="border-t pt-4 mt-2">
                <Label className="flex items-center gap-2 mb-3">
                  <Sliders className="h-4 w-4" />
                  {t("settings.modelParameters")}
                </Label>

                {/* Temperature */}
                <div className="grid gap-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature" className="text-sm">{t("settings.temperature")}</Label>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">{temperature.toFixed(2)}</span>
                  </div>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer"
                    aria-describedby="temperature-hint"
                    aria-valuetext={t("settings.temperatureValue", { value: temperature.toFixed(2) })}
                  />
                  <p id="temperature-hint" className="text-xs text-muted-foreground">
                    {t("settings.temperatureHint")}
                  </p>
                </div>

                {/* Top P */}
                <div className="grid gap-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="topP" className="text-sm">{t("settings.topP")}</Label>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">{topP.toFixed(2)}</span>
                  </div>
                  <Input
                    id="topP"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="h-2 w-full cursor-pointer"
                    aria-describedby="topp-hint"
                    aria-valuetext={t("settings.topPValue", { value: topP.toFixed(2) })}
                  />
                  <p id="topp-hint" className="text-xs text-muted-foreground">
                    {t("settings.topPHint")}
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="grid gap-2">
                  <Label htmlFor="maxTokens" className="text-sm">{t("settings.maxTokens")}</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="256"
                    max="128000"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => handleMaxTokensChange(e.target.value)}
                    aria-invalid={!!maxTokensError}
                    aria-errormessage={maxTokensError ? "maxTokens-error" : undefined}
                    aria-describedby={maxTokensError ? "maxTokens-error" : "maxtokens-hint"}
                  />
                  {maxTokensError ? (
                    <p id="maxTokens-error" className="text-xs text-destructive" role="alert">
                      {maxTokensError}
                    </p>
                  ) : (
                    <p id="maxtokens-hint" className="text-xs text-muted-foreground">
                      {t("settings.maxTokensHint")}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`flex items-center gap-2 p-3 rounded-md animate-slide-up ${
                    testResult.success
                      ? "bg-success-muted text-success-foreground"
                      : "bg-error-muted text-error-foreground"
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 animate-bounce-in" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 animate-shake-subtle" aria-hidden="true" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </TabsContent>

            {/* Ollama Settings Tab */}
            <TabsContent value="ollama" className="space-y-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {t("ollama.title")}
                </Label>
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {t("ollama.download")}
                  <ExternalLink className="h-3 w-3 transition-transform duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </div>

              {/* Ollama Status Card */}
              <div
                role="status"
                aria-live="polite"
                aria-label={ollamaAvailable ? t("ollama.online") : t("ollama.offline")}
                className={`flex items-center justify-between p-3 rounded-lg border mb-3 transition-all duration-200 ${
                  ollamaAvailable
                    ? "bg-success-muted/50 border-success/30 dark:bg-success-muted/20 dark:border-success/25 dark:shadow-sm dark:shadow-success/10"
                    : "bg-muted dark:bg-muted/50 dark:border-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
                      ollamaAvailable
                        ? "bg-success/20 text-success dark:bg-success/25 dark:text-success"
                        : "bg-muted text-muted-foreground dark:bg-muted/60"
                    }`}
                    aria-hidden="true"
                  >
                    <Server className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {ollamaAvailable ? t("ollama.online") : t("ollama.offline")}
                    </span>
                    {ollamaAvailable && (
                      <span className="text-xs text-muted-foreground">
                        {t("ollama.models", { count: ollamaModels.length })}
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
                  aria-label={t("ollama.refreshStatus")}
                  aria-busy={refreshingOllama}
                  className="group/refresh h-8 w-8"
                >
                  <Loader2
                    className={`h-4 w-4 transition-transform duration-300 ease-out ${refreshingOllama ? "animate-spin" : "group-hover/refresh:rotate-180"}`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t("ollama.refreshStatus")}</span>
                </Button>
              </div>

              {/* Ollama Models List */}
              {ollamaAvailable && ollamaModels.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">{t("ollama.installedModels")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ollamaModels.map((m, index) => (
                      <span
                        key={m.name}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-muted dark:bg-muted/60 dark:border dark:border-white/10 text-xs animate-list-enter"
                        style={{ animationDelay: `${index * 50}ms` }}
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
                  role="status"
                  aria-live="polite"
                  className={`flex items-center gap-2 p-3 rounded-md mb-3 ${
                    ollamaTestResult.success
                      ? "bg-success-muted text-success-foreground"
                      : "bg-error-muted text-error-foreground"
                  }`}
                >
                  {ollamaTestResult.success ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
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
                aria-busy={testingOllama}
                className="w-full"
              >
                {testingOllama ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                ) : null}
                {t("ollama.testConnection")}
              </Button>
            </TabsContent>

            {/* Plugins Tab */}
            <TabsContent value="plugins" className="py-4">
              <PluginSettings />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing || !hasApiKey} aria-busy={testing}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : null}
            {t("common.test")}
          </Button>
          <Button onClick={handleSave} disabled={saving} aria-busy={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : null}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
