import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BasisEncoder } from "./BasisEncoder.jsx";
import { basisEncoderParams } from "./BasisEncoder.fixtures.js";

test("opens already showing the worked example from the surrounding prose (6 -> |110>)", () => {
  render(<BasisEncoder params={basisEncoderParams} />);

  expect(screen.getByText(basisEncoderParams.caption)).toBeInTheDocument();
  expect(screen.getByLabelText("Number to encode")).toHaveValue(6);
  expect(screen.getByRole("status")).toHaveTextContent(
    "6 in binary is 110 — the basis-encoded state is |110⟩"
  );
  expect(screen.getByRole("img", { name: /ket 110/ })).toBeInTheDocument();
});

test("renders one qubit box per bit, each showing its own |0> or |1>", () => {
  render(<BasisEncoder params={basisEncoderParams} />);

  expect(screen.getByText("Q0")).toBeInTheDocument();
  expect(screen.getByText("Q1")).toBeInTheDocument();
  expect(screen.getByText("Q2")).toBeInTheDocument();
  const values = screen.getAllByText(/^\|[01]⟩$/).map((node) => node.textContent);
  expect(values).toEqual(["|1⟩", "|1⟩", "|0⟩"]);
});

test("typing a different number updates the binary readout live", async () => {
  const user = userEvent.setup();
  render(<BasisEncoder params={basisEncoderParams} />);

  const input = screen.getByLabelText("Number to encode");
  await user.clear(input);
  await user.type(input, "3");

  expect(screen.getByRole("status")).toHaveTextContent(
    "3 in binary is 011 — the basis-encoded state is |011⟩"
  );
});

test("clamps to the qubit count's real range instead of accepting an out-of-range number", async () => {
  const user = userEvent.setup();
  render(<BasisEncoder params={basisEncoderParams} />);

  const input = screen.getByLabelText("Number to encode");
  await user.clear(input);
  await user.type(input, "99");

  // 3 qubits max out at 7 (111) -- 99 has no valid 3-bit encoding.
  expect(screen.getByRole("status")).toHaveTextContent(
    "7 in binary is 111 — the basis-encoded state is |111⟩"
  );
});
