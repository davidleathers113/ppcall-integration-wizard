import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { IntegrationStatus, CampaignStatus } from "../../models/appTypes";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BadgeVariant = 
  | "default" | "success" | "warning" | "error" | "info" | "outline"
  | IntegrationStatus | CampaignStatus;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className }) => {
  const variants: Record<string, string> = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    outline: "border border-slate-200 text-slate-600",
    // Integration/Campaign specific
    active: "bg-green-100 text-green-800 border border-green-200",
    stale: "bg-slate-100 text-slate-500 border border-slate-200",
    dormant: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    failing: "bg-red-100 text-red-700 border border-red-200 font-bold",
    needs_testing: "bg-purple-100 text-purple-700 border border-purple-200",
    test_passed: "bg-blue-100 text-blue-700 border border-blue-200",
    needs_retest: "bg-orange-100 text-orange-700 border border-orange-200",
    draft: "bg-slate-100 text-slate-600 border border-slate-200",
    active_unused: "bg-blue-50 text-blue-600 border border-blue-200",
    paused: "bg-slate-200 text-slate-700 border border-slate-300",
    archived: "bg-slate-100 text-slate-400 border border-slate-200",
  };

  const label = typeof children === "string" ? children.replaceAll("_", " ") : children;

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
      variants[variant as string] || variants.default,
      className
    )}>
      {label}
    </span>
  );
};

export default Badge;
