"""WebSocket 测试脚本"""
import asyncio
import websockets
import json

async def test_websocket():
    session_id = "c7a4fb41-95a2-4752-b507-d46a66d8cec2"
    uri = f"ws://127.0.0.1:8765/api/chat/ws/{session_id}"

    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as ws:
            print("Connected!")

            # 发送测试消息
            test_msg = {"type": "message", "content": "Hello from WebSocket test!"}
            print(f"Sending: {test_msg}")
            await ws.send(json.dumps(test_msg))

            # 接收响应
            response_count = 0
            while True:
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=10)
                    data = json.loads(response)
                    response_count += 1
                    print(f"Received #{response_count}: {data.get('type')} - {data.get('content', '')[:50] if data.get('content') else ''}")

                    if data.get('type') == 'stream_end':
                        print("\n✅ WebSocket streaming test PASSED!")
                        break
                except asyncio.TimeoutError:
                    print("Timeout waiting for response")
                    break

    except Exception as e:
        print(f"Error: {e}")
        return False

    return True

if __name__ == "__main__":
    result = asyncio.run(test_websocket())
    exit(0 if result else 1)
