"""
HuluChat v2.0.0 设计系统

统一的设计规范：颜色、间距、圆角、字体
"""
from typing import Tuple

# ============================================================================
# 颜色系统 (Color System)
# ============================================================================

# 每个颜色值为 (light_mode, dark_mode) 元组
ColorPair = Tuple[str, str]

class Colors:
    """v2.0.0 配色系统"""

    # 品牌色 (Brand Colors)
    PRIMARY: ColorPair = ("#6D3ECC", "#8C67D7")           # 主色 - 紫色
    PRIMARY_HOVER: ColorPair = ("#5A32A8", "#A178E0")     # 主色悬停
    PRIMARY_SUBTLE: ColorPair = ("#F3F0FF", "#2A2340")    # 主色淡化

    # 功能色 (Functional Colors)
    SUCCESS: ColorPair = ("#16A34A", "#22C55E")           # 成功 - 绿色
    WARNING: ColorPair = ("#D97706", "#F59E0B")           # 警告 - 橙色
    ERROR: ColorPair = ("#DC2626", "#EF4444")             # 错误 - 红色
    INFO: ColorPair = ("#2563EB", "#3B82F6")              # 信息 - 蓝色

    # 背景色 (Background Colors)
    BG_PRIMARY: ColorPair = ("#FFFFFF", "#1A1A1A")        # 主背景
    BG_SECONDARY: ColorPair = ("#F8F9FA", "#2D2D2D")      # 次级背景
    BG_TERTIARY: ColorPair = ("#F0F1F3", "#3A3A3A")       # 三级背景
    BG_ELEVATED: ColorPair = ("#FFFFFF", "#252525")       # 浮起元素

    # 文字色 (Text Colors)
    TEXT_PRIMARY: ColorPair = ("#1A1A1A", "#E5E5E5")      # 主要文字
    TEXT_SECONDARY: ColorPair = ("#666666", "#A0A0A0")    # 次要文字
    TEXT_TERTIARY: ColorPair = ("#A0A0A0", "#666666")     # 辅助文字

    # 边框色 (Border Colors)
    BORDER_SUBTLE: ColorPair = ("#E5E5E5", "#404040")     # 细边框
    BORDER_DEFAULT: ColorPair = ("#D0D0D0", "#505050")    # 默认边框

    # 消息气泡颜色 (Message Colors) - v2.0.0 优化
    # 用户消息：更柔和的紫色渐变，参考 ChatGPT/Claude 的视觉层次
    USER_MSG_BG: ColorPair = ("#7C5DF0", "#9B7FE8")      # 用户消息背景（柔和紫）
    USER_MSG_BG_INNER: ColorPair = ("#8B6CF8", "#A891F5") # 用户消息内层（渐变感）
    USER_MSG_TEXT: ColorPair = ("#FFFFFF", "#FFFFFF")     # 用户消息文字
    USER_MSG_BORDER: ColorPair = ("#6B4CE0", "#8A6FD8")   # 用户消息边框

    # AI 消息：中性背景，清晰可读
    AI_MSG_BG: ColorPair = ("#F4F4F5", "#252525")        # AI 消息背景（更纯净）
    AI_MSG_BG_INNER: ColorPair = ("#FAFAFA", "#2A2A2A")  # AI 消息内层
    AI_MSG_TEXT: ColorPair = ("#1A1A1A", "#EAEAEA")      # AI 消息文字
    AI_MSG_BORDER: ColorPair = ("#E5E5E5", "#383838")    # AI 消息边框

    # 系统消息
    SYSTEM_MSG_BG: ColorPair = ("#FFF8DC", "#4A4020")    # 系统消息背景
    SYSTEM_MSG_TEXT: ColorPair = ("#8B6914", "#F0D880")  # 系统消息文字

    # 消息容器背景
    MSG_CONTAINER_BG: ColorPair = ("transparent", "transparent")  # 消息容器背景

    # 悬停颜色 (Hover Colors) - 基于 BG_TERTIARY 变深
    HOVER_BG: ColorPair = ("#E8E9EA", "#454545")          # 通用悬停

    # 选中颜色 (Selected Colors)
    SELECTED_BG: ColorPair = ("#EDE0FC", "#3D2E52")       # 选中背景（紫色淡化）

    # 焦点颜色 (Focus Colors)
    FOCUS_BORDER: ColorPair = ("#6D3ECC", "#8C67D7")      # 焦点边框（主色）

    # 禁用颜色 (Disabled Colors)
    DISABLED: ColorPair = ("#D0D0D0", "#404040")          # 禁用状态
    DISABLED_TEXT: ColorPair = ("#A0A0A0", "#666666")     # 禁用文字

    # 状态颜色（用于 Pin 标记等）
    PINNED: ColorPair = ("#FEF3C7", "#92400E")            # 固定状态（琥珀色）
    PINNED_TEXT: ColorPair = ("#92400E", "#FEF3C7")       # 固定文字

    # 代码块颜色
    CODE_BG: ColorPair = ("#F5F5F5", "#1E1E1E")           # 代码块背景
    CODE_BORDER: ColorPair = ("#E0E0E0", "#333333")       # 代码块边框

    # 搜索高亮
    SEARCH_HIGHLIGHT: ColorPair = ("#FEF08A", "#854D0E")  # 搜索高亮（黄色）

    # Toast 通知
    TOAST_BG: ColorPair = ("#374151", "#1F2937")          # Toast 背景
    TOAST_TEXT: ColorPair = ("#F9FAFB", "#F9FAFB")        # Toast 文字
    TOAST_BORDER: ColorPair = ("#4B5563", "#374151")      # Toast 边框

    # 下拉菜单/弹出层
    DROPDOWN_BG: ColorPair = ("#FAFAFA", "#252525")      # 下拉菜单背景
    DROPDOWN_HOVER: ColorPair = ("#E8E9EA", "#454545")    # 下拉菜单悬停

    # Pin 按钮金色
    PIN_GOLD: ColorPair = ("#D4A520", "#FFD700")         # Pin 图标金色
    PIN_GOLD_HOVER: ColorPair = ("#B8920A", "#FFC400")   # Pin 悬停金色

    # 轻量悬停（用于按钮等）
    HOVER_LIGHT: ColorPair = ("#E8E9EA", "#3D3D3D")      # 轻量悬停
    HOVER_MEDIUM: ColorPair = ("#D8D9DA", "#404040")     # 中等悬停

    # 高对比文字（用于强调）
    TEXT_HIGH_CONTRAST: ColorPair = ("#0A0A0A", "#F5F5F5")  # 高对比文字

    # 边框颜色扩展
    BORDER_LIGHT: ColorPair = ("#E0E0E0", "#3A3A3A")     # 浅边框
    BORDER_FOCUS: ColorPair = ("#6D3ECC", "#8C67D7")     # 焦点边框（主色）

    # 按钮背景扩展
    BTN_DEFAULT: ColorPair = ("#F0F1F3", "#3A3A3A")      # 默认按钮背景
    BTN_HOVER: ColorPair = ("#E8E9EA", "#454545")        # 按钮悬停
    BTN_PRESSED: ColorPair = ("#D8D9DA", "#505050")      # 按钮按下


