; HuluChat NSIS Installer Script
; 确保先运行 pyinstaller HuluChat.spec 构建 exe

!define PRODUCT_NAME "HuluChat"
!define PRODUCT_VERSION "1.0.1"
!define PRODUCT_PUBLISHER "HuluMan"
!define PRODUCT_WEB_SITE "https://github.com/MrHulu/HuluChat"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\HuluChat.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; 现代界面 + 中文支持
!include "MUI2.nsh"
!include "LogicLib.nsh"

; 安装器属性
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "dist\HuluChat-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
SetCompressor /SOLID lzma
; 申请管理员权限
RequestExecutionLevel admin

; --- 图标 ---
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"

; --- 界面 ---
!define MUI_WELCOMEPAGE_TITLE "欢迎使用 ${PRODUCT_NAME} ${PRODUCT_VERSION} 安装向导"
!define MUI_WELCOMEPAGE_TEXT "本程序将在您的电脑上安装 ${PRODUCT_NAME}。$\r$\n$\r$\n点击「下一步」继续。"

!define MUI_FINISHPAGE_TITLE "${PRODUCT_NAME} 安装完成"
!define MUI_FINISHPAGE_TEXT "$\r$\n${PRODUCT_NAME} 已成功安装到您的电脑上。$\r$\n$\r$\n点击「完成」退出安装向导。"
!define MUI_FINISHPAGE_RUN "$INSTDIR\HuluChat.exe"
!define MUI_FINISHPAGE_RUN_TEXT "启动 ${PRODUCT_NAME}"

; 欢迎页面
!insertmacro MUI_PAGE_WELCOME
; 许可协议（可选）
;!insertmacro MUI_PAGE_LICENSE "LICENSE"
; 安装目录
!insertmacro MUI_PAGE_DIRECTORY
; 安装过程
!insertmacro MUI_PAGE_INSTFILES
; 完成页面
!insertmacro MUI_PAGE_FINISH

; 安装语言
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; 安装区段
Section "MainSection" SEC01
  SectionIn RO
  SetOutPath "$INSTDIR"
  ; 主程序
  File "dist\HuluChat.exe"
  ; 数据文件（如果有）
  File /nonfatal "assets\icon.png"

  ; 创建开始菜单快捷方式
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\HuluChat.exe"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\卸载.lnk" "$INSTDIR\uninst.exe"

  ; 创建桌面快捷方式
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\HuluChat.exe"

  ; 注册表项
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\HuluChat.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\HuluChat.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1
SectionEnd

; 卸载区段
Section -Uninstall
  ; 删除文件
  Delete "$INSTDIR\HuluChat.exe"
  Delete "$INSTDIR\icon.png"
  Delete "$INSTDIR\uninst.exe"

  ; 删除快捷方式
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\卸载.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"

  ; 删除目录
  RMDir "$INSTDIR"

  ; 删除注册表项
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd

; --- 函数 ---

; 安装初始化
Function .onInit
  ; 检查是否已安装
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "${PRODUCT_NAME} 已经安装。$\r$\n$\r$\n点击「确定」卸载旧版本，或点击「取消」退出。" \
    IDOK uninst
  Abort

uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  IfErrors no_remove_uninstaller done
no_remove_uninstaller:
done:
FunctionEnd
