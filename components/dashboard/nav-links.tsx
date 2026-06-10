"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Star, Eye, BarChart3,
  LayoutGrid, CalendarCheck, ClipboardList, Trophy,
  Droplets, Users, Settings, Swords
} from "lucide-react";

const userLinks = [
  { href: '/dashboard', label: 'Predicciones', icon: LayoutDashboard },
  { href: '/dashboard/especiales', label: 'Apuestas Especiales', icon: Star },
  { href: '/dashboard/mis-apuestas', label: 'Ver Tarjetas', icon: Eye },
  { href: '/leaderboard', label: 'Tabla de Posiciones', icon: BarChart3 },
  { href: '/dashboard/agua-local', label: 'Instalaciones Agua Local', icon: Droplets },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/matches', label: 'Partidos', icon: CalendarCheck },
  { href: '/admin/results', label: 'Resultados', icon: ClipboardList },
  { href: '/admin/knockout', label: 'Equipos Clasif.', icon: Swords },
  { href: '/admin/special-results', label: 'Apuestas Especiales', icon: Trophy },
  { href: '/admin/water', label: 'Agua Local', icon: Droplets },
{ href: '/admin/tarjetas', label: 'Ver Tarjetas', icon: Eye },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/settings', label: 'Config & Testing', icon: Settings },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
        {isAdmin ? "Administración" : "Menú"}
      </p>
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === href ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100"
          }`}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </div>
  );
}
