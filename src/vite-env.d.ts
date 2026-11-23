/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// Le variabili d'ambiente dell'app: vedi .env.example.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_EMAIL?: string
}

// Commit e ora della build, da vite.config.ts (`define`): vedi src/ui/versione.ts.
declare const __COMMIT__: string
declare const __COSTRUITA__: string
