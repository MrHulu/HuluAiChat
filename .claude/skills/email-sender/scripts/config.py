"""
Email Sender Skill - 配置管理
从环境变量读取邮件配置
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class EmailConfig:
    """邮件配置"""
    smtp_server: str
    smtp_port: int
    username: str
    password: str
    from_name: str = "AI Assistant"
    to_default: str = ""
    use_ssl: bool = True

    def validate(self) -> tuple[bool, str]:
        """验证配置是否完整"""
        if not self.smtp_server:
            return False, "EMAIL_SMTP_SERVER 未配置"
        if not self.smtp_port:
            return False, "EMAIL_SMTP_PORT 未配置"
        if not self.username:
            return False, "EMAIL_USERNAME 未配置"
        if not self.password:
            return False, "EMAIL_PASSWORD 未配置"
        return True, "配置有效"


def load_env_file(env_path: Optional[Path] = None) -> None:
    """加载 .env 文件到环境变量"""
    if env_path is not None:
        # 指定了路径，直接使用
        paths_to_try = [env_path]
    else:
        # 按优先级搜索多个可能的位置
        script_dir = Path(__file__).parent           # scripts/
        skill_dir = script_dir.parent                # email-sender/
        claude_dir = skill_dir.parent                # .claude/

        paths_to_try = [
            claude_dir / ".env",                     # ai-center/.claude/.env (主要位置)
            skill_dir / ".env",                      # email-sender/.env
            Path.cwd() / ".claude" / ".env",         # 当前目录/.claude/.env
            Path.cwd() / ".env",                     # 当前目录/.env
        ]

    for path in paths_to_try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, value = line.split("=", 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        # 只设置未存在的环境变量
                        if key not in os.environ:
                            os.environ[key] = value
            return


def get_config() -> EmailConfig:
    """获取邮件配置"""
    # 尝试加载 .env 文件
    load_env_file()

    config = EmailConfig(
        smtp_server=os.environ.get("EMAIL_SMTP_SERVER", ""),
        smtp_port=int(os.environ.get("EMAIL_SMTP_PORT", "465")),
        username=os.environ.get("EMAIL_USERNAME", ""),
        password=os.environ.get("EMAIL_PASSWORD", ""),
        from_name=os.environ.get("EMAIL_FROM_NAME", "AI Assistant"),
        to_default=os.environ.get("EMAIL_TO_DEFAULT", ""),
        use_ssl=os.environ.get("EMAIL_USE_SSL", "true").lower() == "true",
    )

    return config


def print_config_status(config: EmailConfig) -> None:
    """打印配置状态（隐藏密码）"""
    print("当前邮件配置：")
    print(f"  SMTP 服务器: {config.smtp_server}:{config.smtp_port}")
    print(f"  发件人: {config.username} ({config.from_name})")
    print(f"  默认收件人: {config.to_default or '未设置'}")
    print(f"  使用 SSL: {config.use_ssl}")
    print(f"  密码: {'*' * 8 if config.password else '未设置'}")


if __name__ == "__main__":
    config = get_config()
    print_config_status(config)
    valid, msg = config.validate()
    print(f"\n配置状态: {'✓ ' + msg if valid else '✗ ' + msg}")
