# Mobile & Desktop Responsive Design Guide

## Overview

The KBM Construct app is fully responsive and works seamlessly on both mobile and desktop devices.

## Key Features

### 🎯 Adaptive Navigation

- **Desktop (1024px+)**: Fixed sidebar navigation on the left
- **Mobile (<1024px)**: Hamburger menu with slide-out drawer navigation
- **Consistent dark theme** across all devices

### 📱 Mobile Optimizations

1. **Touch-Friendly Targets**
   - All buttons and links meet 44x44px minimum tap target size
   - Increased padding on mobile for comfortable tapping
   - Orange tap highlight for visual feedback

2. **Responsive Layouts**
   - Grid layouts adapt: 1 column on mobile → 2-4 columns on desktop
   - Tables scroll horizontally on mobile
   - Cards stack vertically on small screens

3. **Typography Scaling**
   - Headers scale down on mobile (text-2xl → text-3xl)
   - Comfortable reading sizes on all devices

4. **Spacing**
   - Tighter padding on mobile (p-4 → p-6+ on desktop)
   - Optimised for thumb zones

### 🖥️ Desktop Features

- **Persistent Sidebar**: Always-visible navigation for quick access
- **Multi-column Layouts**: Utilise wide screens with grid layouts
- **Larger Typography**: More prominent headers and data displays
- **Hover States**: Enhanced interactivity with hover effects

## Component Usage

### ResponsiveTable

Wrap tables for horizontal scroll on mobile:

\`\`\`tsx
import ResponsiveTable from '@/components/ResponsiveTable';

<ResponsiveTable>
  <table>
    {/* table content */}
  </table>
</ResponsiveTable>
\`\`\`

### ResponsiveCard

Auto-adjusting padding for cards:

\`\`\`tsx
import ResponsiveCard from '@/components/ResponsiveCard';

<ResponsiveCard>
  {/* card content */}
</ResponsiveCard>
\`\`\`

### Grid Layouts

Use Tailwind responsive classes:

\`\`\`tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* items */}
</div>
\`\`\`

## Breakpoints

Tailwind CSS breakpoints used:
- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (desktop - sidebar shows)
- **xl**: 1280px (large desktop)
- **2xl**: 1536px (extra large)

## Testing Checklist

When adding new features, test:

- [ ] Navigation works on mobile (hamburger menu)
- [ ] Content fits within viewport (no horizontal scroll)
- [ ] Touch targets are adequate (min 44x44px)
- [ ] Typography is readable on small screens
- [ ] Tables/wide content scrolls horizontally
- [ ] Forms stack vertically on mobile
- [ ] Buttons and actions are accessible with thumbs

## Best Practices

1. **Mobile-First Development**: Start with mobile layout, enhance for desktop
2. **Use Semantic Breakpoints**: sm, md, lg prefixes in Tailwind
3. **Test Real Devices**: Simulator ≠ actual mobile experience
4. **Consider Landscape**: Test both portrait and landscape orientations
5. **Performance**: Minimize bundle size for mobile networks

## Common Patterns

### Responsive Header
\`\`\`tsx
<PageHeader 
  title="Page Title"
  subtitle="Subtitle"
  actions={
    <button className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base">
      Action
    </button>
  }
/>
\`\`\`

### Responsive Stats
\`\`\`tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Stat" value="123" change="+5%" />
</div>
\`\`\`

### Responsive Form
\`\`\`tsx
<form className="space-y-4 sm:space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input className="px-3 py-2 sm:px-4 sm:py-3" />
  </div>
</form>
\`\`\`

## Troubleshooting

**Issue**: Horizontal scroll on mobile
- **Fix**: Add `overflow-x-hidden` to parent or use `max-w-full`

**Issue**: Text too small on mobile
- **Fix**: Use responsive text sizes: `text-sm sm:text-base lg:text-lg`

**Issue**: Buttons hard to tap
- **Fix**: Ensure `min-h-[44px] min-w-[44px]` or adequate padding

**Issue**: Layout breaks on tablet
- **Fix**: Test and add `md:` breakpoint styles between mobile and desktop
