# Dark Pro Redesign — Design Spec

## Goal

Chuyển toàn bộ UI từ light theme sang dark theme ("Dark Pro") với accent color violet (`#a78bfa`), giữ nguyên layout và cấu trúc component hiện tại.

## Architecture

Thay đổi tập trung vào CSS tokens trong `globals.css`. Vì tất cả component đã dùng `var(--xxx)`, phần lớn thay đổi visual tự áp dụng chỉ từ việc đổi token. Một số component có hardcode màu Tailwind cứng (`bg-green-50`, `#0a0a0a` trong BottomNav, v.v.) cần sửa thêm. Chart cần cập nhật màu riêng vì dùng Chart.js object.

## Tech Stack

Next.js App Router, Tailwind v4, Chart.js, CSS custom properties.

---

## 1. Color Tokens (`src/app/globals.css`)

Thay toàn bộ `:root` block:

```css
:root {
  --bg: #0d0d0d;
  --bg-subtle: #141414;
  --sidebar-bg: #0d0d0d;
  --text: #e5e5e5;
  --text-secondary: #888888;
  --text-muted: #444444;
  --border: #1f1f1f;
  --green: #4ade80;
  --red: #f87171;
  --accent: #a78bfa;
  --radius: 8px;
}
```

Không thêm dark mode media query — app là dark-only.

---

## 2. Sidebar (`src/components/Sidebar.tsx`)

**Thay đổi:**
- `<aside>` classname: bỏ `bg-[#0a0a0a]`, thêm `bg-[var(--sidebar-bg)] border-r border-[var(--border)]`
- Nav item active: bỏ `border-l-2 border-white`, thêm accent dot violet
- Nav item inactive: giữ `text-neutral-400 hover:text-neutral-100 hover:bg-white/5`

**Active nav item mới:**
```tsx
isActive
  ? "bg-white/5 text-white"
  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
```

Thêm dot indicator cho active state:
```tsx
{isActive && (
  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
)}
```

---

## 3. Chart (`src/components/PriceChart.tsx`)

Cập nhật object config Chart.js:

| Property | Giá trị cũ | Giá trị mới |
|---|---|---|
| Buy line color | `#0a0a0a` | `#a78bfa` |
| Buy fill (area) | không có | `rgba(167,139,250,0.08)` |
| Sell line color | `#737373` | `#3f3f46` |
| MA7 dasharray | `[4,4]`, color `rgba(10,10,10,0.25)` | `[4,4]`, color `rgba(167,139,250,0.3)` |
| MA30 dasharray | `[6,4]`, color `rgba(10,10,10,0.12)` | `[6,4]`, color `rgba(167,139,250,0.15)` |
| Tooltip bg | `#ffffff` | `#141414` |
| Tooltip border | `#e5e5e5` | `#2a2a2a` |
| Tooltip title color | `#0a0a0a` | `#e5e5e5` |
| Tooltip body color | `#525252` | `#888888` |
| Grid color | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.04)` |
| Tick color | `#a3a3a3` | `#444444` |

Fill: enable `fill: true` trên buy dataset, dùng `backgroundColor: "rgba(167,139,250,0.08)"`.

---

## 4. Header badge (`src/components/Header.tsx`)

Xóa các class hardcode Tailwind light-only:
- `bg-green-50` → `bg-[var(--green)]/10`
- `bg-red-50` → `bg-[var(--red)]/10`

```tsx
isUp
  ? "bg-[rgba(248,113,113,0.1)] text-[var(--red)]"
  : isDown
  ? "bg-[rgba(74,222,128,0.1)] text-[var(--green)]"
  : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
```

Dùng rgba explicit thay vì `/10` modifier vì Tailwind v4 không generate opacity modifier với CSS variable hex.

---

## 5. Price Table (`src/components/PriceTable.tsx`)

Header border: đổi từ `border-[var(--text)]` (sẽ thành `#e5e5e5` trên dark = quá sáng) → `border-[var(--border)]`.

```tsx
// trước
"border-b border-[var(--text)]"
// sau
"border-b-2 border-[var(--text-secondary)]"
```

Dùng `border-b-2 border-[var(--text-secondary)]` (`#888`) để vẫn có đường phân cách rõ hơn border thường nhưng không chói.

---

## 6. Bottom Nav (`src/components/BottomNav.tsx`)

Thay hardcode sang token:
- `bg-[#0a0a0a]` → `bg-[var(--sidebar-bg)]`
- `border-neutral-800` → `border-[var(--border)]`

---

## 7. Skeleton (`src/components/Skeleton.tsx`)

Không đổi code — token `--bg-subtle` đã được cập nhật thành `#141414`, skeleton tự hiển thị đúng.

---

## 7. Apartment Chart (`src/components/ApartmentChart.tsx`)

Đổi `BEDROOM_COLORS` và `AREA_COLORS` sang violet shades phân biệt rõ trên nền tối:

```ts
const BEDROOM_COLORS: Record<string, string> = {
  "1pn": "#a78bfa",   // violet chính
  "2pn": "#c4b5fd",   // violet nhạt
  "3pn": "#7c3aed",   // violet đậm
};

const AREA_COLORS: Record<string, string> = {
  ocean_park_1: "#a78bfa",
  ocean_park_2: "#c4b5fd",
  ocean_park_3: "#7c3aed",
};
```

Chart.js options: cùng giá trị với PriceChart — tooltip dark, grid dark, ticks muted.

```ts
legend: { labels: { color: "#444444" } },
tooltip: {
  backgroundColor: "#141414",
  titleColor: "#e5e5e5",
  bodyColor: "#888888",
  borderColor: "#2a2a2a",
  borderWidth: 1,
},
scales: {
  x: { ticks: { color: "#444444" }, grid: { color: "rgba(255,255,255,0.04)" } },
  y: { ticks: { color: "#444444" }, grid: { color: "rgba(255,255,255,0.04)" } },
},
```

---

## Files thay đổi

| File | Loại thay đổi |
|---|---|
| `src/app/globals.css` | Đổi toàn bộ color tokens |
| `src/components/Sidebar.tsx` | Bỏ hardcode bg, thêm accent dot |
| `src/components/PriceChart.tsx` | Cập nhật Chart.js color config |
| `src/components/Header.tsx` | Fix badge background classes |
| `src/components/PriceTable.tsx` | Fix thead border |
| `src/components/BottomNav.tsx` | Bỏ hardcode bg và border |
| `src/components/ApartmentChart.tsx` | Đổi line colors + Chart.js config |

**Không thay đổi:** `StatsBar.tsx`, `TimeRangeSelector.tsx`, `ApartmentListings.tsx`, `ApartmentStatsBar.tsx`, `ApartmentPriceTable.tsx`, `GoldView.tsx`, `ApartmentView.tsx`, `page.tsx`, `layout.tsx`.

---

## Testing

Sau khi implement, kiểm tra thủ công:
- Giá vàng hiển thị đầy đủ (header, chart, stats, table)
- Badge tăng/giảm đúng màu
- Chart line màu violet, tooltip dark
- Sidebar active state có dot violet
- Mobile: bottom nav dark, không bị white flash
- Apartment view: accordion, chart, table đều dark
