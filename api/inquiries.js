import { verifyToken } from "./_lib/auth.js";
import { sendInquiryEmail } from "./_lib/email.js";
import { readData, writeData } from "./_lib/storage.js";

const REQUIRED_FIELDS = ["fullName", "email", "phone", "projectType", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimValue = (value) => String(value || "").trim();

const validateInquiry = (body) => {
  if (trimValue(body.website)) {
    return { honeypot: true };
  }

  const inquiry = {
    id: body.id || `inq-${Date.now()}`,
    fullName: trimValue(body.fullName),
    company: trimValue(body.company),
    email: trimValue(body.email),
    phone: trimValue(body.phone),
    projectType: trimValue(body.projectType),
    budget: trimValue(body.budget),
    message: trimValue(body.message),
    createdAt: body.createdAt || new Date().toISOString(),
    read: false,
  };

  const missing = REQUIRED_FIELDS.filter((field) => !inquiry[field]);
  if (missing.length) {
    return { error: `Missing required fields: ${missing.join(", ")}` };
  }

  if (!EMAIL_PATTERN.test(inquiry.email)) {
    return { error: "Enter a valid email address." };
  }

  if (inquiry.phone.replace(/\s/g, "").length < 6) {
    return { error: "Enter a valid phone number." };
  }

  return { inquiry };
};

const emptyPayload = () => ({
  version: 2,
  updatedAt: new Date().toISOString(),
  inquiries: [],
});

const readInquiries = async () => {
  const data = (await readData("inquiries.json")) || emptyPayload();
  return Array.isArray(data.inquiries) ? data.inquiries : [];
};

const saveInquiries = async (inquiries) => {
  const payload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    inquiries,
  };
  await writeData("inquiries.json", payload);
  return payload;
};

export async function PUT(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.inquiries)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = await saveInquiries(body.inquiries);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inquiries = await readInquiries();
    return Response.json({ version: 2, inquiries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = validateInquiry(body);

    if (parsed.honeypot) {
      return Response.json({ ok: true }, { status: 201 });
    }

    if (parsed.error) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const inquiry = parsed.inquiry;
    const inquiries = [inquiry, ...(await readInquiries())];
    const payload = await saveInquiries(inquiries);

    let emailSent = false;
    try {
      const result = await sendInquiryEmail(inquiry);
      emailSent = Boolean(result?.sent);
    } catch (error) {
      console.error("[POST /api/inquiries] email failed", {
        error: error.message,
        inquiryId: inquiry.id,
      });
    }

    return Response.json({ inquiry, emailSent, ...payload }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return Response.json({ error: "Missing inquiry id" }, { status: 400 });
    }

    const inquiries = (await readInquiries()).map((item) =>
      item.id === body.id ? { ...item, read: Boolean(body.read) } : item
    );
    const payload = await saveInquiries(inquiries);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!verifyToken(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing inquiry id" }, { status: 400 });
    }

    const inquiries = (await readInquiries()).filter((item) => item.id !== id);
    const payload = await saveInquiries(inquiries);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
