import { useEffect, useState } from "react";
import { ShieldCheck, Award, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSectionVisible } from "@/contexts/PublicSiteContext";
import { safeHttpUrl } from "@/lib/social-url";

type CadasturData = {
  numero?: string;
  validade?: string;
  descricao?: string;
  link_verificacao?: string;
  imagem_url?: string;
};

const defaultData: CadasturData = {
  numero: "",
  validade: "",
  descricao: "A SL Turismo é regularizada pelo Cadastur — o sistema de cadastro de pessoas físicas e jurídicas que atuam no setor do turismo, mantido pelo Ministério do Turismo do Brasil.",
  link_verificacao: "",
  imagem_url: "",
};

const Cadastur = () => {
  const visible = useSectionVisible("cadastur");
  const [data, setData] = useState<CadasturData>(defaultData);

  useEffect(() => {
    const fetch = async () => {
      const { data: content } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "cadastur")
        .maybeSingle();
      if (content?.content) {
        setData({ ...defaultData, ...(content.content as unknown as CadasturData) });
      }
    };
    fetch();
  }, []);

  if (!visible) return null;
  const verificationLink = safeHttpUrl(data.link_verificacao);

  return (
    <section className="py-16 bg-rose-light">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Certificate Image */}
            <div className="bg-muted flex items-center justify-center p-8 min-h-[280px]">
              {data.imagem_url ? (
                <img
                  src={data.imagem_url}
                  alt="Certificado Cadastur"
                  className="max-w-full max-h-72 object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ShieldCheck className="h-20 w-20 mx-auto mb-4 text-turquoise/40" />
                  <p className="text-sm">Certificado será exibido aqui</p>
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-8 w-8 text-turquoise" />
                <Award className="h-8 w-8 text-gold" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Credenciais e <span className="text-primary">Segurança</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {data.descricao}
              </p>
              {data.numero && (
                <p className="text-sm font-medium text-foreground mb-1">
                  Cadastur Nº: <span className="text-primary">{data.numero}</span>
                </p>
              )}
              {data.validade && (
                <p className="text-sm text-muted-foreground mb-4">
                  Validade: {data.validade}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="inline-flex items-center gap-2 bg-turquoise/10 text-turquoise px-4 py-2 rounded-full text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Empresa regularizada
                </div>
                {verificationLink && (
                  <a
                    href={verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Verificar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cadastur;
