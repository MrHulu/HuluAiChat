"""AI 聊天桌面应用入口。"""
from src.app_data import ensure_app_data_dir
from src.logging_config import setup_logging
from src.config import JsonConfigStore
from src.persistence import SqliteSessionRepository, SqliteMessageRepository
from src.chat import OpenHuluChatClient
from src.app import AppService
from src.ui.main_window import MainWindow


def main() -> None:
    ensure_app_data_dir()
    setup_logging()
    config_store = JsonConfigStore()
    session_repo = SqliteSessionRepository()
    message_repo = SqliteMessageRepository()
    chat_client = OpenHuluChatClient()
    app = AppService(config_store, session_repo, message_repo, chat_client)
    # 应用启动时根据配置应用主题与侧边栏状态（在 MainWindow 内通过 config() 读取）
    win = MainWindow(app)
    win.run()


if __name__ == "__main__":
    main()
