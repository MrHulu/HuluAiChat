"""MCP Server models and schemas."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import uuid


class TransportType(str, Enum):
    """MCP Server transport type."""
    STDIO = "stdio"
    HTTP = "http"
    SSE = "sse"


class MCPServerConfig(BaseModel):
    """MCP Server configuration."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: Optional[str] = None
    transport: TransportType
    # stdio transport fields
    command: Optional[str] = None  # e.g., "uvx", "python", "npx"
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    # http/sse transport fields
    url: Optional[str] = None
    # settings
    enabled: bool = True
    auto_connect: bool = True

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "File System",
                    "transport": "stdio",
                    "command": "uvx",
                    "args": ["mcp-server-filesystem", "--root", "/path/to/files"],
                    "enabled": True
                },
                {
                    "name": "Web Search",
                    "transport": "http",
                    "url": "http://localhost:8080/mcp",
                    "enabled": True
                }
            ]
        }
    }


class MCPServerConfigCreate(BaseModel):
    """Schema for creating MCP server config."""
    name: str
    description: Optional[str] = None
    transport: TransportType
    command: Optional[str] = None
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    url: Optional[str] = None
    enabled: bool = True
    auto_connect: bool = True


class MCPServerConfigUpdate(BaseModel):
    """Schema for updating MCP server config."""
    name: Optional[str] = None
    description: Optional[str] = None
    transport: Optional[TransportType] = None
    command: Optional[str] = None
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None
    auto_connect: Optional[bool] = None


class MCPTool(BaseModel):
    """MCP Tool definition."""
    name: str
    description: str
    input_schema: Dict[str, Any] = Field(default_factory=dict, alias="inputSchema")

    model_config = {
        "populate_by_name": True
    }


class MCPResource(BaseModel):
    """MCP Resource definition."""
    uri: str
    name: str
    description: Optional[str] = None
    mime_type: Optional[str] = None


class MCPServerStatus(BaseModel):
    """MCP Server status."""
    id: str
    name: str
    connected: bool
    tools: List[MCPTool] = Field(default_factory=list)
    resources: List[MCPResource] = Field(default_factory=list)
    error: Optional[str] = None


class MCPToolCall(BaseModel):
    """Tool call request."""
    server_id: str
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class MCPToolResult(BaseModel):
    """Tool execution result."""
    success: bool
    content: str
    error: Optional[str] = None


class MCPAllStatus(BaseModel):
    """All servers status response."""
    servers: List[MCPServerStatus]
    total_tools: int
    connected_count: int