# ============================================================================
# 间距系统 (Spacing System)
# ============================================================================

class Spacing:
    """基于 4px 网格的间距系统"""

    XS = 4     # 紧凑元素间距
    SM = 8     # 小元素内边距
    MD = 12    # 默认元素间距
    LG = 16    # 区块间距
    XL = 24    # 大区块间距
    XXL = 32   # 页面级间距


# ============================================================================
# 圆角系统 (Border Radius)
# ============================================================================

class Radius:
    """统一的圆角规范"""

    XS = 4     # 小按钮、标签
    SM = 6     # 输入框、小卡片
    MD = 8     # 按钮、卡片
    LG = 12    # 对话框、面板
    XL = 16    # 消息气泡
    FULL = 0   # 直角（用于侧边栏等）


# ============================================================================
# 字体系统 (Typography)
# ============================================================================

class FontSize:
    """字体大小规范"""

    XS = 11    # 辅助文字、标签
    SM = 12    # 小字、说明
    BASE = 14  # 正文（默认）
    MD = 15    # 强调正文
    LG = 16    # 小标题
    XL = 18    # 标题
    XXL = 20   # 大标题


class FontWeight:
    """字重规范"""

    NORMAL = 400   # 正文
    MEDIUM = 500   # 强调
    SEMIBOLD = 600 # 小标题
    BOLD = 700     # 标题


