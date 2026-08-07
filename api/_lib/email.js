const PROJECT_TYPE_LABELS = {
  branding: "Brand Identity",
  packaging: "Packaging Design",
  direction: "Creative Direction",
  product: "Product Design",
  rebrand: "Rebrand / Redesign",
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

export const sendInquiryEmail = async (inquiry) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const to = process.env.INQUIRY_EMAIL_TO || "info@thespiritcreative.com";
  const from =
    process.env.INQUIRY_EMAIL_FROM || "The Spirit Creative <onboarding@resend.dev>";

  const projectType = labelFor(PROJECT_TYPE_LABELS, inquiry.projectType);
  const budget = labelFor(BUDGET_LABELS, inquiry.budget, "Not provided");
  const company = inquiry.company || "Not provided";
  const submittedAt = new Date(inquiry.createdAt || Date.now()).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: inquiry.email || undefined,
      subject: `New project request — ${inquiry.fullName}`,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Email API failed (${response.status})`);
  }

  return { sent: true };
};
