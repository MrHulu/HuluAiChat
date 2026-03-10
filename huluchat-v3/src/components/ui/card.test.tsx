import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

describe("Card", () => {
  describe("Card", () => {
    it("should render card with children", () => {
      render(<Card>Card Content</Card>);

      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("rounded-xl");
      expect(card.className).toContain("border");
      expect(card.className).toContain("bg-card");
    });

    it("should apply custom className", () => {
      render(<Card className="custom-class">Card</Card>);

      expect(screen.getByText("Card")).toHaveClass("custom-class");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Card</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should have transition classes", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("transition-all");
      expect(card.className).toContain("duration-200");
    });

    it("should have hover shadow classes", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("hover:shadow-md");
    });

    it("should have dark mode classes", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card.className).toContain("dark:border-white/10");
      expect(card.className).toContain("dark:shadow-lg");
    });
  });

  describe("CardHeader", () => {
    it("should render header with children", () => {
      render(<CardHeader>Header Content</CardHeader>);

      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);

      const header = screen.getByTestId("card-header");
      expect(header.className).toContain("flex");
      expect(header.className).toContain("flex-col");
      expect(header.className).toContain("p-6");
    });

    it("should apply custom className", () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);

      expect(screen.getByText("Header")).toHaveClass("custom-header");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<CardHeader ref={ref}>Header</CardHeader>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardTitle", () => {
    it("should render title with children", () => {
      render(<CardTitle>Card Title</CardTitle>);

      expect(screen.getByText("Card Title")).toBeInTheDocument();
    });

    it("should render as h3 element", () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(<CardTitle data-testid="card-title">Title</CardTitle>);

      const title = screen.getByTestId("card-title");
      expect(title.className).toContain("font-semibold");
      expect(title.className).toContain("leading-none");
    });

    it("should apply custom className", () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);

      expect(screen.getByText("Title")).toHaveClass("custom-title");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLHeadingElement | null };
      render(<CardTitle ref={ref}>Title</CardTitle>);

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe("CardDescription", () => {
    it("should render description with children", () => {
      render(<CardDescription>Card Description</CardDescription>);

      expect(screen.getByText("Card Description")).toBeInTheDocument();
    });

    it("should render as p element", () => {
      render(<CardDescription>Description</CardDescription>);

      const description = screen.getByText("Description");
      expect(description.tagName).toBe("P");
    });

    it("should apply default classes", () => {
      render(<CardDescription data-testid="card-desc">Description</CardDescription>);

      const desc = screen.getByTestId("card-desc");
      expect(desc.className).toContain("text-sm");
      expect(desc.className).toContain("text-muted-foreground");
    });

    it("should apply custom className", () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);

      expect(screen.getByText("Description")).toHaveClass("custom-desc");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLParagraphElement | null };
      render(<CardDescription ref={ref}>Description</CardDescription>);

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe("CardContent", () => {
    it("should render content with children", () => {
      render(<CardContent>Card Content</CardContent>);

      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);

      const content = screen.getByTestId("card-content");
      expect(content.className).toContain("p-6");
      expect(content.className).toContain("pt-0");
    });

    it("should apply custom className", () => {
      render(<CardContent className="custom-content">Content</CardContent>);

      expect(screen.getByText("Content")).toHaveClass("custom-content");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<CardContent ref={ref}>Content</CardContent>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardFooter", () => {
    it("should render footer with children", () => {
      render(<CardFooter>Footer Content</CardFooter>);

      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("should apply default classes", () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);

      const footer = screen.getByTestId("card-footer");
      expect(footer.className).toContain("flex");
      expect(footer.className).toContain("items-center");
      expect(footer.className).toContain("p-6");
      expect(footer.className).toContain("pt-0");
    });

    it("should apply custom className", () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);

      expect(screen.getByText("Footer")).toHaveClass("custom-footer");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<CardFooter ref={ref}>Footer</CardFooter>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Full Card Composition", () => {
    it("should render a complete card with all parts", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
          <CardFooter>
            <span>Test Footer</span>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("Test Footer")).toBeInTheDocument();
    });

    it("should have proper hierarchy", () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId("card");
      const header = screen.getByTestId("header");
      const content = screen.getByTestId("content");
      const footer = screen.getByTestId("footer");

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
    });
  });

  describe("Accessibility", () => {
    it("Card should be a section landmark when role is set", () => {
      render(<Card role="region" aria-label="Featured">Card</Card>);

      const card = screen.getByRole("region", { name: "Featured" });
      expect(card).toBeInTheDocument();
    });

    it("CardTitle should be accessible as heading", () => {
      render(<CardTitle>Accessible Title</CardTitle>);

      expect(screen.getByRole("heading", { name: "Accessible Title" })).toBeInTheDocument();
    });
  });

  describe("Display Names", () => {
    it("Card should have displayName", () => {
      expect(Card.displayName).toBe("Card");
    });

    it("CardHeader should have displayName", () => {
      expect(CardHeader.displayName).toBe("CardHeader");
    });

    it("CardTitle should have displayName", () => {
      expect(CardTitle.displayName).toBe("CardTitle");
    });

    it("CardDescription should have displayName", () => {
      expect(CardDescription.displayName).toBe("CardDescription");
    });

    it("CardContent should have displayName", () => {
      expect(CardContent.displayName).toBe("CardContent");
    });

    it("CardFooter should have displayName", () => {
      expect(CardFooter.displayName).toBe("CardFooter");
    });
  });
});
