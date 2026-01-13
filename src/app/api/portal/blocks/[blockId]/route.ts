import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Define which fields are safe to edit per block type
const SAFE_FIELDS: Record<string, string[]> = {
  hero: ["headline", "subheadline", "ctaText"],
  services_grid: ["title"],
  about_split: ["title", "content"],
  testimonial_list: ["title"],
  faq_accordion: ["title"],
  contact_form: ["title", "description", "submitText"],
  cta_banner: ["headline", "description", "ctaText"],
  rich_text: ["content"],
  gallery_grid: ["title"],
  accreditations_row: ["title"],
  service_area: ["title", "description"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Get the block and verify ownership
  const block = await db.pageBlock.findUnique({
    where: { id: blockId },
    include: {
      page: {
        include: {
          tenant: {
            include: {
              users: {
                where: { email: session.user.email },
              },
            },
          },
        },
      },
    },
  });

  if (!block || block.page.tenant.users.length === 0) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Parse request body
  const body = await request.json();
  const { data: newData } = body;

  if (!newData || typeof newData !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Get safe fields for this block type
  const safeFields = SAFE_FIELDS[block.blockType] || [];

  // Merge only safe fields into existing data
  const existingData = block.data as Record<string, unknown>;
  const updatedData = { ...existingData };

  for (const field of safeFields) {
    if (field in newData) {
      updatedData[field] = newData[field];
    }
  }

  // Update the block
  const updated = await db.pageBlock.update({
    where: { id: blockId },
    data: { data: updatedData as object },
  });

  return NextResponse.json({ success: true, block: updated });
}
