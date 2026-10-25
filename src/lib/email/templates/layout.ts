export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

type LayoutInput = {
  heading: string;
  paragraphs: string[];
  action: { label: string; url: string };
  footnote: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Plain, table-based HTML so it renders in every mail client. Inputs are escaped here. */
export function renderLayout({ heading, paragraphs, action, footnote }: LayoutInput): {
  html: string;
  text: string;
} {
  const url = escapeHtml(action.url);
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${escapeHtml(p)}</p>`)
    .join("");

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#F5EFE3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE3;">
<tr><td style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FBF8F1;border:1px solid #DCD2BF;border-radius:8px;">
<tr><td style="padding:32px 32px 8px;font-family:Georgia,'Times New Roman',serif;color:#2A251F;">
<p style="margin:0 0 24px;font-size:14px;letter-spacing:.04em;color:#6B6156;font-family:Arial,sans-serif;">Libreta</p>
<h1 style="margin:0 0 20px;font-size:26px;font-weight:500;line-height:1.25;">${escapeHtml(heading)}</h1>
${body}
<p style="margin:24px 0 28px;"><a href="${url}" style="display:inline-block;background:#2F5D8A;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 20px;border-radius:6px;">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#6B6156;">Si el botón no funciona, copia este enlace:</p>
<p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:13px;word-break:break-all;"><a href="${url}" style="color:#2F5D8A;">${url}</a></p>
</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #E3D9C6;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#6B6156;">${escapeHtml(footnote)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [heading, "", ...paragraphs, "", `${action.label}: ${action.url}`, "", footnote].join(
    "\n",
  );

  return { html, text };
}
