import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { LogForm } from "../LogForm";

describe("LogForm", () => {
  let mockOnSubmit: ReturnType<typeof vi.fn<(content: string) => Promise<void>>>;

  beforeEach(() => {
    mockOnSubmit = vi.fn<(content: string) => Promise<void>>(async () => {});
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("renders a form with textarea and submit button", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      expect(screen.getByRole("textbox", { name: "Novo registro" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
    });

    it("textarea has correct placeholder", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      expect(textarea).toHaveAttribute("placeholder", "O que aconteceu hoje?");
    });

    it("textarea has maxLength of 2000", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      expect(textarea).toHaveAttribute("maxLength", "2000");
    });

    it("initially has empty textarea", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" }) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("does not render error initially", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Validation — Empty/Whitespace", () => {
    it("shows error when submitting empty content", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const button = screen.getByRole("button", { name: "Registrar" });
      
      fireEvent.click(button);
      
      expect(screen.getByRole("alert")).toHaveTextContent("O registro não pode ser vazio.");
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("shows error when submitting only whitespace", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      fireEvent.change(textarea, { target: { value: "   \t\n  " } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      expect(screen.getByRole("alert")).toHaveTextContent("O registro não pode ser vazio.");
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("does not call onSubmit when content is whitespace", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      fireEvent.change(textarea, { target: { value: "   " } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Validation — Max Length", () => {
    it("shows error when content exceeds 2000 characters", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      // Create a string with 2001 characters
      const longContent = "a".repeat(2001);
      fireEvent.change(textarea, { target: { value: longContent } });
      
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      expect(screen.getByRole("alert")).toHaveTextContent(
        "O registro deve ter no máximo 2000 caracteres."
      );
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Valid Submission", () => {
    it("calls onSubmit with trimmed content on valid submission", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      fireEvent.change(textarea, { target: { value: "  Test log content  " } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("Test log content");
      });
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("clears textarea after successful submission", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" }) as HTMLTextAreaElement;
      
      fireEvent.change(textarea, { target: { value: "Test content" } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(textarea.value).toBe("");
      });
    });

    it("clears error message after successful submission", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      // First, trigger an error
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      expect(screen.getByRole("alert")).toBeInTheDocument();
      
      // Then, fill with valid content
      fireEvent.change(textarea, { target: { value: "Valid content" } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("accepts content with exactly 1 character", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      fireEvent.change(textarea, { target: { value: "a" } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("a");
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("accepts content with exactly 2000 characters", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      const content2000 = "a".repeat(2000);
      fireEvent.change(textarea, { target: { value: content2000 } });
      
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(content2000);
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Form Updates", () => {
    it("updates textarea value as user types", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" }) as HTMLTextAreaElement;
      
      fireEvent.change(textarea, { target: { value: "Hello world" } });
      expect(textarea.value).toBe("Hello world");
    });

    it("handles multiline input", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      
      fireEvent.change(textarea, { target: { value: "Line 1\nLine 2" } });
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("Line 1\nLine 2");
      });
    });
  });

  describe("Form Submission Prevention", () => {
    it("prevents default form submission", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      const form = textarea.closest("form")!;
      
      const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");
      
      await act(async () => {
        form.dispatchEvent(submitEvent);
      });
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("textarea has aria-label 'Novo registro'", () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      const textarea = screen.getByRole("textbox", { name: "Novo registro" });
      expect(textarea).toHaveAttribute("aria-label", "Novo registro");
    });

    it("error message has role='alert' for screen readers", async () => {
      render(<LogForm onSubmit={mockOnSubmit} />);
      
      fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
      
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("role", "alert");
    });
  });
});

// ─── Property-Based Tests ────────────────────────────────────────────────────
import fc from "fast-check";

describe("LogForm — Property-Based Tests", () => {
  // Feature: daily-log-system, Property 1: content boundary validation
  // **Validates: Requirements 2.2, 2.5, 3.3, 3.4, 8.1, 8.2, 8.3**
  it("accepts content of 1–2000 chars that is not just whitespace", () => {
    const mockOnSubmit = vi.fn(async () => {});

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 2000 }).filter((s) => s.trim().length > 0),
        (content) => {
          cleanup();
          const { unmount } = render(<LogForm onSubmit={mockOnSubmit} />);
          const textarea = screen.getByRole("textbox", { name: "Novo registro" });
          
          fireEvent.change(textarea, { target: { value: content } });
          fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
          
          // Should not show error
          expect(screen.queryByRole("alert")).not.toBeInTheDocument();
          // Should have called onSubmit with trimmed content
          expect(mockOnSubmit).toHaveBeenCalledWith(content.trim());
          
          mockOnSubmit.mockClear();
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: daily-log-system, Property 1: content boundary validation (rejection cases)
  // **Validates: Requirements 2.2, 2.5, 3.3, 3.4, 8.1, 8.2, 8.3**
  it("rejects empty or whitespace-only content", () => {
    const mockOnSubmit = vi.fn(async () => {});

    // Test empty string
    const emptyArb = fc.constant("");
    
    fc.assert(
      fc.property(emptyArb, (content) => {
        cleanup();
        const { unmount } = render(<LogForm onSubmit={mockOnSubmit} />);
        
        if (content === "") {
          fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
        }
        
        expect(screen.getByRole("alert")).toHaveTextContent("O registro não pode ser vazio.");
        expect(mockOnSubmit).not.toHaveBeenCalled();
        
        unmount();
      }),
      { numRuns: 10 }
    );

    // Test whitespace-only strings
    const whitespaceArb = fc
      .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 10 })
      .map((arr) => arr.join(""));

    mockOnSubmit.mockClear();

    fc.assert(
      fc.property(whitespaceArb, (content) => {
        cleanup();
        const { unmount } = render(<LogForm onSubmit={mockOnSubmit} />);
        const textarea = screen.getByRole("textbox", { name: "Novo registro" });
        
        fireEvent.change(textarea, { target: { value: content } });
        fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
        
        expect(screen.getByRole("alert")).toHaveTextContent("O registro não pode ser vazio.");
        expect(mockOnSubmit).not.toHaveBeenCalled();
        
        mockOnSubmit.mockClear();
        unmount();
      }),
      { numRuns: 50 }
    );
  });

  // Feature: daily-log-system, Property 1: content exceeding max length
  // **Validates: Requirements 2.2, 3.3, 8.1, 8.2**
  it("rejects content exceeding 2000 characters", () => {
    const mockOnSubmit = vi.fn(async () => {});
    const contentAbove2000Arb = fc
      .string({ minLength: 2001, maxLength: 3000 })
      .filter((s) => s.length > 2000);

    fc.assert(
      fc.property(contentAbove2000Arb, (content) => {
        cleanup();
        const { unmount } = render(<LogForm onSubmit={mockOnSubmit} />);
        const textarea = screen.getByRole("textbox", { name: "Novo registro" });
        
        fireEvent.change(textarea, { target: { value: content } });
        fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
        
        expect(screen.getByRole("alert")).toHaveTextContent(
          "O registro deve ter no máximo 2000 caracteres."
        );
        expect(mockOnSubmit).not.toHaveBeenCalled();
        
        mockOnSubmit.mockClear();
        unmount();
      }),
      { numRuns: 50 }
    );
  });

  // Feature: daily-log-system, Property 1: content with leading/trailing whitespace
  // **Validates: Requirements 2.5**
  it("trims leading and trailing whitespace before submitting", () => {
    const mockOnSubmit = vi.fn(async () => {});
    const contentWithWhitespaceArb = fc
      .tuple(
        fc.array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 5 }).map((arr) => arr.join("")),
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        fc.array(fc.constantFrom(" ", "\t", "\n"), { minLength: 0, maxLength: 5 }).map((arr) => arr.join(""))
      )
      .map(([prefix, content, suffix]) => prefix + content + suffix);

    fc.assert(
      fc.property(contentWithWhitespaceArb, (content) => {
        cleanup();
        const { unmount } = render(<LogForm onSubmit={mockOnSubmit} />);
        const textarea = screen.getByRole("textbox", { name: "Novo registro" });
        
        fireEvent.change(textarea, { target: { value: content } });
        fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
        
        // Should call with trimmed content
        expect(mockOnSubmit).toHaveBeenCalledWith(content.trim());
        
        mockOnSubmit.mockClear();
        unmount();
      }),
      { numRuns: 50 }
    );
  });
});
