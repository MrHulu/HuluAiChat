#!/usr/bin/env python3
"""
GLM-5 API 真实集成测试
测试智谱 AI GLM-5 模型的 API 连接和流式输出
"""

import os
import sys
import asyncio
import httpx
import json
from pathlib import Path

# 加载 .env.test 文件
env_path = Path(__file__).parent.parent / ".env.test"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

# 配置
API_KEY = os.getenv("DEEPSEEK_API_KEY", "3dd751ddf5044ef1bdb7516b9a515803.t9ED8Z9mbfPdrwlc")
POSSIBLE_BASE_URLS = [
    "https://open.bigmodel.cn/api/paas/v4",
    "https://open.bigmodel.cn/api/coding/paas/v4",
]
MODEL = "glm-5"
WORKING_BASE_URL = None


async def test_connection():
    """测试 API 连接"""
    global WORKING_BASE_URL
    print(f"\n📡 测试 GLM-5 API 连接...")
    print(f"   Model: {MODEL}")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": "你好"}],
        "stream": False,
    }

    for base_url in POSSIBLE_BASE_URLS:
        url = f"{base_url}/chat/completions"
        print(f"   尝试: {base_url}")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                if "choices" in data:
                    print(f"   ✅ 成功! URL: {base_url}")
                    WORKING_BASE_URL = base_url
                    return True
        except Exception as e:
            print(f"   ❌ 失败: {str(e)[:50]}")
    return False


async def test_streaming():
    """测试流式输出"""
    if not WORKING_BASE_URL:
        print("\n⏭️ 跳过流式测试（无有效连接）")
        return False

    print(f"\n📡 测试流式输出...")
    url = f"{WORKING_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": "用一句话介绍北京"}],
        "stream": True,
    }

    content = ""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: ") and line[6:] != "[DONE]":
                        try:
                            data = json.loads(line[6:])
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content += delta.get("content", "")
                        except:
                            pass
        print(f"   ✅ 流式输出成功，内容长度: {len(content)}")
        return True
    except Exception as e:
        print(f"   ❌ 流式输出失败: {e}")
        return False


async def test_error_handling():
    """测试错误处理"""
    print(f"\n📡 测试错误处理...")
    url = f"{POSSIBLE_BASE_URLS[0]}/chat/completions"
    headers = {
        "Authorization": "Bearer invalid_key",
        "Content-Type": "application/json",
    }
    payload = {"model": MODEL, "messages": [{"role": "user", "content": "test"}]}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code in [401, 403]:
                print(f"   ✅ 错误处理正确 ({response.status_code})")
                return True
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
    return False


async def main():
    print("=" * 60)
    print("GLM-5 API 真实集成测试")
    print("=" * 60)

    results = {
        "connection": await test_connection(),
        "streaming": await test_streaming(),
        "error_handling": await test_error_handling(),
    }

    print("\n" + "=" * 60)
    print("测试结果")
    print("=" * 60)
    for name, passed in results.items():
        print(f"   {name}: {'✅' if passed else '❌'}")

    all_passed = all(results.values())
    print("=" * 60)
    print("🎉 所有测试通过!" if all_passed else "⚠️ 部分测试失败")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
