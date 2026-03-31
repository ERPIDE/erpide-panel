import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getAdmins,
  saveAdmins,
  getCustomers,
  saveCustomers,
  SESSION_COOKIE,
} from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session || session.userType !== "admin") return null;
  return session;
}

// GET — list all users
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz erişim" },
      { status: 401 }
    );
  }

  const [admins, customers] = await Promise.all([
    getAdmins(),
    getCustomers(),
  ]);

  // Strip passwords from response
  const safeAdmins = admins.map(({ password: _, ...rest }) => rest);
  const safeCustomers = customers.map(({ password: _, ...rest }) => rest);

  return NextResponse.json({ admins: safeAdmins, customers: safeCustomers });
}

// POST — create user
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz erişim" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { type, ...userData } = body;

    if (type === "admin") {
      const { name, email, password, role } = userData;
      if (!name || !email || !password || !role) {
        return NextResponse.json(
          { error: "Tüm alanlar gerekli" },
          { status: 400 }
        );
      }

      const admins = await getAdmins();

      // Check duplicate email
      if (admins.some((a) => a.email === email)) {
        return NextResponse.json(
          { error: "Bu email zaten kayıtlı" },
          { status: 409 }
        );
      }

      const newAdmin = {
        id: `a${Date.now()}`,
        name,
        email,
        password,
        role: role as "admin" | "developer",
      };

      admins.push(newAdmin);
      await saveAdmins(admins);

      const { password: _, ...safe } = newAdmin;
      return NextResponse.json({ success: true, user: safe }, { status: 201 });
    }

    if (type === "customer") {
      const { code, name, password, project, contactEmail, contactPhone } =
        userData;
      if (!code || !name || !password || !project || !contactEmail) {
        return NextResponse.json(
          { error: "Tüm zorunlu alanlar gerekli" },
          { status: 400 }
        );
      }

      const customers = await getCustomers();

      if (customers.some((c) => c.code === code)) {
        return NextResponse.json(
          { error: "Bu müşteri kodu zaten kayıtlı" },
          { status: 409 }
        );
      }

      const newCustomer = {
        id: `c${Date.now()}`,
        code,
        name,
        password,
        project,
        contactEmail,
        contactPhone,
      };

      customers.push(newCustomer);
      await saveCustomers(customers);

      const { password: _, ...safe } = newCustomer;
      return NextResponse.json({ success: true, user: safe }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Geçersiz kullanıcı tipi" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// DELETE — remove user
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz erişim" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID ve tip gerekli" },
        { status: 400 }
      );
    }

    if (type === "admin") {
      const admins = await getAdmins();
      const filtered = admins.filter((a) => a.id !== id);
      if (filtered.length === admins.length) {
        return NextResponse.json(
          { error: "Kullanıcı bulunamadı" },
          { status: 404 }
        );
      }
      if (filtered.length === 0) {
        return NextResponse.json(
          { error: "Son admin silinemez" },
          { status: 400 }
        );
      }
      await saveAdmins(filtered);
      return NextResponse.json({ success: true });
    }

    if (type === "customer") {
      const customers = await getCustomers();
      const filtered = customers.filter((c) => c.id !== id);
      if (filtered.length === customers.length) {
        return NextResponse.json(
          { error: "Müşteri bulunamadı" },
          { status: 404 }
        );
      }
      await saveCustomers(filtered);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Geçersiz kullanıcı tipi" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
