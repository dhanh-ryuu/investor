# UI Redesign — Investor App

**Date:** 2026-04-22  
**Status:** Approved  
**Approach:** Tailwind v4 overhaul — migrate inline styles to utility classes, new layout, new design tokens

---

## Goals

- Responsive layout: đẹp trên cả mobile và desktop
- Visual style: Minimalist financial — light background, near-black text, typography làm chủ, ít màu
- Font: Geist Sans (bundled trong Next.js 16)
- Desktop layout: Sidebar cố định bên trái + main content bên phải
- Mobile layout: Bottom tab nav + full-width content

---

## Layout

### Desktop (≥ 768px)

```
┌──────────────────────────────────────────────┐
│ Sidebar (200px, bg #0a0a0a)  │ Main (flex-1) │
│                              │               │
│  INVESTOR                    │  ┌──────────┐ │
│                              │  │ content  │ │
│  ◆ Gold          ← active   │  │ max-w    │ │
│  ⊞ Apartment                │  │ 760px    │ │
│                              │  │ centered │ │
│  ─────────────               │  └──────────┘ │
│  Updated: 22/04              │               │
└──────────────────────────────────────────────┘
```

- Sidebar: fixed height 100vh, sticky
- Active nav item: white text + left border 2px solid white
- Inactive: `text-neutral-400`, hover `text-white`
- App name "INVESTOR": uppercase, letter-spacing wide, 13px, `text-white`

### Mobile (< 768px)

- Sidebar ẩn hoàn toàn
- Fixed bottom tab bar: `Gold | Apartment` với icon + label
- Bottom bar bg: `#0a0a0a`, height 56px
- Content: full-width, padding 16px, padding-bottom 72px (để không bị bottom bar che)

---

## Design Tokens

Thay thế toàn bộ CSS variables cũ trong `globals.css`:

```css
:root {
  --bg: #ffffff;
  --bg-subtle: #f5f5f5;
  --sidebar-bg: #0a0a0a;
  --text: #0a0a0a;
  --text-secondary: #525252;
  --text-muted: #a3a3a3;
  --border: #e5e5e5;
  --green: #16a34a;
  --red: #dc2626;
  --radius-sm: 4px;
  --radius: 6px;
}
```

**Không có màu accent thứ ba.** Chỉ dùng đỏ/xanh lá cho tăng/giảm giá.

---

## Typography

- Font: Geist Sans, load qua `next/font/local` từ bundle Next.js 16
- Apply vào `<html>` tag trong `layout.tsx`
- Tất cả số tài chính: `font-variant-numeric: tabular-nums` (class Tailwind: `tabular-nums`)

| Role | Size | Weight | Tailwind |
|---|---|---|---|
| Hero price | 36px | 700 | `text-4xl font-bold` |
| Section heading | 20px | 600 | `text-xl font-semibold` |
| Body | 14px | 400 | `text-sm` |
| Label / muted | 12px | 500 | `text-xs font-medium` |
| Table data | 13px | 400 | `text-[13px]` |

---

## Components

### NavBar → Sidebar + BottomNav

**Xóa** component `NavBar.tsx` hiện tại.  
**Tạo mới:**
- `Sidebar.tsx` — desktop sidebar (hidden on mobile)
- `BottomNav.tsx` — mobile bottom tab bar (hidden on desktop)

Cả hai nhận `active: "gold" | "apartment"` và `onChange` props — giữ nguyên interface.

**Lưu ý kiến trúc:** Sidebar và BottomNav nằm trong `page.tsx` (không phải `layout.tsx`) vì chúng cần truy cập state `active`/`onChange`. Không cần Context.

**Sidebar markup:**
```
<aside class="w-[200px] min-h-screen bg-[#0a0a0a] flex flex-col fixed">
  <div>INVESTOR</div>           {/* logo */}
  <nav>
    <NavItem icon="◆" label="Gold" />
    <NavItem icon="⊞" label="Apartment" />
  </nav>
  <div class="mt-auto">        {/* footer */}
    <span>Updated: {date}</span>
  </div>
</aside>
```

### Header / Hero (GoldView)

```
<section class="pb-8 border-b border-[--border]">
  <p class="text-xs text-[--text-muted] uppercase tracking-widest mb-3">
    Vàng 9999 · {date}
  </p>
  <div class="text-4xl font-bold tabular-nums mb-2">
    {sell_price} ₫
  </div>
  <span class="text-sm font-medium px-2 py-0.5 rounded bg-green-50 text-[--green]">
    +200,000 (+1.28%)
  </span>
  <div class="flex gap-8 mt-4 text-sm text-[--text-secondary]">
    <div>Mua <span class="font-semibold text-[--text] tabular-nums">{buy_price}</span></div>
    <div>Bán <span class="font-semibold text-[--text] tabular-nums">{sell_price}</span></div>
  </div>
</section>
```

