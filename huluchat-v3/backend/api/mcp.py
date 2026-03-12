"""MCP API endpoints."""
from typing import List
from fastapi import APIRouter, HTTPException

from services.mcp_service import mcp_service
from models.mcp_server import (
    MCPServerConfig,
    MCPServerConfigCreate,
    MCPServerConfigUpdate,
    MCPServerStatus,
    MCPTool,
    MCPToolCall,
    MCPToolResult,
    MCPAllStatus,
)

router = APIRouter(prefix="/mcp", tags=["mcp"])


# ============== Server Management ==============

@router.get("/servers", response_model=List[MCPServerConfig])
async def list_servers():
    """List all configured MCP servers."""
    return await mcp_service.list_servers()


@router.post("/servers", response_model=MCPServerConfig)
async def add_server(config: MCPServerConfigCreate):
    """Add a new MCP server configuration."""
    return await mcp_service.add_server(config)


@router.put("/servers/{server_id}", response_model=MCPServerConfig)
async def update_server(server_id: str, config: MCPServerConfigUpdate):
    """Update MCP server configuration."""
    result = await mcp_service.update_server(server_id, config)
    if result is None:
        raise HTTPException(status_code=404, detail="Server not found")
    return result


@router.delete("/servers/{server_id}")
async def delete_server(server_id: str):
    """Delete MCP server configuration."""
    success = await mcp_service.delete_server(server_id)
    if not success:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"status": "deleted", "server_id": server_id}


# ============== Connection Management ==============

@router.post("/servers/{server_id}/connect", response_model=MCPServerStatus)
async def connect_server(server_id: str):
    """Connect to MCP server."""
    return await mcp_service.connect(server_id)


@router.post("/servers/{server_id}/disconnect")
async def disconnect_server(server_id: str):
    """Disconnect from MCP server."""
    await mcp_service.disconnect(server_id)
    return {"status": "disconnected", "server_id": server_id}


@router.get("/servers/{server_id}/status", response_model=MCPServerStatus)
async def get_server_status(server_id: str):
    """Get server connection status."""
    return await mcp_service.get_status(server_id)


# ============== Tools ==============

@router.get("/servers/{server_id}/tools", response_model=List[MCPTool])
async def list_tools(server_id: str):
    """List tools available on a server."""
    return await mcp_service.list_tools(server_id)


@router.post("/tools/call", response_model=MCPToolResult)
async def call_tool(call: MCPToolCall):
    """Call an MCP tool."""
    return await mcp_service.call_tool(
        call.server_id,
        call.tool_name,
        call.arguments
    )


# ============== Batch Operations ==============

@router.get("/status", response_model=MCPAllStatus)
async def get_all_status():
    """Get status of all servers."""
    return await mcp_service.get_all_status()


@router.post("/connect-all", response_model=List[MCPServerStatus])
async def connect_all():
    """Connect to all enabled servers with auto_connect."""
    return await mcp_service.connect_all()


@router.post("/disconnect-all")
async def disconnect_all():
    """Disconnect from all servers."""
    await mcp_service.disconnect_all()
    return {"status": "all_disconnected"}


# ============== All Tools ==============

@router.get("/tools")
async def get_all_tools():
    """Get all tools from all connected servers."""
    return await mcp_service.get_all_tools()
