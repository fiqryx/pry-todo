import { cookies } from "next/headers";
import localFont from "next/font/local";
import { i18nInitialize } from '@/lib/i18n';

import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AppProvider } from "@/components/providers/app-provider";
import { ThemeProvider } from "@/components/providers/theme-provider"
import { I18nProvider } from "@/components/providers/i18n-provider";

import "@/styles/globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/components/minimal-tiptap/styles/index.css'
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

type Props = Readonly<{
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}>

const namespaces = ['translation']

const geistSans = localFont({
  src: "../styles/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../styles/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default async function RootLayout({ children, params }: Props) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  const cookie = await cookies();
  const locale = cookie.get("LOCALE")?.value || (await params)?.locale || 'en';
  const { resources } = await i18nInitialize(locale, namespaces);

  return (
    <html dir="ltr" lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SupabaseProvider url={supabaseUrl} anonKey={supabaseKey}>
        <QueryClientProvider>
            <I18nProvider locale={locale} resources={resources} namespaces={namespaces}>
            <ThemeProvider
              enableSystem
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
            >
              <AppProvider>
                  {/* <MapProvider> */}
                  {children}
                  {/* </MapProvider> */}
              </AppProvider>

                {/* <Analytics /> */}
              <Toaster />
              <SonnerToaster />
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
