import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BottomNav from "@/components/BottomNav";

describe("BottomNav", () => {
  it("renders Gold and Apartment tabs", () => {
    render(<BottomNav active="gold" onChange={vi.fn()} />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("calls onChange when tab clicked", () => {
    const onChange = vi.fn();
    render(<BottomNav active="gold" onChange={onChange} />);
    fireEvent.click(screen.getByText("Apartment"));
    expect(onChange).toHaveBeenCalledWith("apartment");
  });
});
