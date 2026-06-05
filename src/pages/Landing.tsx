import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Wallet, Users, ArrowRight, Calendar, CheckCircle2, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Planifica viajes sin estrés</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Organiza viajes en grupo{" "}
              <span className="bg-clip-text text-transparent gradient-primary">sin caos</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Itinerarios, gastos y coordinación en un solo lugar. Simple, rápido y sin excusas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/login">
                <Button variant="hero" size="xl">
                  Crear viaje
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button variant="ghost" size="lg" className="text-muted-foreground">
                  Ver cómo funciona
                </Button>
              </a>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-16 max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <div className="rounded-2xl border border-border bg-card shadow-card-hover p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <div className="h-2 w-2 rounded-full bg-primary/60" />
                <div className="h-2 w-2 rounded-full bg-success" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Barcelona Trip", sub: "4 personas · Jun 15–20", icon: MapPin },
                  { label: "Budget", sub: "€1,240 total", icon: Wallet },
                  { label: "Actividades", sub: "12 planeadas", icon: Calendar },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-4">
                    <item.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">¿Cómo funciona?</h2>
            <p className="text-muted-foreground">Tres pasos y listo. Sin complicaciones.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Crea un viaje", desc: "Ponle nombre, fechas e invita a tu grupo.", icon: MapPin },
              { step: "02", title: "Planifica juntos", desc: "Agrega actividades, itinerarios y notas compartidas.", icon: Calendar },
              { step: "03", title: "Divide gastos", desc: "Registra gastos y ve quién debe qué al instante.", icon: Wallet },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-card text-center group hover:shadow-card-hover transition-all duration-200">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-semibold text-sm mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Todo lo que necesitas</h2>
            <p className="text-muted-foreground">Sin apps extras, sin hojas de cálculo, sin dramas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: "Gastos claros", desc: "Divide gastos automáticamente. Siempre sabrás quién debe qué.", icon: Wallet, color: "text-primary" },
              { title: "Itinerario compartido", desc: "Todos ven el plan. Cambios en tiempo real, sin confusión.", icon: Calendar, color: "text-secondary" },
              { title: "Grupo coordinado", desc: "Invita, asigna y organiza. Cada persona sabe qué hacer.", icon: Users, color: "text-success" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-6 shadow-card">
                <item.icon className={`h-6 w-6 ${item.color} mb-4`} />
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <div className="max-w-lg mx-auto">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">¿Listo para viajar?</h2>
            <p className="text-muted-foreground mb-8">Crea tu primer viaje en menos de un minuto.</p>
            <Link to="/login">
              <Button variant="hero" size="xl">
                Empezar ahora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2026 Rumboo. Todos los derechos reservados.</span>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
