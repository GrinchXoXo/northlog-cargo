import type { LucideIcon } from "lucide-react";
import { Ship, Warehouse, PackageCheck, ClipboardList } from "lucide-react";

export interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  coverage: string;
}

/**
 * Placeholder service offering. The company's confirmed service list has
 * not been supplied yet: do not treat these as confirmed capabilities.
 * See PRD/PHASE-01-PUBLIC-WEBSITE.md section 18.
 */
export const SERVICES: Service[] = [
  {
    icon: Ship,
    title: "Freight Forwarding",
    description:
      "We coordinate the movement of your cargo from origin to destination, handling the steps between pickup and final-mile delivery.",
    coverage: "[SERVICE COVERAGE AREA]",
  },
  {
    icon: Warehouse,
    title: "Consolidated Shipping",
    description:
      "Smaller shipments are grouped together to move efficiently, with each package tracked individually under its own ID.",
    coverage: "[SERVICE COVERAGE AREA]",
  },
  {
    icon: PackageCheck,
    title: "Package Handling",
    description:
      "Every shipment is logged, photographed, and checked at key handling points so its condition and status stay on record.",
    coverage: "[SERVICE COVERAGE AREA]",
  },
  {
    icon: ClipboardList,
    title: "Shipment Tracking",
    description:
      "Every shipment receives a tracking ID the moment it's created, with status and location updates visible on this website.",
    coverage: "Available for all shipments",
  },
];
