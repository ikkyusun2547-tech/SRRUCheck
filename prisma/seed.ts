import "dotenv/config";
import { PrismaClient, ProgramType } from "@prisma/client";

const prisma = new PrismaClient();

// Placeholder faculty/major data — replace via the Excel/CSV import feature
// (admin > จัดการคณะ/สาขา, phase 4) once the real list is available.
const FACULTIES = [
  {
    nameTh: "คณะครุศาสตร์",
    nameEn: "Faculty of Education",
    majors: [
      { nameTh: "การประถมศึกษา", nameEn: "Elementary Education" },
      { nameTh: "พลศึกษา", nameEn: "Physical Education" },
    ],
  },
  {
    nameTh: "คณะวิทยาศาสตร์และเทคโนโลยี",
    nameEn: "Faculty of Science and Technology",
    majors: [
      { nameTh: "วิทยาการคอมพิวเตอร์", nameEn: "Computer Science" },
      { nameTh: "เทคโนโลยีสารสนเทศ", nameEn: "Information Technology" },
    ],
  },
  {
    nameTh: "คณะวิทยาการจัดการ",
    nameEn: "Faculty of Management Science",
    majors: [
      { nameTh: "บริหารธุรกิจ", nameEn: "Business Administration" },
      { nameTh: "การบัญชี", nameEn: "Accounting" },
    ],
  },
];

async function seedFacultiesAndMajors() {
  for (const faculty of FACULTIES) {
    const existingFaculty = await prisma.faculty.findFirst({ where: { nameEn: faculty.nameEn } });
    const created =
      existingFaculty ??
      (await prisma.faculty.create({ data: { nameTh: faculty.nameTh, nameEn: faculty.nameEn } }));

    for (const major of faculty.majors) {
      const existingMajor = await prisma.major.findFirst({
        where: { facultyId: created.id, nameEn: major.nameEn },
      });
      if (!existingMajor) {
        await prisma.major.create({
          data: { facultyId: created.id, nameTh: major.nameTh, nameEn: major.nameEn },
        });
      }
    }
  }
}

async function seedDevUsers() {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "srru.ac.th";
  const cs = await prisma.faculty.findFirst({ where: { nameEn: "Faculty of Science and Technology" } });
  const csMajor = cs
    ? await prisma.major.findFirst({ where: { facultyId: cs.id, nameEn: "Computer Science" } })
    : null;

  await prisma.user.upsert({
    where: { email: `admin@${domain}` },
    update: {},
    create: {
      email: `admin@${domain}`,
      title: "อาจารย์",
      firstName: "แอดมิน",
      lastName: "กองพัฒนานักศึกษา",
      role: "admin",
      profileCompleted: true,
    },
  });

  await prisma.user.upsert({
    where: { email: `student1@${domain}` },
    update: {},
    create: {
      email: `student1@${domain}`,
      title: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      studentId: "65123456789",
      enrollmentYear: 2565,
      currentYear: 2,
      programType: ProgramType.normal,
      facultyId: cs?.id,
      majorId: csMajor?.id,
      role: "student",
      profileCompleted: true,
    },
  });

  // Deliberately incomplete profile — exercises the /setup-profile redirect.
  await prisma.user.upsert({
    where: { email: `student2@${domain}` },
    update: {},
    create: {
      email: `student2@${domain}`,
      role: "student",
      profileCompleted: false,
    },
  });
}

// Approximate Surin, Thailand coordinates — placeholder until an admin
// pins the real location via the activity management UI (phase 4).
const SRRU_LAT = 14.881;
const SRRU_LNG = 103.493;

async function seedActivities() {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  await prisma.activity.upsert({
    where: { activityCode: "ACT-DEMO-001" },
    // Re-running the seed (e.g. days later, in a fresh dev session) should
    // put this demo activity back into its intended "currently open,
    // usable for a live check-in test" state rather than leaving it
    // however a previous session's clock left it — status/time fields are
    // the only ones worth refreshing; everything else is stable metadata.
    update: { status: "open", startTime: new Date(now - HOUR), endTime: new Date(now + 2 * HOUR) },
    create: {
      title: "ปฐมนิเทศนักศึกษาใหม่ (ตัวอย่าง)",
      description: "กิจกรรมตัวอย่างสำหรับทดสอบเช็คชื่อแบบสามประสาน (QR + GPS + เซลฟี)",
      level: "university",
      activityCategory: "academic",
      activityType: "mandatory_core",
      academicYear: 2569,
      semester: 1,
      startTime: new Date(now - HOUR),
      endTime: new Date(now + 2 * HOUR),
      locationLat: SRRU_LAT,
      locationLng: SRRU_LNG,
      allowedRadius: 150,
      locationName: "หอประชุมมหาวิทยาลัยราชภัฏสุรินทร์ (ตำแหน่งตัวอย่าง)",
      creditHours: 3,
      checkinMethod: "realtime",
      requiresGps: true,
      activityCode: "ACT-DEMO-001",
      status: "open",
    },
  });

  await prisma.activity.upsert({
    where: { activityCode: "ACT-DEMO-002" },
    update: { status: "open", startTime: new Date(now - HOUR), endTime: new Date(now + 3 * HOUR) },
    create: {
      title: "จิตอาสาพัฒนาชุมชน (ตัวอย่าง — แนบหลักฐานเอง)",
      description: "กิจกรรมตัวอย่างสำหรับทดสอบ self-report check-in",
      level: "faculty",
      activityCategory: "volunteer",
      activityType: "mandatory_elective",
      academicYear: 2569,
      semester: 1,
      startTime: new Date(now - HOUR),
      endTime: new Date(now + 3 * HOUR),
      creditHours: 2,
      checkinMethod: "self_report",
      requiresGps: false,
      activityCode: "ACT-DEMO-002",
      status: "open",
    },
  });

  await prisma.activity.upsert({
    where: { activityCode: "ACT-DEMO-003" },
    // Always kept in the past — this one exists specifically to test that
    // checking in against an already-ended activity is rejected.
    update: {
      status: "closed",
      startTime: new Date(now - 7 * 24 * HOUR),
      endTime: new Date(now - 7 * 24 * HOUR + 2 * HOUR),
    },
    create: {
      title: "กิจกรรมที่ปิดรับเช็คชื่อแล้ว (ตัวอย่าง)",
      description: "ใช้ทดสอบว่าเช็คชื่อกิจกรรมที่ปิดแล้วถูกปฏิเสธอย่างถูกต้อง",
      level: "university",
      activityCategory: "sports",
      activityType: "mandatory_elective",
      academicYear: 2569,
      semester: 1,
      startTime: new Date(now - 7 * 24 * HOUR),
      endTime: new Date(now - 7 * 24 * HOUR + 2 * HOUR),
      locationLat: SRRU_LAT,
      locationLng: SRRU_LNG,
      allowedRadius: 100,
      creditHours: 2,
      checkinMethod: "realtime",
      requiresGps: true,
      activityCode: "ACT-DEMO-003",
      status: "closed",
    },
  });
}

async function main() {
  await seedFacultiesAndMajors();
  await seedDevUsers();
  await seedActivities();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
