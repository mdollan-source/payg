import type { Job, PrismaClient } from "@prisma/client";
import type { JobHandler } from "../worker";
import type { OnboardingData } from "@/types/onboarding";
import type { PlanPages, WebsiteBuildSpec } from "@/lib/ai/types";
import {
  generateSpec,
  isOpenAIConfigured,
} from "@/lib/ai/spec-generator";
import {
  generateSeed,
  isAnthropicConfigured,
} from "@/lib/ai/seed-generator";

/**
 * Handler for AI spec generation
 * Creates the initial site specification from onboarding answers
 */
export const handleAiGenerateSpec: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as { tenantId: string; planPages: number };
  const planPages = payload.planPages as PlanPages;

  console.log(`[AI Spec] Generating spec for tenant ${payload.tenantId}`);

  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
    console.warn("[AI Spec] OpenAI not configured, using mock spec");
    // Create mock spec for development
    await createMockSpec(db, payload.tenantId, planPages);
    return { status: "mock_spec_created", reason: "openai_not_configured" };
  }

  // Fetch onboarding submission
  const submission = await db.onboardingSubmission.findFirst({
    where: { tenantId: payload.tenantId },
    orderBy: { createdAt: "desc" },
  });

  if (!submission) {
    throw new Error(`No onboarding submission found for tenant ${payload.tenantId}`);
  }

  const onboardingData = submission.rawAnswers as unknown as OnboardingData;

  // Generate spec using OpenAI
  const { spec, usage } = await generateSpec(onboardingData, planPages, {
    onRetry: (attempt, error) => {
      console.log(`[AI Spec] Retry ${attempt}: ${error}`);
    },
  });

  // Store in ai_build_specs
  await db.aiBuildSpec.create({
    data: {
      tenantId: payload.tenantId,
      specVersion: "1.0",
      spec: spec as object,
    },
  });

  // Log generation
  await db.aiGeneration.create({
    data: {
      tenantId: payload.tenantId,
      kind: "gpt_spec",
      input: { model: "gpt-4o", promptTokens: usage.promptTokens, completionTokens: usage.completionTokens },
      output: spec as object,
    },
  });

  // Queue seed generation job
  await db.job.create({
    data: {
      tenantId: payload.tenantId,
      jobType: "ai_generate_seed",
      status: "pending",
      payload: { tenantId: payload.tenantId, planPages: payload.planPages },
    },
  });

  console.log(`[AI Spec] Spec generated for tenant ${payload.tenantId}`);
  return { status: "spec_generated", nextJob: "ai_generate_seed" };
};

/**
 * Handler for AI seed generation
 * Creates the CMS content seed from the spec
 */
export const handleAiGenerateSeed: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as { tenantId: string; planPages: number };
  const planPages = payload.planPages as PlanPages;

  console.log(`[AI Seed] Generating seed for tenant ${payload.tenantId}`);

  // Check if Anthropic is configured
  if (!isAnthropicConfigured()) {
    console.warn("[AI Seed] Anthropic not configured, using mock seed");
    await createMockSeed(db, payload.tenantId);
    return { status: "mock_seed_created", reason: "anthropic_not_configured" };
  }

  // Fetch the spec
  const buildSpec = await db.aiBuildSpec.findFirst({
    where: { tenantId: payload.tenantId },
    orderBy: { createdAt: "desc" },
  });

  if (!buildSpec) {
    throw new Error(`No build spec found for tenant ${payload.tenantId}`);
  }

  const spec = buildSpec.spec as unknown as WebsiteBuildSpec;

  // Generate seed using Claude
  const { seed, usage } = await generateSeed(spec, planPages, {
    onRetry: (attempt, error) => {
      console.log(`[AI Seed] Retry ${attempt}: ${error}`);
    },
  });

  // Log generation
  await db.aiGeneration.create({
    data: {
      tenantId: payload.tenantId,
      kind: "claude_seed",
      input: { model: "claude-sonnet-4", inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
      output: seed as object,
    },
  });

  // Queue import job
  await db.job.create({
    data: {
      tenantId: payload.tenantId,
      jobType: "import_seed",
      status: "pending",
      payload: { tenantId: payload.tenantId, seed: seed as object },
    },
  });

  console.log(`[AI Seed] Seed generated for tenant ${payload.tenantId}`);
  return { status: "seed_generated", nextJob: "import_seed" };
};

/**
 * Handler for seed import
 * Imports the CMS seed into the database
 */
