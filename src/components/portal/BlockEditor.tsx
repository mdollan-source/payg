"use client";

import { useState } from "react";
import type { PageBlock } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface BlockEditorProps {
  block: PageBlock;
  pageId: string;
  index: number;
}

// Define which fields are editable (safe) vs locked (managed)
const BLOCK_FIELD_CONFIG: Record<string, {
  safe: string[];
  locked: string[];
  labels: Record<string, string>;
}> = {
  hero: {
    safe: ["headline", "subheadline", "ctaText"],
    locked: ["ctaLink", "imageUrl"],
    labels: {
      headline: "Headline",
      subheadline: "Subheadline",
      ctaText: "Button Text",
      ctaLink: "Button Link",
      imageUrl: "Background Image",
    },
  },
  services_grid: {
    safe: ["title"],
    locked: ["services"],
    labels: {
      title: "Section Title",
      services: "Services List",
    },
  },
  about_split: {
    safe: ["title", "content"],
    locked: ["imageUrl", "imagePosition"],
    labels: {
      title: "Title",
      content: "Content",
      imageUrl: "Image",
      imagePosition: "Image Position",
    },
  },
  testimonial_list: {
    safe: ["title"],
    locked: ["testimonials"],
    labels: {
      title: "Section Title",
      testimonials: "Testimonials",
    },
  },
  faq_accordion: {
    safe: ["title"],
    locked: ["faqs"],
    labels: {
      title: "Section Title",
      faqs: "FAQ Items",
    },
  },
  contact_form: {
    safe: ["title", "description", "submitText"],
    locked: ["fields"],
    labels: {
      title: "Title",
      description: "Description",
      submitText: "Submit Button Text",
      fields: "Form Fields",
    },
  },
  cta_banner: {
    safe: ["headline", "description", "ctaText"],
    locked: ["ctaLink"],
    labels: {
      headline: "Headline",
      description: "Description",
      ctaText: "Button Text",
      ctaLink: "Button Link",
    },
  },
  rich_text: {
    safe: ["content"],
    locked: [],
    labels: {
      content: "Content",
    },
  },
  gallery_grid: {
    safe: ["title"],
    locked: ["images"],
    labels: {
      title: "Section Title",
      images: "Gallery Images",
    },
  },
  accreditations_row: {
    safe: ["title"],
    locked: ["accreditations"],
    labels: {
      title: "Section Title",
      accreditations: "Accreditations",
    },
  },
  service_area: {
    safe: ["title", "description"],
    locked: ["areas"],
    labels: {
      title: "Section Title",
      description: "Description",
      areas: "Service Areas",
    },
  },
};

const BLOCK_TYPE_NAMES: Record<string, string> = {
  hero: "Hero Section",
  services_grid: "Services Grid",
  about_split: "About Section",
  testimonial_list: "Testimonials",
  faq_accordion: "FAQ",
  contact_form: "Contact Form",
  cta_banner: "Call to Action",
  rich_text: "Text Content",
  gallery_grid: "Gallery",
  accreditations_row: "Accreditations",
  service_area: "Service Area",
};

export function BlockEditor({ block, pageId, index }: BlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(
    block.data as Record<string, unknown>
  );

  const config = BLOCK_FIELD_CONFIG[block.blockType] || { safe: [], locked: [], labels: {} };
  const blockName = BLOCK_TYPE_NAMES[block.blockType] || block.blockType;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      // Could show a toast here
    } catch (error) {
      console.error("Failed to save block:", error);
      // Could show an error toast
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldName: string, isLocked: boolean) => {
    const value = formData[fieldName];
    const label = config.labels[fieldName] || fieldName;

    // For complex values (arrays, objects), show a summary
    if (typeof value === "object" && value !== null) {
      return (
        <div key={fieldName} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-gray-500">{label}</Label>
            <Lock className="w-3 h-3 text-gray-400" />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            {Array.isArray(value)
              ? `${value.length} items`
              : "Complex data - request change to modify"}
          </div>
        </div>
      );
    }

    // For string values
    if (isLocked) {
      return (
        <div key={fieldName} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-gray-500">{label}</Label>
            <Lock className="w-3 h-3 text-gray-400" />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            {String(value || "Not set")}
          </div>
        </div>
      );
    }

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${block.id}-${fieldName}`}>{label}</Label>
          <Unlock className="w-3 h-3 text-green-500" />
        </div>
        {fieldName === "content" || fieldName === "description" ? (
          <textarea
            id={`${block.id}-${fieldName}`}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-y text-sm"
            value={String(value || "")}
            onChange={(e) =>
              setFormData({ ...formData, [fieldName]: e.target.value })
            }
          />
        ) : (
          <Input
            id={`${block.id}-${fieldName}`}
            value={String(value || "")}
            onChange={(e) =>
              setFormData({ ...formData, [fieldName]: e.target.value })
            }
          />
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-sm text-gray-500">
            {index + 1}
          </span>
          <span className="font-medium">{blockName}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Editable Fields */}
          {config.safe.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-green-500" />
                Editable Fields
              </h4>
              {config.safe.map((field) => renderField(field, false))}
            </div>
          )}

          {/* Locked Fields */}
          {config.locked.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                Managed Fields
                <span className="text-xs font-normal text-gray-500">
                  (request change to modify)
                </span>
              </h4>
              {config.locked.map((field) => renderField(field, true))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button asChild variant="outline" size="sm">
              <Link href={`/portal/tickets/new?type=block&blockId=${block.id}&pageId=${pageId}`}>
                Request Change
              </Link>
            </Button>
            {config.safe.length > 0 && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
