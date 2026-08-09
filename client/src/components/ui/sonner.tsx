import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!z-[1130]",
          closeButton: "!z-[1130]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--ivory)",
          "--normal-text": "var(--charcoal)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--ivory)",
          "--success-text": "var(--charcoal)",
          "--success-border": "var(--gold)",
          "--accent": "var(--gold)",
          "--radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
