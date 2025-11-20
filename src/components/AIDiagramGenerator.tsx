import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  Tabs,
  Tab,
} from "@heroui/react";
import { Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { llmService } from "@/services/api/llmService";
import MermaidDiagram from "./MermaidDiagram";

interface AIDiagramGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // Optional context from the current page/form
  contextTitle?: string;
}

const DIAGRAM_TYPES = [
  { key: "flowchart", label: "Flowchart", description: "Process flows and decision trees" },
  { key: "sequence", label: "Sequence Diagram", description: "Interactions between entities" },
  { key: "gantt", label: "Gantt Chart", description: "Project timelines and schedules" },
  { key: "classDiagram", label: "Class Diagram", description: "System architecture" },
  { key: "stateDiagram", label: "State Diagram", description: "State transitions" },
  { key: "erDiagram", label: "ER Diagram", description: "Database relationships" },
  { key: "journey", label: "User Journey", description: "User experience flows" },
  { key: "mindmap", label: "Mind Map", description: "Hierarchical ideas" },
];

export default function AIDiagramGenerator({
  isOpen,
  onClose,
  context,
  contextTitle,
}: AIDiagramGeneratorProps) {
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("input");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Use dedicated diagram generation endpoint
      const response = await llmService.generateDiagram({
        diagramType,
        prompt,
        context: context
          ? `${contextTitle || "Current page"}: ${context}`
          : "",
      });

      // Check if response is successful
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to generate diagram");
      }

      // Extract Mermaid code from response
      let mermaidCode = response.data.suggestion?.trim() || "";

      // Additional cleaning (n8n workflow already cleans, but double-check)
      mermaidCode = mermaidCode.replace(/```mermaid\n?/g, "").replace(/```\n?/g, "");
      mermaidCode = mermaidCode.trim();

      if (!mermaidCode) {
        throw new Error("Generated diagram is empty");
      }

      setGeneratedCode(mermaidCode);
      setActiveTab("preview");
    } catch (err) {
      console.error("Error generating diagram:", err);
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setGeneratedCode("");
    setError(null);
    setActiveTab("input");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <div dir={language === "ar" ? "rtl" : "ltr"}>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{t("ai.generateDiagram")}</span>
          </div>
          {contextTitle && (
            <p className="text-sm font-normal text-default-500">
              {t("ai.context")}: {contextTitle}
            </p>
          )}
        </ModalHeader>
        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="mb-4"
            classNames={
              language === "ar"
                ? {
                    tabList: "flex-row-reverse",
                  }
                : undefined
            }
          >
            <Tab key="input" title={t("ai.input")}>
              <div className="space-y-4">
                {context && (
                  <Card className="bg-default-50">
                    <CardBody>
                      <p className="text-sm font-medium text-default-700 mb-2">
                        {t("ai.contextInfo")}
                      </p>
                      <p className="text-sm text-default-600 line-clamp-3">{context}</p>
                    </CardBody>
                  </Card>
                )}

                <Select
                  label={t("ai.diagramType")}
                  selectedKeys={new Set([diagramType])}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) setDiagramType(selected as string);
                  }}
                  disallowEmptySelection
                >
                  {DIAGRAM_TYPES.map((type) => (
                    <SelectItem key={type.key} textValue={type.label}>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-default-500">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Textarea
                  label={t("ai.diagramPrompt")}
                  placeholder={t("ai.diagramPromptPlaceholder")}
                  value={prompt}
                  onValueChange={setPrompt}
                  onKeyDown={handleKeyDown}
                  minRows={4}
                  maxRows={8}
                  description={
                    language === "ar"
                      ? "اضغط Enter للإنشاء، Shift+Enter للسطر الجديد"
                      : "Press Enter to generate, Shift+Enter for new line"
                  }
                />

                {error && (
                  <Card className="bg-danger-50 border-danger-200">
                    <CardBody>
                      <p className="text-sm text-danger-700">{error}</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab key="preview" title={t("ai.preview")} isDisabled={!generatedCode}>
              <div className="space-y-4">
                {generatedCode ? (
                  <MermaidDiagram chart={generatedCode} showControls={true} />
                ) : (
                  <Card>
                    <CardBody>
                      <p className="text-center text-default-500">
                        {t("ai.noGeneratedDiagram")}
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab key="code" title={t("ai.code")} isDisabled={!generatedCode}>
              <Card>
                <CardBody>
                  <pre className="text-sm bg-default-100 p-4 rounded-lg overflow-x-auto">
                    <code>{generatedCode || t("ai.noGeneratedCode")}</code>
                  </pre>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {t("common.cancel")}
          </Button>
          {activeTab === "input" && (
            <Button
              color="primary"
              onPress={handleGenerate}
              isDisabled={!prompt.trim() || isGenerating}
              startContent={
                isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isGenerating ? t("ai.generating") : t("ai.generate")}
            </Button>
          )}
        </ModalFooter>
        </div>
      </ModalContent>
    </Modal>
  );
}
