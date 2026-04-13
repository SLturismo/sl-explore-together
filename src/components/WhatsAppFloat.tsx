import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSectionVisible } from "@/contexts/PublicSiteContext";

const WhatsAppFloat = () => {
  const visible = useSectionVisible("whatsapp_float");
  const [phoneLink, setPhoneLink] = useState("5567999535548");

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "footer").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const c = data.content as any;
        if (c.phone_link) setPhoneLink(c.phone_link);
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <a
      href={`https://wa.me/${phoneLink}?text=Olá! Gostaria de saber mais sobre as viagens da SL Turismo.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BD5A] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.923 15.923 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.35 22.616c-.392 1.098-1.94 2.01-3.168 2.276-.842.178-1.94.32-5.638-1.212-4.732-1.96-7.776-6.756-8.014-7.07-.228-.314-1.92-2.558-1.92-4.878s1.214-3.462 1.646-3.936c.432-.474.942-.592 1.256-.592.314 0 .628.002.904.016.29.014.68-.11 1.064.812.392.942 1.332 3.262 1.45 3.5.118.236.196.512.04.826-.158.314-.236.51-.472.786-.236.276-.498.616-.71.826-.236.236-.482.492-.208.964.276.474 1.226 2.022 2.632 3.276 1.81 1.614 3.336 2.114 3.81 2.35.474.236.75.196 1.026-.118.276-.314 1.178-1.374 1.492-1.846.314-.474.628-.392 1.06-.236.432.158 2.75 1.298 3.222 1.534.474.236.788.354.904.55.118.196.118 1.136-.274 2.234z" />
      </svg>
    </a>
  );
};

export default WhatsAppFloat;
