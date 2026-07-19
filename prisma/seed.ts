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

async function main() {
  await seedFacultiesAndMajors();
  await seedDevUsers();
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
