import { is } from '@electron-toolkit/utils'
import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import log from '../logger'
import { handleProtected } from './access'

const execFileAsync = promisify(execFile)

// Brand detection prints the full brand list as JSON; the 1 MB default can be too small.
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024

/**
 * Runs one of the Python tools and returns its stdout.
 * In development the .py script is run with the system Python; in production
 * the PyInstaller executable bundled under resources/python is used.
 */
async function runPythonTool(scriptName: string, args: string[]): Promise<string> {
  const tag = `[${scriptName}]`
  let command: string
  let commandArgs: string[]

  if (is.dev) {
    command = process.platform === 'win32' ? 'python' : 'python3'
    commandArgs = [join(__dirname, `../../scripts/${scriptName}.py`), ...args]
  } else {
    const extension = process.platform === 'win32' ? '.exe' : ''
    command = join(process.resourcesPath, 'python', `${scriptName}${extension}`)
    commandArgs = args
    if (!existsSync(command)) log.error(tag, 'Bundled executable not found:', command)
  }

  log.info(tag, 'Running', command, args)
  const { stdout, stderr } = await execFileAsync(command, commandArgs, {
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true
  })
  if (stderr) {
    log.warn(tag, 'Python stderr:', stderr)
  }
  return stdout.trim()
}

export function registerPythonHandlers(): void {
  // Clean an Excel file; the script prints the cleaned file path
  handleProtected('clean-excel-file', async (_, filePath: string) => {
    try {
      const cleanedPath = await runPythonTool('clean_excel', [filePath])
      log.info('[clean-excel-file] File cleaned successfully:', cleanedPath)
      return cleanedPath
    } catch (error) {
      log.error('[clean-excel-file] Error cleaning Excel file:', error)
      throw error
    }
  })

  // Detect brands from Excel file
  handleProtected('detect-brands', async (_, filePath: string) => {
    try {
      const result = JSON.parse(await runPythonTool('extract_brands', ['detect', filePath]))
      log.info('[detect-brands] Detected brands:', result)
      return result
    } catch (error) {
      log.error('[detect-brands] Error detecting brands:', error)
      throw error
    }
  })

  // Extract products by selected brands
  handleProtected('extract-by-brands', async (_, filePath: string, selectedBrands: string[]) => {
    try {
      const brandsJson = JSON.stringify(selectedBrands)
      const result = JSON.parse(
        await runPythonTool('extract_brands', ['extract', filePath, brandsJson])
      )
      log.info('[extract-by-brands] Extraction result:', result)

      if (!result.success) {
        throw new Error(result.error)
      }

      return result
    } catch (error) {
      log.error('[extract-by-brands] Error extracting by brands:', error)
      throw error
    }
  })
}
