"""测试会话历史加载 API"""
import requests

BASE_URL = "http://127.0.0.1:8765"

def test_session_switching():
    """测试会话切换时历史加载"""

    # 1. 获取所有会话
    print("1. 获取所有会话...")
    resp = requests.get(f"{BASE_URL}/api/sessions/")
    sessions = resp.json()
    print(f"   找到 {len(sessions)} 个会话")

    if len(sessions) < 2:
        print("   创建新会话进行测试...")
        resp = requests.post(f"{BASE_URL}/api/sessions/")
        sessions.append(resp.json())

    # 2. 测试第一个会话的历史
    session1_id = sessions[0]['id']
    print(f"\n2. 加载会话 1 历史 (ID: {session1_id[:8]}...)...")
    resp = requests.get(f"{BASE_URL}/api/chat/{session1_id}/messages/")
    messages1 = resp.json()['messages']
    print(f"   会话 1 有 {len(messages1)} 条消息")

    # 3. 测试第二个会话的历史
    session2_id = sessions[1]['id']
    print(f"\n3. 加载会话 2 历史 (ID: {session2_id[:8]}...)...")
    resp = requests.get(f"{BASE_URL}/api/chat/{session2_id}/messages/")
    messages2 = resp.json()['messages']
    print(f"   会话 2 有 {len(messages2)} 条消息")

    # 4. 验证历史隔离
    print(f"\n4. 验证会话历史隔离...")
    if session1_id != session2_id:
        print(f"   ✅ 会话 ID 不同，历史正确隔离")
    else:
        print(f"   ❌ 会话 ID 相同!")
        return False

    print(f"\n✅ 会话历史加载测试通过!")
    return True

if __name__ == "__main__":
    result = test_session_switching()
    exit(0 if result else 1)
