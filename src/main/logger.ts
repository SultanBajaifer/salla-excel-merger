import log from 'electron-log/main'

// Logs go to %APPDATA%\salla-excel-merger\logs\main.log on Windows, so problems
// on a customer's machine can be diagnosed from the file they send back.
log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024

export default log
