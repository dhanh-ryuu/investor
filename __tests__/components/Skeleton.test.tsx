import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Skeleton from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders a div with animate-pulse", () => {
    const { container } = render(<Skeleton className="h-10 w-48" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/animate-pulse/);
  });

  it("applies additional className", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/h-4/);
    expect(el.className).toMatch(/w-24/);
  });
});
