import { ShieldCheck, Award } from "lucide-react";

const Cadastur = () => {
  return (
    <section className="py-16 bg-rose-light">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
          <div className="flex justify-center gap-4 mb-6">
            <ShieldCheck className="h-12 w-12 text-turquoise" />
            <Award className="h-12 w-12 text-gold" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Agência <span className="text-primary">Cadasturada</span>
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            A SL Turismo é regularizada pelo <strong>Cadastur</strong> — o sistema de cadastro de pessoas físicas e jurídicas que atuam no setor do turismo, mantido pelo Ministério do Turismo do Brasil.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Isso garante que você está contratando uma agência <strong>legalizada, segura e comprometida</strong> com a qualidade dos serviços prestados. Viaje com tranquilidade!
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-turquoise/10 text-turquoise px-4 py-2 rounded-full text-sm font-medium">
            <ShieldCheck className="h-4 w-4" />
            Empresa regularizada junto ao Ministério do Turismo
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cadastur;
