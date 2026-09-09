const PROJECT_TYPE_LABELS = {
  branding: "Brand Identity",
  packaging: "Packaging Design",
  direction: "Creative Direction",
  product: "Product Design",
  rebrand: "Rebrand / Redesign",
  marketing: "Full-Service Marketing",
  smm: "SMM & Meta Ads",
  other: "Other",
};

const BUDGET_LABELS = {
  "under-5k": "Under $5,000",
  "5k-15k": "$5,000 – $15,000",
  "15k-50k": "$15,000 – $50,000",
  "50k-plus": "$50,000+",
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const labelFor = (map, value, fallback = "Not provided") =>
  map[value] || value || fallback;

const inquiryTo = () => process.env.INQUIRY_EMAIL_TO || "info@thespiritcreative.com";

const buildHtml = (inquiry) => {
  const projectType = labelFor(PROJECT_TYPE_LABELS, inquiry.projectType);
  const budget = labelFor(BUDGET_LABELS, inquiry.budget, "Not provided");
  const company = inquiry.company || "Not provided";
  const submittedAt = new Date(inquiry.createdAt || Date.now()).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#111;line-height:1.6;max-width:640px;">
      <h2 style="margin:0 0 16px;font-size:24px;">New project request</h2>
      <p style="margin:0 0 24px;color:#444;">Submitted ${escapeHtml(submittedAt)} from thespiritcreative.com</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;"><strong>${escapeHtml(inquiry.fullName)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(inquiry.email)}">${escapeHtml(inquiry.email)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${escapeHtml(inquiry.phone)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Company</td><td style="padding:8px 0;">${escapeHtml(company)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Project type</td><td style="padding:8px 0;">${escapeHtml(projectType)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Budget</td><td style="padding:8px 0;">${escapeHtml(budget)}</td></tr>
      </table>
      <h3 style="margin:28px 0 12px;font-size:16px;">Message</h3>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(inquiry.message)}</p>
    </div>
  `.trim();
};

const sendWithResend = async (inquiry) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "missing-key" };

  const from =
    process.env.INQUIRY_EMAIL_FROM || "The Spirit Creative <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      from,
      to: [inquiryTo()],
      reply_to: inquiry.email || undefined,
      subject: `New project request — ${inquiry.fullName}`,
      html: buildHtml(inquiry),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Email API failed (${response.status})`);
  }

  return { sent: true, via: "resend" };
};

const sendWithFormSubmit = async (inquiry) => {
  const to = inquiryTo();
  const fields = new URLSearchParams({
    _subject: `New project request — ${inquiry.fullName}`,
    _template: "table",
    _captcha: "false",
    name: inquiry.fullName,
    email: inquiry.email,
    phone: inquiry.phone,
    company: inquiry.company || "Not provided",
    projectType: labelFor(PROJECT_TYPE_LABELS, inquiry.projectType),
    budget: labelFor(BUDGET_LABELS, inquiry.budget, "Not provided"),
    message: inquiry.message,
  });

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    body: fields,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text.slice(0, 300) || `Form email failed (${response.status})`);
  }

  try {
    const data = JSON.parse(text);
    if (data.success === false) throw new Error(data.message || "Form email failed");
  } catch (error) {
    if (error instanceof SyntaxError) {
      /* non-JSON success bodies still count as sent */
    } else {
      throw error;
    }
  }

  return { sent: true, via: "formsubmit" };
};

export const sendInquiryEmail = async (inquiry) => {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(inquiry);
  }

  return sendWithFormSubmit(inquiry);
};