# ============================================================================
# 组件规范 (Component Specs)
# ============================================================================

class Button:
    """按钮规范"""

    # Primary Button
    PRIMARY_HEIGHT = 36
    PRIMARY_PADDING = (0, 16)
    PRIMARY_RADIUS = Radius.MD

    # Secondary Button
    SECONDARY_HEIGHT = 36
    SECONDARY_PADDING = (0, 16)
    SECONDARY_RADIUS = Radius.MD

    # Ghost Button
    GHOST_HEIGHT = 32
    GHOST_PADDING = (0, 12)
    GHOST_RADIUS = Radius.MD

    # Icon Button
    ICON_SIZE = 32
    ICON_RADIUS = Radius.MD


class Input:
    """输入框规范"""

    HEIGHT = 36
    PADDING = (0, 12)
    RADIUS = Radius.SM


class Card:
    """卡片规范"""

    PADDING = Spacing.LG
    RADIUS = Radius.MD


class Message:
    """消息气泡规范"""

    PADDING = (12, 16)
    RADIUS_USER = (Radius.XL, Radius.XS, Radius.XL, Radius.XL)  # 左下角小圆角
    RADIUS_AI = (Radius.XS, Radius.XL, Radius.XL, Radius.XL)    # 右上角小圆角
    MAX_WIDTH_RATIO = 0.75  # 最大宽度占容器 75%


# ============================================================================
# 旧版配色兼容 (Legacy Compatibility)
# ============================================================================

# 为了平滑迁移，提供旧版 gray 色系到新色系的映射
LEGACY_MAP = {
    ("gray90", "gray17"): Colors.BG_SECONDARY,       # 侧边栏
    ("gray85", "gray22"): Colors.BG_TERTIARY,        # 列表背景
    ("gray80", "gray30"): Colors.HOVER_BG,           # Toast/悬停
    ("gray75", "gray30"): Colors.BG_TERTIARY,        # 按钮默认
    ("gray75", "gray32"): Colors.BG_TERTIARY,
    ("gray75", "gray35"): Colors.HOVER_BG,           # 按钮悬停
    ("gray72", "gray32"): Colors.HOVER_BG,
    ("gray70", "gray28"): Colors.HOVER_BG,
    ("gray70", "gray30"): Colors.HOVER_BG,
    ("gray70", "gray35"): Colors.HOVER_BG,
    ("gray65", "gray30"): Colors.BG_TERTIARY,
    ("gray60", "gray40"): Colors.SELECTED_BG,        # 选中状态
    ("gray60", "gray45"): Colors.SELECTED_BG,
    ("gray50", "gray40"): Colors.SELECTED_BG,        # 焦点状态
    ("gray40", "gray60"): Colors.TEXT_TERTIARY,      # 辅助文字
    ("gray15", "gray88"): Colors.TEXT_PRIMARY,       # 主要文字
    ("gray50", "gray40"): Colors.BG_TERTIARY,
}


def migrate_color(old_color: ColorPair) -> ColorPair:
    """
    迁移旧版配色到新版配色系统

    Args:
        old_color: 旧的 (light, dark) 颜色对

    Returns:
        新的 (light, dark) 颜色对，如果没有映射则返回原值
    """
    return LEGACY_MAP.get(old_color, old_color)


# ============================================================================
# 工具函数 (Utility Functions)
# ============================================================================

def c(*colors: str) -> ColorPair:
    """
    创建颜色对 (Color Pair)

    Args:
        *colors: 1-2 个颜色值，1 个则 Light/Dark 同色，2 个则分别对应

    Returns:
        (light, dark) 颜色对
    """
    if len(colors) == 1:
        return (colors[0], colors[0])
    return (colors[0], colors[1])


def get_ctk_colors(color_pair: ColorPair) -> tuple:
    """
    将颜色对转换为 CustomTkinter 格式

    Args:
        color_pair: (light, dark) 颜色对

    Returns:
        CustomTkinter 兼容的颜色元组
    """
    return color_pair if isinstance(color_pair, tuple) else (color_pair, color_pair)