export const handleImportSeed: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as { tenantId: string; seed?: object };
  console.log(`[Import] Importing seed for tenant ${payload.tenantId}`);

  // Get seed from payload or fetch from latest generation
  let seed = payload.seed;
  if (!seed) {
    const generation = await db.aiGeneration.findFirst({
      where: {
        tenantId: payload.tenantId,
        kind: "claude_seed",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!generation) {
      throw new Error(`No seed generation found for tenant ${payload.tenantId}`);
    }
    seed = generation.output as object;
  }

  // Import seed using the importer (Phase 1.6)
  const { importSeed } = await import("@/lib/importer/seed-importer");
  await importSeed(db, payload.tenantId, seed);

  // Update tenant status to pending_review (admin must approve before going live)
  await db.tenant.update({
    where: { id: payload.tenantId },
    data: { status: "pending_review" },
  });

  console.log(`[Import] Seed imported for tenant ${payload.tenantId}, awaiting admin review`);
  return { status: "seed_imported", tenantStatus: "pending_review" };
};

/**
 * Handler for sending emails
 */
export const handleSendEmail: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as {
    tenantId: string;
    template: string;
    to?: string;
    data?: Record<string, unknown>;
  };
  console.log(`[Email] Sending ${payload.template} email for tenant ${payload.tenantId}`);

  // Import email modules
  const { sendEmail, isResendConfigured } = await import("@/lib/email/resend");
  const { getTemplate } = await import("@/lib/email/templates");

  if (!isResendConfigured()) {
    console.warn("[Email] Resend not configured, skipping email");
    return { status: "email_skipped", reason: "resend_not_configured" };
  }

  // Get tenant data for email context
  const tenant = await db.tenant.findUnique({
    where: { id: payload.tenantId },
    include: {
      siteSettings: true,
      domains: { where: { isPrimary: true }, take: 1 },
      users: { take: 1 },
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${payload.tenantId}`);
  }

  // Determine recipient
  const to = payload.to || tenant.users[0]?.email;
  if (!to) {
    console.warn("[Email] No recipient found, skipping email");
    return { status: "email_skipped", reason: "no_recipient" };
  }

  // Build template data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paygsite.co.uk";
  const siteUrl = tenant.domains[0]
    ? `https://${tenant.domains[0].domain}`
    : `https://${tenant.businessSlug}.paygsite.co.uk`;

  const templateData = {
    businessName: tenant.businessName,
    dashboardUrl: `${baseUrl}/portal/dashboard`,
    siteUrl,
    ...payload.data,
  };

  // Get email template
  const template = getTemplate(payload.template, templateData);
  if (!template) {
    throw new Error(`Unknown email template: ${payload.template}`);
  }

  // Send email
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  // Log email to database
  await db.emailLog.create({
    data: {
      tenantId: payload.tenantId,
      recipientEmail: to,
      subject: template.subject,
      template: payload.template,
      status: result ? "sent" : "failed",
      resendMessageId: result?.id,
    },
  });

  console.log(`[Email] Sent ${payload.template} to ${to}`);
  return { status: "email_sent", template: payload.template, to };
};

/**
 * Handler for DNS verification
 */
export const handleVerifyDns: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as { tenantId: string; domainId: string };
  console.log(`[DNS] Verifying DNS for domain ${payload.domainId}`);

  // TODO: Implement DNS verification in Phase 4
  return { status: "dns_checked" };
};

/**
 * Handler for SSL certificate provisioning
 */
export const handleProvisionSsl: JobHandler = async (
  job: Job,
  db: PrismaClient
) => {
  const payload = job.payload as { tenantId: string; domainId: string };
  console.log(`[SSL] Provisioning SSL for domain ${payload.domainId}`);

  // TODO: Implement SSL provisioning in Phase 4
  return { status: "ssl_provisioned" };
};

/**
 * All job handlers mapped by type
 */
export const jobHandlers = {
  ai_generate_spec: handleAiGenerateSpec,
  ai_generate_seed: handleAiGenerateSeed,
  import_seed: handleImportSeed,
  send_email: handleSendEmail,
  verify_dns: handleVerifyDns,
  provision_ssl: handleProvisionSsl,
} as const;

// Helper functions for mock data in dev mode

async function createMockSpec(
  db: PrismaClient,
  tenantId: string,
  planPages: PlanPages
) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const mockSpec = {
    spec_version: "1.0",
    tenant: {
      business_name: tenant?.businessName || "Test Business",
      legal_name: tenant?.businessName || "Test Business Ltd",
      industry: "General Services",
      tagline: "Quality service you can trust",
      tone_of_voice: "Professional and friendly",
      usp_bullets: ["Quality work", "Reliable service", "Fair prices"],
      avoid_claims_or_words: [],
    },
    branding: {
      logo_url: "",
      primary_colour_hex: "#2563eb",
      secondary_colour_hex: "#1e40af",
      design_vibe: "modern professional",
    },
    contact: {
      phone: "01onal 234 5678",
      email: "info@example.com",
      address: "123 Main Street, London",
      opening_hours: "Mon-Fri 9am-5pm",
      cta_primary: "Get a Quote",
      cta_secondary: "Call Now",
    },
    service_area: {
      mode: "list" as const,
      radius_miles: 0,
      areas: ["London", "Surrey", "Kent"],
      primary_location: "London",
    },
    seo_defaults: {
      locale: "en-GB",
      brand_name: tenant?.businessName || "Test Business",
      primary_location: "London",
      service_area_hint: "London and surrounding areas",
    },
    navigation: {
      header_links: [{ label: "Home", href: "/" }],
      footer_links: [{ label: "Home", href: "/" }],
    },
    pages: [
      {
        id: "home",
        title: "Home",
        slug: "/",
        purpose: "Landing page",
        seo: {
          title: `${tenant?.businessName || "Test Business"} | Quality Services`,
          meta_description:
            "Professional services in London. Get in touch today for a free quote.",
          primary_keyword: "services london",
          secondary_keywords: [],
        },
        sections: [
          { type: "hero" as const, props: {} },
          { type: "services_grid" as const, props: {} },
          { type: "contact_form" as const, props: {} },
        ],
      },
    ],
    global_blocks: {
      footer: {
        disclaimer: "",
        copyright_text: `© ${new Date().getFullYear()} ${tenant?.businessName || "Test Business"}`,
      },
    },
    assets: {
      image_style_notes: "Professional, modern",
      image_requests: [],
    },
    change_policy_hints: {
      self_serve: [],
      managed_changes: [],
    },
  };

  await db.aiBuildSpec.create({
    data: {
      tenantId,
      specVersion: "1.0",
      spec: mockSpec as object,
    },
  });

  // Queue next job
  await db.job.create({
    data: {
      tenantId,
      jobType: "ai_generate_seed",
      status: "pending",
      payload: { tenantId, planPages },
    },
  });
}

async function createMockSeed(db: PrismaClient, tenantId: string) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

  const mockSeed = {
    settings: {
      siteName: tenant?.businessName || "Test Business",
      tagline: "Quality service you can trust",
      contact: {
        phone: "01234 567890",
        email: "info@example.com",
        address: "123 Main Street, London",
        openingHours: "Mon-Fri 9am-5pm",
      },
      colours: {
        primary: "#2563eb",
        secondary: "#1e40af",
      },
      footer: {
        disclaimer: "",
        copyrightText: `© ${new Date().getFullYear()} ${tenant?.businessName || "Test Business"}`,
      },
    },
    navigation: {
      headerLinks: [{ label: "Home", href: "/" }],
      footerLinks: [{ label: "Home", href: "/" }],
    },
    pages: [
      {
        title: "Home",
        slug: "/",
        seoTitle: `${tenant?.businessName || "Test Business"} | Quality Services`,
        seoDescription:
          "Professional services in London. Get in touch today for a free quote.",
        blocks: [
          {
            blockType: "hero",
            data: {
              headline: `Welcome to ${tenant?.businessName || "Test Business"}`,
              subheadline: "Quality service you can trust",
              ctaText: "Get a Quote",
              ctaLink: "#contact",
              imageUrl: "",
            },
          },
          {
            blockType: "services_grid",
            data: {
              title: "Our Services",
              services: [
                {
                  name: "Service 1",
                  description: "Description of service 1",
                  icon: "wrench",
                },
                {
                  name: "Service 2",
                  description: "Description of service 2",
                  icon: "star",
                },
                {
                  name: "Service 3",
                  description: "Description of service 3",
                  icon: "shield",
                },
              ],
            },
          },
          {
            blockType: "contact_form",
            data: {
              title: "Get in Touch",
              description: "Fill out the form below and we'll get back to you.",
              fields: ["name", "email", "phone", "message"],
              submitText: "Send Message",
            },
          },
        ],
      },
    ],
  };

  await db.aiGeneration.create({
    data: {
      tenantId,
      kind: "claude_seed",
      input: { model: "mock", inputTokens: 0, outputTokens: 0 },
      output: mockSeed as object,
    },
  });

  // Queue import job
  await db.job.create({
    data: {
      tenantId,
      jobType: "import_seed",
      status: "pending",
      payload: { tenantId, seed: mockSeed },
    },
  });
}
