import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Safe theme access with fallback
  let theme = "dark";
  try {
    const themeData = useTheme();
    theme = themeData.theme || "dark";
  } catch (error) {
    // Fallback if theme context is not available
    theme = "dark";
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={80} // Offset pour ne pas cacher le header
      duration={2000}
      gap={8}
      visibleToasts={3}
      expand={false}
      toastOptions={{
        duration: 2000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success:
            "group-[.toast]:bg-success/10 group-[.toast]:text-success group-[.toast]:border-success/30",
          error:
            "group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive group-[.toast]:border-destructive/30",
          warning:
            "group-[.toast]:bg-yellow-500/10 group-[.toast]:text-yellow-600 group-[.toast]:border-yellow-500/30",
          info:
            "group-[.toast]:bg-primary/10 group-[.toast]:text-primary group-[.toast]:border-primary/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
