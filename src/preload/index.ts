import { contextBridge } from 'electron'

// Custom APIs for renderer
if (!process.contextIsolated) {
  throw new Error('Context isolation must be enabled')
}

try {
  contextBridge.exposeInMainWorld('context', {})
} catch (error) {
  console.error(error)
}