### Selectors (TimeRangeSelector, AreaSelector, bedroom filter)

Thay pill tròn → **underline tabs**:
```
<button class="pb-2 text-sm font-medium border-b-2 border-transparent
               data-[active]:border-black data-[active]:text-[--text]
               text-[--text-muted] hover:text-[--text] transition-colors">
  1M
</button>
```
Các button nằm trong `<div class="flex gap-6 border-b border-[--border]">`.

### Stats Cards

```
<div class="grid grid-cols-2 gap-3">
  <div class="bg-[--bg-subtle] border border-[--border] rounded-[--radius] p-4">
    <p class="text-xs font-medium text-[--text-muted] uppercase tracking-wide mb-1">
      Period High
    </p>
    <p class="text-xl font-semibold tabular-nums text-[--red]">
      15,800,000
    </p>
    <p class="text-xs text-[--text-muted] mt-0.5">22/04/2026</p>
  </div>
  ...
</div>
```

### Chart

- Wrapper: `bg-white` (không thay đổi Chart.js logic)
- Cập nhật màu trong options: gridlines `rgba(0,0,0,0.06)`, tick color `#a3a3a3`
- Đường Mua: `#0a0a0a` (đen), Bán: `#525252` (xám), MA7: dashed nhạt, MA30: dashed nhạt hơn

### Table (PriceTable, ApartmentPriceTable)

```
<table class="w-full text-[13px]">
  <thead>
    <tr class="border-b border-black">
      <th class="text-left text-xs font-medium uppercase tracking-widest
                 text-[--text-muted] pb-2">Date</th>
      <th class="text-right ...">Buy</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-[--border] hover:bg-[--bg-subtle] transition-colors">
      <td class="py-3 text-[--text-secondary]">22/04</td>
      <td class="py-3 text-right tabular-nums font-medium">15,500,000</td>
      ...
    </tr>
  </tbody>
</table>
```
- Số căn phải (`text-right`)
- `tabular-nums` cho cột số
- Không có max-height scroll — dùng page scroll tự nhiên

### Loading State

Thay text "Loading..." bằng skeleton shimmer:
```tsx
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[--bg-subtle] rounded ${className}`} />
  )
}

// Usage:
<Skeleton className="h-10 w-48 mb-2" />   {/* hero price */}
<Skeleton className="h-4 w-24" />          {/* change badge */}
```

### ApartmentListings

Accordion đơn giản:
- Toggle button: full-width, `flex justify-between`, dấu `+`/`−` bên phải
- Expanded: danh sách link, mỗi item 1 hàng với `title | price | area | price/m²`
- Link màu `#2563eb` (duy nhất nơi dùng màu blue — external link convention)

### ApartmentView Header

Tương tự GoldView hero nhưng không có giá lớn — chỉ title + subtitle.

---

## File Changes

| File | Thay đổi |
|---|---|
| `globals.css` | Xóa toàn bộ, viết lại với design tokens mới + minimal base styles |
| `layout.tsx` | Thêm Geist font, wrap children trong sidebar layout |
| `NavBar.tsx` | Xóa |
| `Sidebar.tsx` | Tạo mới |
| `BottomNav.tsx` | Tạo mới |
| `Header.tsx` | Rewrite với hero design mới |
| `GoldView.tsx` | Cập nhật layout, dùng Skeleton |
| `ApartmentView.tsx` | Cập nhật layout, dùng Skeleton |
| `PriceChart.tsx` | Cập nhật màu chart options |
| `ApartmentChart.tsx` | Cập nhật màu chart options |
| `StatsBar.tsx` | Rewrite với Tailwind |
| `ApartmentStatsBar.tsx` | Rewrite với Tailwind |
| `PriceTable.tsx` | Rewrite với Tailwind |
| `ApartmentPriceTable.tsx` | Rewrite với Tailwind |
| `TimeRangeSelector.tsx` | Rewrite underline tab style |
| `AreaSelector.tsx` | Rewrite underline tab style |
| `ApartmentListings.tsx` | Rewrite accordion style |

---

## Out of Scope

- Không thêm dark mode toggle
- Không thay đổi API routes hay data logic
- Không thêm animation phức tạp (chỉ Tailwind transitions đơn giản)
- Không thêm shadcn/ui hay dependency mới
