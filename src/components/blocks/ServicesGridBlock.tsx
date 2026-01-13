import type { TenantSiteSettings } from "@prisma/client";
import { Wrench, Star, Shield, Home, Zap, Heart, Users, Clock, CheckCircle } from "lucide-react";

interface Service {
  name: string;
  description: string;
  icon?: string;
}

interface ServicesGridBlockProps {
  data: Record<string, unknown>;
  siteSettings?: TenantSiteSettings | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  star: Star,
  shield: Shield,
  home: Home,
  zap: Zap,
  heart: Heart,
  users: Users,
  clock: Clock,
  check: CheckCircle,
};

export function ServicesGridBlock({ data }: ServicesGridBlockProps) {
  const title = data.title as string || "Our Services";
  const services = data.services as Service[] || [];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon || "check"] || CheckCircle;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
