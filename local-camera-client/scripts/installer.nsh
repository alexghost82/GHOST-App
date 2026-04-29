!macro customInstall
  ExecWait '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --register-autostart'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'schtasks /Delete /TN "GHOST Camera Agent" /F'
!macroend
