import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
