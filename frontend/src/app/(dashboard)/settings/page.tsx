"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as any;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleChangeTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (newTheme === "system") {
      root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      root.classList.add(newTheme);
    }
  };

  const options = [
    { value: "light", label: "Light Theme", icon: Sun },
    { value: "dark", label: "Dark Theme", icon: Moon },
    { value: "system", label: "System Default", icon: Laptop },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">User Preferences</span>
        <h1 className="text-xl font-extrabold text-foreground mt-0.5">Workspace Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize styling attributes, theme toggles, and notification settings for your Learning OS.
        </p>
      </div>

      <div className="max-w-xl p-6 rounded-2xl border border-border bg-card-dark space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Visual Theme</span>
          <div className="grid gap-3">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChangeTheme(opt.value as any)}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-brand-600/10 border-brand-500 text-foreground font-bold"
                      : "bg-bg-dark border-border hover:border-gray-700 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 text-xs">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
