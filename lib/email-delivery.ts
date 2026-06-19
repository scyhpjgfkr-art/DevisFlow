type ResendSendOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type ResendSendResult = {
  data?: unknown;
  error?: unknown;
};

type ResendLikeClient = {
  emails: {
    send: (options: ResendSendOptions) => Promise<ResendSendResult>;
  };
};

type EmailDeliveryResult =
  | {
      success: true;
      data?: unknown;
      testFallback: boolean;
      sentToOriginalRecipient: boolean;
      warning?: string;
    }
  | {
      success: false;
      error: string;
      details: string;
    };

function extractResendMessage(error: unknown) {
  if (!error) return "Erreur inconnue Resend";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const candidates = [
      record.message,
      record.error,
      record.name,
      record.statusCode,
    ].filter(Boolean);

    if (candidates.length > 0) {
      return candidates.map(String).join(" - ");
    }

    try {
      return JSON.stringify(record);
    } catch {
      return "Erreur Resend non sérialisable";
    }
  }

  return String(error);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isResendDomainVerificationError(message: string) {
  const value = message.toLowerCase();

  return (
    value.includes("verify") ||
    value.includes("verified") ||
    value.includes("domain") ||
    value.includes("testing emails") ||
    value.includes("own email address") ||
    value.includes("onboarding@resend.dev")
  );
}

function testFallbackEnabled() {
  return process.env.RESEND_TEST_MODE === "true" && Boolean(process.env.RESEND_TEST_TO_EMAIL);
}

export function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "DevisFlow <onboarding@resend.dev>";
}

export async function sendTransactionalEmail(
  resend: ResendLikeClient,
  options: ResendSendOptions,
  context: string
): Promise<EmailDeliveryResult> {
  const result = await resend.emails.send(options);

  if (!result.error) {
    return {
      success: true,
      data: result.data,
      testFallback: false,
      sentToOriginalRecipient: true,
    };
  }

  const message = extractResendMessage(result.error);
  console.error(`Erreur Resend ${context}:`, result.error);

  if (isResendDomainVerificationError(message) && testFallbackEnabled()) {
    const testRecipient = process.env.RESEND_TEST_TO_EMAIL as string;
    const fallback = await resend.emails.send({
      ...options,
      from: "DevisFlow <onboarding@resend.dev>",
      to: testRecipient,
      subject: `[TEST DevisFlow] ${options.subject}`,
      html: `
        <div style="padding:12px 16px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
          Email redirigé en mode test. Destinataire réel prévu : ${escapeHtml(options.to)}
        </div>
        ${options.html}
      `,
    });

    if (!fallback.error) {
      return {
        success: true,
        data: fallback.data,
        testFallback: true,
        sentToOriginalRecipient: false,
        warning:
          "Resend a refusé l'envoi au client, probablement à cause d'un domaine expéditeur non vérifié. L'email a été envoyé à l'adresse de test configurée.",
      };
    }

    const fallbackMessage = extractResendMessage(fallback.error);
    console.error(`Erreur Resend fallback ${context}:`, fallback.error);

    return {
      success: false,
      error:
        "Resend refuse l'envoi et le fallback de test a échoué. Vérifie RESEND_FROM_EMAIL, RESEND_TEST_TO_EMAIL et le domaine Resend.",
      details: `${message} / fallback: ${fallbackMessage}`,
    };
  }

  if (isResendDomainVerificationError(message)) {
    return {
      success: false,
      error:
        "Resend refuse l'envoi. Vérifie que RESEND_FROM_EMAIL utilise un domaine validé dans Resend, ou configure RESEND_TEST_MODE=true avec RESEND_TEST_TO_EMAIL pour tester.",
      details: message,
    };
  }

  return {
    success: false,
    error: `Erreur Resend: ${message}`,
    details: message,
  };
}
