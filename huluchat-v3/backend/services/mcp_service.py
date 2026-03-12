"""MCP Service for managing MCP server connections and tool calls."""
import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from models.mcp_server import (
    MCPServerConfig,
    MCPServerConfigCreate,
    MCPServerConfigUpdate,
    MCPServerStatus,
    MCPTool,
    MCPResource,
    MCPToolResult,
    MCPAllStatus,
    TransportType,
)

logger = logging.getLogger(__name__)

# Configuration file path
MCP_CONFIG_FILE = Path(__file__).parent.parent / "mcp_servers.json"


class MCPService:
    """MCP Service for managing MCP server connections."""

    def __init__(self):
        self._configs: Dict[str, MCPServerConfig] = {}
        self._sessions: Dict[str, ClientSession] = {}
        self._exit_stacks: Dict[str, AsyncExitStack] = {}
        self._tools: Dict[str, List[MCPTool]] = {}
        self._resources: Dict[str, List[MCPResource]] = {}
        self._errors: Dict[str, str] = {}
        self._initialized = False

    async def _ensure_initialized(self):
        """Ensure service is initialized."""
        if not self._initialized:
            await self._load_configs()
            self._initialized = True

    async def _load_configs(self):
        """Load server configurations from file."""
        if MCP_CONFIG_FILE.exists():
            try:
                with open(MCP_CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data.get("servers", []):
                        config = MCPServerConfig(**item)
                        self._configs[config.id] = config
                logger.info(f"Loaded {len(self._configs)} MCP server configs")
            except Exception as e:
                logger.error(f"Failed to load MCP configs: {e}")

    async def _save_configs(self):
        """Save server configurations to file."""
        try:
            data = {
                "servers": [config.model_dump() for config in self._configs.values()]
            }
            with open(MCP_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(self._configs)} MCP server configs")
        except Exception as e:
            logger.error(f"Failed to save MCP configs: {e}")

    async def list_servers(self) -> List[MCPServerConfig]:
        """List all configured servers."""
        await self._ensure_initialized()
        return list(self._configs.values())

    async def add_server(self, config_create: MCPServerConfigCreate) -> MCPServerConfig:
        """Add a new server configuration."""
        await self._ensure_initialized()
        config = MCPServerConfig(**config_create.model_dump())
        self._configs[config.id] = config
        await self._save_configs()
        logger.info(f"Added MCP server: {config.name} ({config.id})")
        return config

    async def update_server(
        self, server_id: str, update: MCPServerConfigUpdate
    ) -> Optional[MCPServerConfig]:
        """Update server configuration."""
        await self._ensure_initialized()
        if server_id not in self._configs:
            return None

        config = self._configs[server_id]
        update_data = update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(config, key, value)

        await self._save_configs()
        logger.info(f"Updated MCP server: {config.name} ({server_id})")
        return config

    async def delete_server(self, server_id: str) -> bool:
        """Delete server configuration."""
        await self._ensure_initialized()
        if server_id not in self._configs:
            return False

        # Disconnect first
        if server_id in self._sessions:
            await self.disconnect(server_id)

        del self._configs[server_id]
        await self._save_configs()
        logger.info(f"Deleted MCP server: {server_id}")
        return True

    async def connect(self, server_id: str) -> MCPServerStatus:
        """Connect to a server."""
        await self._ensure_initialized()

        if server_id not in self._configs:
            return MCPServerStatus(
                id=server_id,
                name="Unknown",
                connected=False,
                error="Server not found"
            )

        config = self._configs[server_id]

        # Already connected
        if server_id in self._sessions:
            return await self.get_status(server_id)

        try:
            if config.transport == TransportType.STDIO:
                await self._connect_stdio(config)
            elif config.transport in (TransportType.HTTP, TransportType.SSE):
                # HTTP/SSE transport not implemented in MVP
                raise NotImplementedError(
                    f"Transport {config.transport} not yet supported"
                )

            # Clear any previous error
            if server_id in self._errors:
                del self._errors[server_id]

            return await self.get_status(server_id)

        except Exception as e:
            logger.error(f"Failed to connect to {config.name}: {e}")
            self._errors[server_id] = str(e)
            return MCPServerStatus(
                id=server_id,
                name=config.name,
                connected=False,
                error=str(e)
            )

    async def _connect_stdio(self, config: MCPServerConfig):
        """Connect to stdio MCP server."""
        if not config.command:
            raise ValueError("stdio transport requires 'command'")

        server_params = StdioServerParameters(
            command=config.command,
            args=config.args or [],
            env=config.env or None
        )

        exit_stack = AsyncExitStack()
        self._exit_stacks[config.id] = exit_stack

        # Start the server process and create session
        read, write = await exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        session = await exit_stack.enter_async_context(
            ClientSession(read, write)
        )

        # Initialize the session
        await session.initialize()

        self._sessions[config.id] = session

        # Fetch available tools
        tools_response = await session.list_tools()
        self._tools[config.id] = [
            MCPTool(
                name=tool.name,
                description=tool.description or "",
                input_schema=tool.inputSchema or {}
            )
            for tool in tools_response.tools
        ]

        # Fetch available resources
        try:
            resources_response = await session.list_resources()
            self._resources[config.id] = [
                MCPResource(
                    uri=res.uri,
                    name=res.name,
                    description=res.description,
                    mime_type=res.mimeType
                )
                for res in resources_response.resources
            ]
        except Exception:
            # Some servers don't support resources
            self._resources[config.id] = []

        logger.info(
            f"Connected to {config.name}: "
            f"{len(self._tools[config.id])} tools, "
            f"{len(self._resources[config.id])} resources"
        )

    async def disconnect(self, server_id: str) -> bool:
        """Disconnect from a server."""
        if server_id in self._exit_stacks:
            try:
                await self._exit_stacks[server_id].aclose()
            except Exception as e:
                logger.warning(f"Error closing connection to {server_id}: {e}")

        self._sessions.pop(server_id, None)
        self._exit_stacks.pop(server_id, None)
        self._tools.pop(server_id, None)
        self._resources.pop(server_id, None)
        self._errors.pop(server_id, None)

        logger.info(f"Disconnected from server: {server_id}")
        return True

    async def get_status(self, server_id: str) -> MCPServerStatus:
        """Get server status."""
        await self._ensure_initialized()

        if server_id not in self._configs:
            return MCPServerStatus(
                id=server_id,
                name="Unknown",
                connected=False,
                error="Server not found"
            )

        config = self._configs[server_id]
        connected = server_id in self._sessions

        return MCPServerStatus(
            id=server_id,
            name=config.name,
            connected=connected,
            tools=self._tools.get(server_id, []),
            resources=self._resources.get(server_id, []),
            error=self._errors.get(server_id)
        )

    async def get_all_status(self) -> MCPAllStatus:
        """Get status of all servers."""
        await self._ensure_initialized()

        statuses = []
        total_tools = 0
        connected_count = 0

        for server_id in self._configs:
            status = await self.get_status(server_id)
            statuses.append(status)
            if status.connected:
                total_tools += len(status.tools)
                connected_count += 1

        return MCPAllStatus(
            servers=statuses,
            total_tools=total_tools,
            connected_count=connected_count
        )

    async def list_tools(self, server_id: str) -> List[MCPTool]:
        """List tools available on a server."""
        await self._ensure_initialized()
        return self._tools.get(server_id, [])

    async def get_all_tools(self) -> Dict[str, List[MCPTool]]:
        """Get all tools from all connected servers."""
        await self._ensure_initialized()
        return dict(self._tools)

    async def call_tool(
        self, server_id: str, tool_name: str, arguments: Dict[str, Any]
    ) -> MCPToolResult:
        """Call a tool on a server."""
        await self._ensure_initialized()

        if server_id not in self._sessions:
            return MCPToolResult(
                success=False,
                content="",
                error="Server not connected"
            )

        session = self._sessions[server_id]

        try:
            result = await session.call_tool(tool_name, arguments=arguments)

            # Extract content from result
            content_parts = []
            for content in result.content:
                if hasattr(content, 'text') and content.text:
                    content_parts.append(content.text)
                elif hasattr(content, 'data') and content.data:
                    content_parts.append(content.data)

            content = "\n".join(content_parts)

            return MCPToolResult(
                success=not result.isError,
                content=content,
                error=content if result.isError else None
            )

        except Exception as e:
            logger.error(f"Tool call failed: {e}")
            return MCPToolResult(
                success=False,
                content="",
                error=str(e)
            )

    async def connect_all(self) -> List[MCPServerStatus]:
        """Connect to all enabled servers with auto_connect."""
        await self._ensure_initialized()

        results = []
        for config in self._configs.values():
            if config.enabled and config.auto_connect:
                status = await self.connect(config.id)
                results.append(status)

        return results

    async def disconnect_all(self):
        """Disconnect from all servers."""
        for server_id in list(self._sessions.keys()):
            await self.disconnect(server_id)


# Global service instance
mcp_service = MCPService()
