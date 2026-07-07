!define removeDefaultUninstallWelcomePage

!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

!macro customWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE MarkStackUpgradeWelcomePre
  !define MUI_WELCOMEPAGE_TITLE "MarkStack 升级安装"
  !define MUI_WELCOMEPAGE_TEXT "安装程序检测到此电脑已安装 MarkStack。继续后将进入安装目录选择页面，默认沿用旧安装目录；安装时会自动静默升级并保留用户数据。点击“下一步”继续。"
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customPageAfterChangeDir
  !define MUI_PAGE_HEADER_TEXT "安装"
  !define MUI_PAGE_HEADER_SUBTEXT "MarkStack 正在安装，请稍候......"
!macroend

!macro customInit
  StrCpy $R7 "0"
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion"
  ReadRegStr $R2 HKCU "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  StrCpy $R8 HKCU
  StrCmp $R0 "" checkMachineInstall foundExistingInstall

  checkMachineInstall:
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion"
    ReadRegStr $R2 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
    StrCpy $R8 HKLM
    StrCmp $R0 "" done foundExistingInstall

  foundExistingInstall:
    StrCpy $R7 "1"
    StrCmp $R2 "" 0 keepOldInstallDir
    StrCpy $R2 $INSTDIR

  keepOldInstallDir:
    StrCpy $INSTDIR $R2

  done:
!macroend

!ifndef BUILD_UNINSTALLER
Function MarkStackUpgradeWelcomePre
  StrCmp $R7 "1" 0 skipUpgradeWelcome
  Return

  skipUpgradeWelcome:
    Abort
FunctionEnd

!endif



