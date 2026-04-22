import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TimeRangeSelector from "@/components/TimeRangeSelector";

describe("TimeRangeSelector", () => {
  it("renders all range buttons", () => {
    render(<TimeRangeSelector selected="1m" onChange={vi.fn()} />);
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("6M")).toBeInTheDocument();
  });

  it("active button has border-b-2 class", () => {
    render(<TimeRangeSelector selected="3m" onChange={vi.fn()} />);
    const active = screen.getByText("3M");
    expect(active.className).toMatch(/border-b-2/);
  });

  it("calls onChange with correct value on click", () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector selected="1m" onChange={onChange} />);
    fireEvent.click(screen.getByText("6M"));
    expect(onChange).toHaveBeenCalledWith("6m");
  });
});
