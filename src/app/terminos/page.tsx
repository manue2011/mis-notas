import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { CONTROLLER } from "@/lib/legal";

export const metadata = {
  title: "Condiciones de uso",
  description: "Las reglas de Libreta: quién puede usarla, qué es tuyo y qué no se puede hacer.",
};

const mail = <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      title="Condiciones de uso"
      summary="Libreta es gratuita y se entra solo por invitación. Lo que escribes es tuyo y de tu equipo; a cambio, te pedimos que la uses con cabeza."
    >
      <LegalSection title="Quién está detrás">
        <p>
          Libreta la ofrece {CONTROLLER.name}, en {CONTROLLER.country}. Contacto: {mail}. Al crear una cuenta aceptas
          estas condiciones y la <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Tu cuenta">
        <LegalList>
          <li>Las cuentas se crean solo con un enlace de registro que da el administrador, y son personales.</li>
          <li>Tienes que tener al menos 14 años.</li>
          <li>
            Cuida tu contraseña. Si la olvidas, el administrador puede ponerte una nueva; Libreta no envía correos.
          </li>
          <li>
            Puedes eliminar tu cuenta cuando quieras desde <Link href="/cuenta">Mi cuenta</Link>.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Lo que escribes">
        <p>
          Lo que escribes y subes sigue siendo tuyo. Nos das permiso solo para guardarlo y mostrárselo a las personas de
          los espacios donde lo pones, que es lo que hace falta para que Libreta funcione.
        </p>
        <p>
          En un espacio compartido, las páginas son del equipo: quien tenga permiso puede editarlas o borrarlas, y se
          quedan aunque te vayas.
        </p>
      </LegalSection>

      <LegalSection title="Qué no se puede hacer">
        <LegalList>
          <li>Subir contenido ilegal o que no tengas derecho a compartir.</li>
          <li>Acosar o suplantar a otras personas.</li>
          <li>Intentar entrar en espacios o cuentas que no son tuyos, o colapsar el servicio.</li>
          <li>Usar Libreta para enviar spam o programas dañinos.</li>
        </LegalList>
        <p>Si alguien lo hace, el administrador puede bloquear su cuenta.</p>
      </LegalSection>

      <LegalSection title="El servicio">
        <p>
          Libreta funciona con planes gratuitos de varios proveedores y se ofrece tal cual, sin garantías de
          disponibilidad. Puede haber cortes, por ejemplo la espera de hasta un minuto cuando el servidor de tiempo real
          se despierta. Haz copia de lo importante: en <Link href="/cuenta">Mi cuenta</Link> puedes descargar tus datos.
        </p>
        <p>
          No respondemos de daños indirectos por usar Libreta, salvo en lo que la ley no permita excluir. Podemos
          cambiar o cerrar el servicio avisando con tiempo para que te lleves tus datos.
        </p>
      </LegalSection>

      <LegalSection title="Ley aplicable">
        <p>
          Estas condiciones se rigen por la ley española. Si eres consumidor, conservas los derechos que te da la ley de
          tu país de residencia.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
