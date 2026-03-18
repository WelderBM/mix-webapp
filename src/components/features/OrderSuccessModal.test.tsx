// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderSuccessModal } from "./OrderSuccessModal";

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
}));

// Mock Dialog component
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  CheckCircle2: () => <span>CheckCircle2</span>,
  MessageCircle: () => <span>MessageCircle</span>,
}));

describe("OrderSuccessModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <OrderSuccessModal isOpen={false} onClose={vi.fn()} />
    );
    // When Dialog is closed, it should render nothing visible
    expect(container.textContent).toBe("");
  });

  it("renders when isOpen is true", () => {
    render(<OrderSuccessModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Pedido Enviado!")).toBeInTheDocument();
  });

  it("shows success message when isOpen is true", () => {
    render(<OrderSuccessModal isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/Muito obrigado por comprar conosco/i)
    ).toBeInTheDocument();
  });

  it("shows WhatsApp group link button", () => {
    render(<OrderSuccessModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Entrar no Grupo")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<OrderSuccessModal isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByText("Fechar");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders QR code for WhatsApp group", () => {
    render(<OrderSuccessModal isOpen={true} onClose={vi.fn()} />);
    const qrCodeImage = screen.getByAltText("QR Code Grupo WhatsApp");
    expect(qrCodeImage).toBeInTheDocument();
    expect(qrCodeImage.getAttribute("src")).toContain("qrserver");
  });

  it("displays VIP group invitation section", () => {
    render(<OrderSuccessModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Entre para nosso Grupo VIP")).toBeInTheDocument();
    expect(
      screen.getByText(/Fique por dentro de todas as novidades/i)
    ).toBeInTheDocument();
  });
});
