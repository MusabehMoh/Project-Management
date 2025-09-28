/**
 * Utility functions for testing file preview functionality
 */

import { useFilePreview } from "@/hooks/useFilePreview";

// Mock data for testing
export const mockAttachments = [
  {
    id: 1,
    originalName: "sample-document.pdf",
    fileSize: 1024 * 500, // 500KB
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 2,
    originalName: "image-sample.jpg",
    fileSize: 1024 * 200, // 200KB
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 3,
    originalName: "spreadsheet.xlsx",
    fileSize: 1024 * 100, // 100KB
    uploadedAt: new Date().toISOString(),
  },
];

/**
 * Test hook usage for file preview
 */
export function TestFilePreviewComponent() {
  const { previewState, previewFile, closePreview, getFileType } = useFilePreview();

  const testPreview = (filename: string) => {
    const type = getFileType(filename);
    console.log(`File type for ${filename}: ${type}`);
    
    if (type === "download") {
      console.log(`${filename} will trigger direct download`);
    } else {
      console.log(`${filename} will open in preview modal`);
      // For testing, create a mock URL
      const mockUrl = `data:text/plain;base64,${btoa(`Mock content for ${filename}`)}`;
      previewFile(filename, mockUrl, 1024);
    }
  };

  return {
    testPreview,
    previewState,
    closePreview,
    getFileType,
  };
}

/**
 * Test file type detection
 */
export function testFileTypes() {
  const testFiles = [
    "document.pdf",
    "image.jpg",
    "photo.png", 
    "spreadsheet.xlsx",
    "presentation.pptx",
    "archive.zip",
    "text.txt"
  ];

  console.log("File type detection tests:");
  testFiles.forEach(file => {
    const { getFileType } = useFilePreview();
    const type = getFileType(file);
    console.log(`${file} -> ${type}`);
  });
}