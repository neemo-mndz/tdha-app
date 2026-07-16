import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function createRequest(pathname: string, hasCookie: boolean) {
  const url = new URL(pathname, "http://localhost:3000");
  const request = new NextRequest(url);
  if (hasCookie) {
    request.cookies.set("session_id", "fake-session-id");
  }
  return request;
}

describe("middleware", () => {
  describe("rotas protegidas sem cookie → redirect para /login", () => {
    it("redireciona / para /login quando não há cookie", () => {
      const request = createRequest("/", false);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redireciona /day/2024-01-15 para /login quando não há cookie", () => {
      const request = createRequest("/day/2024-01-15", false);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redireciona /settings para /login quando não há cookie", () => {
      const request = createRequest("/settings", false);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });

    it("redireciona /week/2024-01-15 para /login quando não há cookie", () => {
      const request = createRequest("/week/2024-01-15", false);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe(
        "/login"
      );
    });
  });

  describe("rotas públicas com cookie → redirect para /", () => {
    it("redireciona /login para / quando há cookie", () => {
      const request = createRequest("/login", true);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe("/");
    });

    it("redireciona /register para / quando há cookie", () => {
      const request = createRequest("/register", true);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe("/");
    });

    it("redireciona /login/callback para / quando há cookie (startsWith)", () => {
      const request = createRequest("/login/callback", true);
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe("/");
    });
  });

  describe("rotas públicas sem cookie → permite acesso (next)", () => {
    it("permite acesso a /login sem cookie", () => {
      const request = createRequest("/login", false);
      const response = middleware(request);
      expect(response.status).toBe(200);
    });

    it("permite acesso a /register sem cookie", () => {
      const request = createRequest("/register", false);
      const response = middleware(request);
      expect(response.status).toBe(200);
    });
  });

  describe("rotas protegidas com cookie → permite acesso (next)", () => {
    it("permite acesso a / com cookie", () => {
      const request = createRequest("/", true);
      const response = middleware(request);
      expect(response.status).toBe(200);
    });

    it("permite acesso a /day/2024-01-15 com cookie", () => {
      const request = createRequest("/day/2024-01-15", true);
      const response = middleware(request);
      expect(response.status).toBe(200);
    });

    it("permite acesso a /settings com cookie", () => {
      const request = createRequest("/settings", true);
      const response = middleware(request);
      expect(response.status).toBe(200);
    });
  });
});
