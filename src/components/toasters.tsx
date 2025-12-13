"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { useTheme } from "next-themes";

export function Toasters() {
  const { theme = "system" } = useTheme();

  return (
    <>
      <Sonner
        theme={theme as "light" | "dark" | "system"}
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
      />
      <ShadcnToaster />
    </>
  );
}
