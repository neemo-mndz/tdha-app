import { fireEvent, render, screen } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import { AppMenu } from "../AppMenu";
vi.mock("next/navigation", () => ({ usePathname: () => "/agenda" }));
vi.mock("@/components/auth/LogoutButton", () => ({ LogoutButton: () => <button>Sair</button> }));
it("reúne as funções e permite fechar com Escape e clique externo", () => {
  render(<AppMenu />);
  const trigger = screen.getByRole("button", { name: "Abrir menu" });
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  fireEvent.click(trigger);
  expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Acompanhamento de leitura" })).toHaveAttribute("href", "/reading");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});
it("fecha o menu quando uma função é escolhida", () => {
  render(<AppMenu />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
  fireEvent.click(screen.getByRole("link", { name: "Agenda" }));
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});
