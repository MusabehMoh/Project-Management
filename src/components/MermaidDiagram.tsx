import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { Download, Copy, Check } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
  showControls?: boolean;
}

// Initialize mermaid with custom theme
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#0070f0",
    primaryTextColor: "#fff",
    primaryBorderColor: "#0070f0",
    lineColor: "#6b7280",
    secondaryColor: "#f3f4f6",
    tertiaryColor: "#e5e7eb",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
});

export default function MermaidDiagram({
  chart,
  title,
  className = "",
  showControls = true,
}: MermaidDiagramProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart || !mermaidRef.current) return;

      setIsRendering(true);
      setError(null);

      try {
        // Clear previous content
        mermaidRef.current.innerHTML = "";

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);

        // Insert the SVG into the DOM
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = renderedSvg;
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [chart]);

  const handleDownloadSVG = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "diagram"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!mermaidRef.current) return;

    // Get the SVG element
    const svgElement = mermaidRef.current.querySelector("svg");
    if (!svgElement) return;

    try {
      // Clone the SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Get dimensions
      const bbox = svgElement.getBoundingClientRect();
      const width = bbox.width;
      const height = bbox.height;

      // Ensure SVG has proper attributes
      clonedSvg.setAttribute("width", width.toString());
      clonedSvg.setAttribute("height", height.toString());
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Serialize SVG to string
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      
      // Encode as base64 data URL
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) return;

      const scale = 2; // 2x for quality
      canvas.width = width * scale;
      canvas.height = height * scale;

      // Create and load image
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Scale and draw white background
            ctx.scale(scale, scale);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob");
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || "diagram"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png", 0.95);

    } catch (err) {
      console.error("Failed to convert SVG to PNG:", err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card className={className}>
      {(title || showControls) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {showControls && svg && !error && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                startContent={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                onPress={handleCopyCode}
              >
                {copied ? "Copied!" : "Copy Code"}
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleDownloadPNG}
              >
                Download PNG
              </Button>
              <Button
                size="sm"
                variant="flat"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleDownloadSVG}
              >
                Download SVG
              </Button>
            </div>
          )}
        </div>
      )}
      <CardBody>
        {isRendering && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" label="Rendering diagram..." />
          </div>
        )}
        {error && (
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-700 font-medium">Failed to render diagram</p>
            <p className="text-xs text-danger-600 mt-1">{error}</p>
          </div>
        )}
        <div
          ref={mermaidRef}
          className={`mermaid-container ${isRendering || error ? "hidden" : ""}`}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        />
      </CardBody>
    </Card>
  );
}
