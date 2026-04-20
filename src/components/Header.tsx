import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSite } from "@/contexts/PublicSiteContext";

const defaultNavItems = [
  { label: "Início", href: "#inicio" },
  { label: "Galeria", href: "#galeria" },
  { label: "Viagens & Eventos", href: "#planejar" },
  { label: "Eventos", href: "#eventos" },
  { label: "Sobre", href: "#sobre" },
];

const Header = () => {
  const { logoSrc } = usePublicSite();
  const [isOpen, setIsOpen] = useState(false);
  const [navItems, setNavItems] = useState(defaultNavItems);
  const [contactLabel, setContactLabel] = useState("Contato");
  const [phoneLink, setPhoneLink] = useState("5567999535548");
  const [waPrefill, setWaPrefill] = useState("Olá! Gostaria de saber mais sobre as viagens da SL Turismo.");

  useEffect(() => {
    Promise.all([
      supabase.from("site_content").select("content").eq("section_key", "header").maybeSingle(),
      supabase.from("site_content").select("content").eq("section_key", "footer").maybeSingle(),
    ]).then(([{ data: headerData }, { data: footerData }]) => {
      if (headerData?.content) {
        const c = headerData.content as any;
        const hrefs = ["#inicio", "#galeria", "#planejar", "#eventos", "#sobre"];
        const keys = ["menu_inicio", "menu_galeria", "menu_planejar", "menu_eventos", "menu_sobre"];
        setNavItems(hrefs.map((href, i) => ({ label: c[keys[i]] || c[`nav${i + 1}`] || defaultNavItems[i].label, href })));
        if (c.contact_button) setContactLabel(c.contact_button);
      }
      if (footerData?.content) {
        const f = footerData.content as Record<string, string>;
        const digits = (f.phone_link || "").replace(/\D/g, "");
        if (digits) setPhoneLink(digits);
        if (typeof f.whatsapp_prefill === "string" && f.whatsapp_prefill.trim()) setWaPrefill(f.whatsapp_prefill.trim());
      }
    });
  }, []);

  const waHref = `https://wa.me/${phoneLink.replace(/\D/g, "")}?text=${encodeURIComponent(waPrefill)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <a href="#inicio" className="flex items-center gap-2 shrink-0">
          {logoSrc ? <img src={logoSrc} alt="SL Turismo" className="h-16 md:h-20 w-auto rounded-lg" /> : null}
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap">{item.label}</a>
          ))}
        </nav>

        <div className="hidden md:block shrink-0">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1"><Phone className="h-3 w-3" />{contactLabel}</Button>
          </a>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary py-2" onClick={() => setIsOpen(false)}>{item.label}</a>
            ))}
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 gap-1"><Phone className="h-3 w-3" />{contactLabel}</Button>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
