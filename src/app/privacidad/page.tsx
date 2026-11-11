import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { CONTROLLER } from "@/lib/legal";

export const metadata = {
  title: "Privacidad",
  description: "Qué datos guarda Libreta, para qué, dónde y cómo pedir que los borremos.",
};

const mail = <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacidad"
      summary="Libreta guarda lo justo para que tu equipo escriba junto: tu cuenta y lo que escribís. No hay publicidad, no hay analítica y no vendemos ni cedemos nada a nadie."
    >
      <LegalSection title="Quién es el responsable">
        <p>
          El responsable del tratamiento es {CONTROLLER.name}, en {CONTROLLER.country}. Para cualquier cosa sobre tus
          datos, escribe a {mail}.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos guardamos">
        <LegalList>
          <li>
            <strong>Tu cuenta:</strong> nombre, correo y contraseña (solo su huella cifrada, nunca la contraseña en
            sí). Si entras con Google, recibimos de Google tu nombre, tu correo y tu foto de perfil.
          </li>
          <li>
            <strong>Lo que escribes:</strong> las páginas, sus títulos, las imágenes que subes y quién creó o editó cada
            cosa.
          </li>
          <li>
            <strong>Tus espacios:</strong> a qué espacios perteneces, con qué rol, y los enlaces de invitación que crees.
          </li>
          <li>
            <strong>Las sesiones:</strong> mientras tienes la sesión abierta guardamos la dirección IP y el navegador
            desde el que entras, para protegerte si alguien la usa sin permiso. La IP también sirve para frenar a quien
            prueba contraseñas una y otra vez.
          </li>
        </LegalList>
        <p>No pedimos ni guardamos datos de pago, ubicación ni nada sensible.</p>
      </LegalSection>

      <LegalSection title="Para qué y con qué base legal">
        <LegalList>
          <li>
            <strong>Darte el servicio</strong> (crear tu cuenta, guardar tus páginas, compartirlas con tu equipo): es
            necesario para cumplir lo que aceptas al registrarte (artículo 6.1.b del RGPD).
          </li>
          <li>
            <strong>Ordenar una página con IA</strong>, solo cuando tú lo pides: forma parte del servicio que usas en ese
            momento (artículo 6.1.b del RGPD). Contamos cuántas veces la usas al día, para el límite diario.
          </li>
          <li>
            <strong>Mantener Libreta segura</strong> (sesiones, límite de intentos, bloqueo de cuentas): interés legítimo
            en proteger las cuentas y el servicio (artículo 6.1.f del RGPD).
          </li>
        </LegalList>
        <p>No usamos tus datos para publicidad, perfiles ni decisiones automáticas. Libreta no envía correos.</p>
      </LegalSection>

      <LegalSection title="Quién más los trata">
        <p>
          Libreta funciona sobre estos proveedores, que tratan los datos solo por cuenta nuestra y con contratos de
          protección de datos:
        </p>
        <LegalList>
          <li>
            <strong>Vercel</strong> (Estados Unidos): sirve la aplicación.
          </li>
          <li>
            <strong>Neon</strong> (servidores en Fráncfort, Alemania): la base de datos donde viven las cuentas y las
            páginas.
          </li>
          <li>
            <strong>Render</strong> (servidores en Fráncfort, Alemania): la edición en tiempo real.
          </li>
          <li>
            <strong>Cloudinary</strong> (Estados Unidos): guarda las imágenes que subes.
          </li>
          <li>
            <strong>Google</strong> (Estados Unidos): solo si eliges entrar con Google.
          </li>
          <li>
            <strong>Groq</strong> (Estados Unidos): solo cuando pulsas «Ordenar con IA». Recibe el título y el
            texto de esa página (no las imágenes ni tu nombre o correo) para devolver una versión ordenada, y no lo usa
            para entrenar sus modelos.
          </li>
        </LegalList>
        <p>
          Cuando los datos salen del Espacio Económico Europeo, lo hacen con las garantías del RGPD: el Marco de
          Privacidad de Datos UE-EE. UU. o las cláusulas contractuales tipo de la Comisión Europea.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo">
        <LegalList>
          <li>Tu cuenta y tus datos, mientras tengas la cuenta.</li>
          <li>Las sesiones caducan solas a los pocos días; los registros de intentos de acceso, en minutos.</li>
          <li>
            Las páginas borradas quedan en la papelera del espacio hasta que alguien la vacía o las restaura.
          </li>
          <li>
            Si eliminas tu cuenta, la borramos al momento; las copias de seguridad de la base de datos desaparecen solas
            en pocos días.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Lo que escribes en un espacio compartido">
        <p>
          Las páginas de un espacio son del equipo. Si te vas de un espacio o eliminas tu cuenta, las páginas que
          escribiste ahí se quedan para el resto, sin tu nombre. Los espacios en los que eras la única persona se borran
          contigo, con sus páginas e imágenes.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>Libreta solo usa cookies técnicas, las imprescindibles para funcionar, así que no te pedimos permiso:</p>
        <LegalList>
          <li>La de sesión, para saber que eres tú mientras navegas.</li>
          <li>Una temporal al abrir un enlace de registro, que se borra al crear la cuenta.</li>
          <li>La del tema claro u oscuro, solo si lo eliges tú.</li>
        </LegalList>
        <p>
          Además, tu navegador recuerda qué carpetas de la barra lateral tienes abiertas. No hay cookies de analítica
          ni de publicidad, ni nuestras ni de nadie.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Puedes pedir ver tus datos, corregirlos, borrarlos, llevártelos, limitar su uso u oponerte a él. Las dos cosas
          más habituales las tienes a mano en <Link href="/cuenta">Mi cuenta</Link>: descargar tus datos y eliminar tu
          cuenta. Para lo demás, escribe a {mail} y te respondemos en menos de un mes.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos
          en <a href="https://www.aepd.es">aepd.es</a>.
        </p>
      </LegalSection>

      <LegalSection title="Edad">
        <p>Para usar Libreta tienes que tener al menos 14 años.</p>
      </LegalSection>

      <LegalSection title="Cambios">
        <p>
          Si cambiamos algo importante de esta página, lo avisaremos dentro de Libreta. La fecha de arriba dice cuándo
          se cambió por última vez.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
