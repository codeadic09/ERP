"use client"

import { Card, CardContent } from "@/components/ui/card"

export function SkeletonPremium({ className = "", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div 
      className={`skeleton-premium rounded-xl bg-gray-100/30 ${className}`} 
      style={style}
    />
  )
}

export function StatSkeleton() {
  return (
    <Card className="liquid-glass border-white/40">
      <CardContent className="p-4">
        <SkeletonPremium className="w-9 h-9 mb-3" />
        <SkeletonPremium className="h-3 w-16 mb-2" />
        <SkeletonPremium className="h-6 w-24 mb-2" />
        <SkeletonPremium className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonPremium key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <Card className="liquid-glass border-white/40 h-[240px] flex flex-col p-4">
      <SkeletonPremium className="h-4 w-32 mb-6" />
      <div className="flex-1 flex items-end gap-3 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonPremium
            key={i}
            className="flex-1"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </Card>
  )
}
