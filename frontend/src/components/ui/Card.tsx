import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-line bg-paper p-6 ${className}`}>
      {children}
    </div>
  );
}
