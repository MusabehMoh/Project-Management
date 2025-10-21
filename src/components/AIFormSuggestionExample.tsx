import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Input,
  Select,
  SelectItem,
  Tooltip,
  Chip,
} from "@heroui/react";
import { Sparkles } from "lucide-react";

import { useFormSuggestion } from "@/hooks";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIFormSuggestionExampleProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Example component demonstrating AI-powered form field suggestions
 * This can be adapted for any form in your application
 */
export default function AIFormSuggestionExample({
  isOpen,
  onClose,
}: AIFormSuggestionExampleProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    taskTitle: "",
    taskDescription: "",
    priority: "",
    estimatedHours: "",
  });

  // AI suggestion for task description
  const {
    suggestion: descriptionSuggestion,
    loading: descriptionLoading,
    error: descriptionError,
    isLLMAvailable,
    getSuggestion: getDescriptionSuggestion,
    clearSuggestion: clearDescriptionSuggestion,
  } = useFormSuggestion({
    field: "Task Description",
    context: `Task: ${formData.taskTitle || "New task"}. Priority: ${formData.priority || "Not set"}.`,
    previousValues: {
      title: formData.taskTitle,
      priority: formData.priority,
    },
  });

  const handleApplySuggestion = () => {
    if (descriptionSuggestion) {
      setFormData({ ...formData, taskDescription: descriptionSuggestion });
      clearDescriptionSuggestion();
    }
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span>AI-Powered Form Example</span>
            {isLLMAvailable && (
              <Chip color="success" size="sm" variant="flat">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Ready</span>
                </div>
              </Chip>
            )}
          </div>
          <p className="text-sm text-default-500 font-normal">
            Try the AI suggestion feature below
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Task Title */}
            <Input
              label="Task Title"
              placeholder="Enter task title"
              value={formData.taskTitle}
              onChange={(e) =>
                setFormData({ ...formData, taskTitle: e.target.value })
              }
            />

            {/* Priority */}
            <Select
              label="Priority"
              placeholder="Select priority"
              selectedKeys={formData.priority ? [formData.priority] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;

                setFormData({ ...formData, priority: selectedKey });
              }}
            >
              <SelectItem key="Low">Low</SelectItem>
              <SelectItem key="Medium">Medium</SelectItem>
              <SelectItem key="High">High</SelectItem>
            </Select>

            {/* Task Description with AI Suggestion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-default-700">
                  Task Description
                </label>
                <Tooltip
                  content={
                    !isLLMAvailable
                      ? "AI service not available"
                      : "Generate description using AI"
                  }
                >
                  <Button
                    color="secondary"
                    isDisabled={!isLLMAvailable || !formData.taskTitle}
                    isLoading={descriptionLoading}
                    size="sm"
                    startContent={<Sparkles className="w-4 h-4" />}
                    variant="flat"
                    onPress={getDescriptionSuggestion}
                  >
                    AI Suggest
                  </Button>
                </Tooltip>
              </div>

              <Textarea
                minRows={4}
                placeholder="Enter task description"
                value={formData.taskDescription}
                onChange={(e) =>
                  setFormData({ ...formData, taskDescription: e.target.value })
                }
              />

              {/* AI Suggestion Display */}
              {descriptionSuggestion && (
                <div className="p-3 bg-secondary-50 dark:bg-secondary-100/10 rounded-lg border-l-4 border-secondary">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium text-secondary">
                          AI Suggestion
                        </span>
                      </div>
                      <p className="text-sm text-default-600">
                        {descriptionSuggestion}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip content="Apply suggestion">
                        <Button
                          color="secondary"
                          size="sm"
                          variant="flat"
                          onPress={handleApplySuggestion}
                        >
                          Apply
                        </Button>
                      </Tooltip>
                      <Tooltip content="Clear suggestion">
                        <Button
                          size="sm"
                          variant="light"
                          onPress={clearDescriptionSuggestion}
                        >
                          ✕
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {descriptionError && (
                <div className="text-sm text-danger flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{descriptionError}</span>
                </div>
              )}
            </div>

            {/* Estimated Hours */}
            <Input
              label="Estimated Hours"
              placeholder="Enter estimated hours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) =>
                setFormData({ ...formData, estimatedHours: e.target.value })
              }
            />

            {/* LLM Status Info */}
            {!isLLMAvailable && (
              <div className="p-3 bg-warning-50 dark:bg-warning-100/10 rounded-lg">
                <p className="text-sm text-warning-700 dark:text-warning-500">
                  💡 AI suggestions are currently unavailable. Make sure Ollama
                  is running with: <code className="px-1">ollama serve</code>
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            Save Task
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
