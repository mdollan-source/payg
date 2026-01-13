"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

const TICKET_CATEGORIES = [
  { value: "content", label: "Content Change", description: "Update text, images, or other content" },
  { value: "seo", label: "SEO Update", description: "Update titles, descriptions, or keywords" },
  { value: "design", label: "Design Change", description: "Modify layout, colours, or styling" },
  { value: "new_page", label: "New Page", description: "Add a new page to your website" },
  { value: "other", label: "Other", description: "Something else" },
];

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: preselectedType,
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ticket");
      }

      const data = await response.json();
      router.push(`/portal/tickets/${data.ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/portal/tickets">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">New Change Request</h1>
        <p className="text-gray-500">Tell us what you&apos;d like changed on your website</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Provide as much detail as possible so we can complete your request quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Category</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-gray-500">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of your request"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[150px] px-3 py-2 border rounded-md resize-y"
                placeholder="Please describe what you'd like changed in detail. Include:
- Which page(s) this affects
- What the current content/design looks like
- What you'd like it to look like instead
- Any specific text, images, or links to include"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Changes use your monthly minutes allowance
              </p>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <NewTicketForm />
    </Suspense>
  );
}
