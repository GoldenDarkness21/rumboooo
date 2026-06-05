import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Compass, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isLanding = location.pathname === "/";

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada exitosamente");
      navigate("/login");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">Rumboo</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {isLanding ? (
            <>
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</a>
              <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Mis viajes</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Iniciar sesión</Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm">Crear viaje</Button>
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/dashboard" className={cn("text-sm transition-colors", location.pathname === "/dashboard" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
                Mis viajes
              </Link>
              <Link to="/create-trip">
                <Button size="sm">Nuevo viaje</Button>
              </Link>
              {user && (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border md:hidden animate-fade-in">
          <div className="container flex flex-col gap-3 py-4">
            {isLanding ? (
              <>
                <a href="#como-funciona" className="text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Cómo funciona</a>
                <a href="#beneficios" className="text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Beneficios</a>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full">Mis viajes</Button>
                    </Link>
                    <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full">Iniciar sesión</Button>
                    </Link>
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <Button className="w-full">Crear viaje</Button>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Mis viajes</Link>
                <Link to="/create-trip" onClick={() => setOpen(false)}>
                  <Button className="w-full">Nuevo viaje</Button>
                </Link>
                {user && (
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};