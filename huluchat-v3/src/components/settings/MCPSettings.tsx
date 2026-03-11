/**
 * MCP Settings Component
 * Manage MCP server connections and tools
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  RefreshCw,
  Power,
  PowerOff,
  ChevronDown,
  ChevronRight,
  Terminal,
  Globe,
  Loader2,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listMCPServers,
  addMCPServer,
  deleteMCPServer,
  connectMCPServer,
  disconnectMCPServer,
  getMCPAllStatus,
  connectAllMCPServers,
  type MCPServerConfig,
  type MCPServerConfigCreate,
  type MCPServerStatus,
  type MCPTransportType,
} from "@/api/client";

interface MCPServerCardProps {
  config: MCPServerConfig;
  status?: MCPServerStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

function MCPServerCard({
  config,
  status,
  onConnect,
  onDisconnect,
  onDelete,
  isConnecting,
  isDisconnecting,
}: MCPServerCardProps) {
  const { t } = useTranslation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const connected = status?.connected ?? false;
  const tools = status?.tools ?? [];
  const error = status?.error;

  const getTransportIcon = (transport: MCPTransportType) => {
    switch (transport) {
      case "stdio":
        return <Terminal className="h-4 w-4" />;
      case "http":
      case "sse":
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        connected
          ? "bg-success-muted/30 border-success/30"
          : "bg-muted/50 border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              connected
                ? "bg-success/20 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {getTransportIcon(config.transport)}
          </div>
          <div>
            <h4 className="text-sm font-medium">{config.name}</h4>
            <p className="text-xs text-muted-foreground">
              {config.description || config.transport}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              connected
                ? "bg-success/20 text-success"
                : error
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {connected
              ? t("mcp.connected")
              : error
                ? t("mcp.error")
                : t("mcp.disconnected")}
          </span>

          {/* Connect/Disconnect button */}
          {connected ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              aria-label={t("mcp.disconnect")}
              className="h-8 w-8"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onConnect}
              disabled={isConnecting}
              aria-label={t("mcp.connect")}
              className="h-8 w-8"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={t("common.delete")}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}

      {/* Tools list */}
      {connected && tools.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {toolsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Wrench className="h-3 w-3" />
            {t("mcp.toolsCount", { count: tools.length })}
          </button>
          {toolsOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tools.map((tool) => (
                <span
                  key={tool.name}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-background border text-xs"
                  title={tool.description}
                >
                  {tool.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (config: MCPServerConfigCreate) => Promise<void>;
}

function AddServerDialog({ open, onOpenChange, onAdd }: AddServerDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [transport, setTransport] = useState<MCPTransportType>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error(t("mcp.nameRequired"));
      return;
    }

    if (transport === "stdio" && !command.trim()) {
      toast.error(t("mcp.commandRequired"));
      return;
    }

    if ((transport === "http" || transport === "sse") && !url.trim()) {
      toast.error(t("mcp.urlRequired"));
      return;
    }

    setAdding(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim() || undefined,
        transport,
        command: transport === "stdio" ? command.trim() : undefined,
        args: args.trim() ? args.trim().split(/\s+/) : undefined,
        url: transport !== "stdio" ? url.trim() : undefined,
        enabled: true,
        auto_connect: true,
      });

      // Reset form
      setName("");
      setDescription("");
      setTransport("stdio");
      setCommand("");
      setArgs("");
      setUrl("");
      onOpenChange(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("mcp.addServer")}</DialogTitle>
          <DialogDescription>{t("mcp.addServerDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">{t("mcp.serverName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("mcp.serverNamePlaceholder")}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">{t("mcp.description")}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("mcp.descriptionPlaceholder")}
            />
          </div>

          {/* Transport */}
          <div className="grid gap-2">
            <Label htmlFor="transport">{t("mcp.transport")}</Label>
            <Select
              value={transport}
              onValueChange={(v) => setTransport(v as MCPTransportType)}
            >
              <SelectTrigger id="transport">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stdio">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    stdio
                  </div>
                </SelectItem>
                <SelectItem value="http">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTTP
                  </div>
                </SelectItem>
                <SelectItem value="sse">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SSE
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* stdio fields */}
          {transport === "stdio" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="command">{t("mcp.command")}</Label>
                <Input
                  id="command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="uvx"
                />
                <p className="text-xs text-muted-foreground">
                  {t("mcp.commandHint")}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="args">{t("mcp.arguments")}</Label>
                <Input
                  id="args"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="mcp-server-filesystem --root /path"
                />
                <p className="text-xs text-muted-foreground">
                  {t("mcp.argumentsHint")}
                </p>
              </div>
            </>
          )}

          {/* HTTP/SSE fields */}
          {(transport === "http" || transport === "sse") && (
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8080/mcp"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={adding}>
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MCPSettings() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MCPServerStatus>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [connectingServers, setConnectingServers] = useState<Set<string>>(new Set());
  const [disconnectingServers, setDisconnectingServers] = useState<Set<string>>(new Set());

  const loadServers = useCallback(async () => {
    try {
      const [serverList, statusData] = await Promise.all([
        listMCPServers(),
        getMCPAllStatus(),
      ]);
      setServers(serverList);

      // Convert status array to record
      const statusRecord: Record<string, MCPServerStatus> = {};
      for (const status of statusData.servers) {
        statusRecord[status.id] = status;
      }
      setStatuses(statusRecord);
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
      toast.error(t("mcp.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleAdd = async (config: MCPServerConfigCreate) => {
    try {
      const newServer = await addMCPServer(config);
      setServers((prev) => [...prev, newServer]);
      toast.success(t("mcp.serverAdded"));

      // Auto-connect if enabled
      if (config.auto_connect) {
        handleConnect(newServer.id);
      }
    } catch (error) {
      console.error("Failed to add server:", error);
      toast.error(t("mcp.addFailed"));
    }
  };

  const handleConnect = async (serverId: string) => {
    setConnectingServers((prev) => new Set(prev).add(serverId));
    try {
      const status = await connectMCPServer(serverId);
      setStatuses((prev) => ({ ...prev, [serverId]: status }));
      if (status.connected) {
        toast.success(t("mcp.connectedSuccess", { name: status.name }));
      } else if (status.error) {
        toast.error(t("mcp.connectFailed", { error: status.error }));
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      toast.error(t("mcp.connectFailed", { error: String(error) }));
    } finally {
      setConnectingServers((prev) => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
    }
  };

  const handleDisconnect = async (serverId: string) => {
    setDisconnectingServers((prev) => new Set(prev).add(serverId));
    try {
      await disconnectMCPServer(serverId);
      setStatuses((prev) => {
        const next = { ...prev };
        if (next[serverId]) {
          next[serverId] = { ...next[serverId], connected: false, tools: [], resources: [] };
        }
        return next;
      });
      toast.success(t("mcp.disconnectedSuccess"));
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error(t("mcp.disconnectFailed"));
    } finally {
      setDisconnectingServers((prev) => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
    }
  };

  const handleDelete = async (serverId: string) => {
    try {
      await deleteMCPServer(serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      setStatuses((prev) => {
        const next = { ...prev };
        delete next[serverId];
        return next;
      });
      toast.success(t("mcp.serverDeleted"));
    } catch (error) {
      console.error("Failed to delete server:", error);
      toast.error(t("mcp.deleteFailed"));
    }
  };

  const handleConnectAll = async () => {
    try {
      const results = await connectAllMCPServers();
      // Refresh statuses
      await loadServers();

      const connected = results.filter((r) => r.connected).length;
      toast.success(t("mcp.connectAllSuccess", { count: connected }));
    } catch (error) {
      console.error("Failed to connect all:", error);
      toast.error(t("mcp.connectAllFailed"));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadServers();
    toast.success(t("mcp.statusRefreshed"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("mcp.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("mcp.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            aria-label={t("mcp.refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectAll}
            aria-label={t("mcp.connectAll")}
          >
            <Power className="h-4 w-4 mr-1" />
            {t("mcp.connectAll")}
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("mcp.addServer")}
          </Button>
        </div>
      </div>

      {/* MCP Info */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          {t("mcp.infoText")}{" "}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {t("mcp.learnMore")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Server List */}
      <div className="space-y-2">
        {servers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{t("mcp.noServers")}</p>
            <p className="text-xs mt-1">{t("mcp.noServersHint")}</p>
          </div>
        ) : (
          servers.map((server) => (
            <MCPServerCard
              key={server.id}
              config={server}
              status={statuses[server.id]}
              onConnect={() => handleConnect(server.id)}
              onDisconnect={() => handleDisconnect(server.id)}
              onDelete={() => handleDelete(server.id)}
              isConnecting={connectingServers.has(server.id)}
              isDisconnecting={disconnectingServers.has(server.id)}
            />
          ))
        )}
      </div>

      {/* Add Server Dialog */}
      <AddServerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
    </div>
  );
}
