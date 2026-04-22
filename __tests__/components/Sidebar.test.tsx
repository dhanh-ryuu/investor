import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Sidebar from "@/components/Sidebar";

describe("Sidebar", () => {
  it("renders Gold and Apartment nav items", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("active item has white text class", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    const goldBtn = screen.getByText("Gold").closest("button")!;
    expect(goldBtn.className).toMatch(/text-white/);
  });

  it("inactive item does not have white text", () => {
    render(<Sidebar active="gold" onChange={vi.fn()} />);
    const aptBtn = screen.getByText("Apartment").closest("button")!;
    expect(aptBtn.className).not.toMatch(/text-white /);
  });

  it("calls onChange when nav item clicked", () => {
    const onChange = vi.fn();
    render(<Sidebar active="gold" onChange={onChange} />);
    fireEvent.click(screen.getByText("Apartment"));
    expect(onChange).toHaveBeenCalledWith("apartment");
  });
});
