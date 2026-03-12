"""MCP Tool Adapter for converting between MCP and OpenAI tool formats."""
import logging
from typing import Dict, List, Optional, Tuple, Any

from models.mcp_server import MCPTool

logger = logging.getLogger(__name__)

# Prefix for MCP tools in OpenAI format
MCP_TOOL_PREFIX = "mcp_"


def mcp_tools_to_openai_format(
    tools: Dict[str, List[MCPTool]]
) -> List[dict]:
    """Convert MCP tools to OpenAI tools format.

    Args:
        tools: Dict mapping server_id to list of MCP tools

    Returns:
        List of tools in OpenAI format
    """
    openai_tools = []
    for server_id, server_tools in tools.items():
        for tool in server_tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": f"{MCP_TOOL_PREFIX}{server_id}_{tool.name}",
                    "description": tool.description or f"MCP tool: {tool.name}",
                    "parameters": tool.input_schema
                }
            })
    return openai_tools


def parse_mcp_tool_call(
    tool_name: str
) -> Optional[Tuple[str, str]]:
    """Parse server_id and tool_name from OpenAI tool call name.

    Args:
        tool_name: The function name from OpenAI tool call

    Returns:
        Tuple of (server_id, mcp_tool_name) or None if not an MCP tool
    """
    if not tool_name.startswith(MCP_TOOL_PREFIX):
        return None

    # Remove prefix: mcp_server_id_tool_name -> server_id_tool_name
    remaining = tool_name[len(MCP_TOOL_PREFIX):]

    # Split into server_id and tool_name (first underscore is separator)
    parts = remaining.split("_", 1)
    if len(parts) != 2:
        logger.warning(f"Invalid MCP tool name format: {tool_name}")
        return None

    server_id, mcp_tool_name = parts
    return server_id, mcp_tool_name


def format_tool_call_message(
    server_name: str,
    tool_name: str,
    status: str,
    result: Optional[str] = None,
    error: Optional[str] = None
) -> Dict[str, Any]:
    """Format a tool call message for WebSocket.

    Args:
        server_name: Display name of the MCP server
        tool_name: Name of the tool being called
        status: "calling", "success", or "error"
        result: Tool execution result (optional)
        error: Error message (optional)

    Returns:
        Dict for WebSocket message
    """
    return {
        "type": "tool_call",
        "server_name": server_name,
        "tool_name": tool_name,
        "status": status,
        "result": result,
        "error": error
    }


def build_tool_result_message(
    tool_call_id: str,
    content: str
) -> Dict[str, Any]:
    """Build a tool result message for OpenAI API.

    Args:
        tool_call_id: The ID from the original tool call
        content: The result content

    Returns:
        Dict in OpenAI tool message format
    """
    return {
        "role": "tool",
        "tool_call_id": tool_call_id,
        "content": content
    }
