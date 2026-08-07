import { verifyToken } from "./_lib/auth.js";
import { sendInquiryEmail } from "./_lib/email.js";
import { readData, writeData } from "./_lib/storage.js";

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
    const inquiry = {
      id: body.id || `inq-${Date.now()}`,
      fullName: body.fullName || "",
      company: body.company || "",
      email: body.email || "",
      phone: body.phone || "",
      projectType: body.projectType || "",
      budget: body.budget || "",
      message: body.message || "",
      createdAt: body.createdAt || new Date().toISOString(),
      read: false,
    };

    const inquiries = [inquiry, ...(await readInquiries())];
    const payload = await saveInquiries(inquiries);

    try {
      await sendInquiryEmail(inquiry);
    } catch (error) {
      console.error("[POST /api/inquiries] email failed", {
        error: error.message,
        inquiryId: inquiry.id,
      });
    }

    return Response.json({ inquiry, ...payload }, { status: 201 });
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
