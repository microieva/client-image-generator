interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_IMAGE_QUALITY: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}