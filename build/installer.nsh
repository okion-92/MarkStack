!define removeDefaultUninstallWelcomePage

!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

!macro customWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE MarkStackUpgradeWelcomePre
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE MarkStackUpgradeWelcomeLeave
  !define MUI_WELCOMEPAGE_TITLE "MarkStack 升级安装"
  !define MUI_WELCOMEPAGE_TEXT "安装程序检测到此电脑已安装 MarkStack。继续后会先启动旧版本卸载流程，卸载完成后再进入新版安装目录选择页面。新版安装目录会默认沿用旧目录，用户数据会保留。点击“下一步”开始升级。"
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

Function MarkStackUpgradeWelcomeLeave
  MessageBox MB_YESNO|MB_ICONQUESTION "确认先卸载旧版 MarkStack $R0？卸载完成后将进入新版安装目录选择页面，默认目录为：$R2" IDYES runExistingUninstaller
  Abort

  runExistingUninstaller:
    Call MarkStackRunExistingUninstaller
    IfErrors existingUninstallFailed restoreOldInstallDir

  existingUninstallFailed:
    MessageBox MB_OK|MB_ICONEXCLAMATION "旧版 MarkStack 卸载未完成，已取消新版安装。"
    Abort

  restoreOldInstallDir:
    StrCmp $R2 "" done 0
    StrCpy $INSTDIR $R2

  done:
FunctionEnd

Function MarkStackRunExistingUninstaller
  ClearErrors
  StrCmp $R8 "HKLM" readMachineInstall readUserInstall

  readUserInstall:
    ReadRegStr $R1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
    Goto readInstallDone

  readMachineInstall:
    ReadRegStr $R1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"

  readInstallDone:
    StrCmp $R1 "" missingUninstaller 0

  StrCpy $R3 $R1 1
  StrCmp $R3 '"' extractQuoted extractUnquoted

  extractQuoted:
    StrCpy $R4 ""
    StrCpy $R5 1

  extractQuotedLoop:
    StrCpy $R6 $R1 1 $R5
    StrCmp $R6 '"' extractedPath
    StrCmp $R6 "" extractedPath
    StrCpy $R4 "$R4$R6"
    IntOp $R5 $R5 + 1
    Goto extractQuotedLoop

  extractUnquoted:
    StrCpy $R4 $R1

  extractedPath:
    StrCmp $R4 "" missingUninstaller 0
    StrCpy $R6 "$PLUGINSDIR\old-uninstaller.exe"
    CopyFiles /SILENT "$R4" "$R6"
    IfErrors runUninstallerInPlace 0
    ExecWait '"$R6" /S /KEEP_APP_DATA --updated _?=$R2' $R9
    IfErrors runUninstallerInPlace checkUninstallResult

  runUninstallerInPlace:
    ExecWait '"$R4" /S /KEEP_APP_DATA --updated _?=$R2' $R9
    IfErrors uninstallFailed checkUninstallResult

  checkUninstallResult:
    IntCmp $R9 0 uninstallOk uninstallFailed uninstallFailed

  uninstallOk:
    ClearErrors
    Return

  missingUninstaller:
  uninstallFailed:
    SetErrors
FunctionEnd
!endif



