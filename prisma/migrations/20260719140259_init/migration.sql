-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('normal', 'special');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'admin');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('university', 'faculty');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('culture', 'academic', 'sports', 'volunteer', 'ethics');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('mandatory_core', 'mandatory_elective', 'practice');

-- CreateEnum
CREATE TYPE "CheckinMethod" AS ENUM ('realtime', 'self_report');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('open', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceCheckinMethod" AS ENUM ('realtime', 'self_report', 'late_request');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('auto_approved', 'flagged', 'rejected');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "student_id" TEXT,
    "enrollment_year" INTEGER,
    "current_year" INTEGER,
    "program_type" "ProgramType",
    "faculty_id" TEXT,
    "major_id" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "banned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "ActivityLevel" NOT NULL,
    "activity_category" "ActivityCategory" NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "allowed_radius" INTEGER,
    "location_name" TEXT,
    "credit_hours" DOUBLE PRECISION NOT NULL,
    "checkin_method" "CheckinMethod" NOT NULL DEFAULT 'realtime',
    "requires_gps" BOOLEAN NOT NULL DEFAULT true,
    "activity_code" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'open',
    "important_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_restrictions" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "faculty_id" TEXT,
    "major_id" TEXT,
    "year_level" INTEGER,

    CONSTRAINT "activity_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "checkin_method" "AttendanceCheckinMethod" NOT NULL,
    "checkin_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_lat" DOUBLE PRECISION,
    "student_lng" DOUBLE PRECISION,
    "distance_meters" DOUBLE PRECISION,
    "device_uuid" TEXT,
    "photo_path" TEXT,
    "status" "AttendanceStatus" NOT NULL,
    "flag_reason" TEXT,
    "reject_reason" TEXT,
    "credited_hours" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_activity_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "activity_category" "ActivityCategory" NOT NULL,
    "hours_requested" DOUBLE PRECISION NOT NULL,
    "hours_approved" DOUBLE PRECISION,
    "evidence_file" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_activity_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transfer_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hours_requested" DOUBLE PRECISION NOT NULL,
    "hours_approved" DOUBLE PRECISION,
    "evidence_file" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "late_checkin_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "hours_approved" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "late_checkin_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE INDEX "users_faculty_id_idx" ON "users"("faculty_id");

-- CreateIndex
CREATE INDEX "users_major_id_idx" ON "users"("major_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "majors_faculty_id_idx" ON "majors"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "activities_activity_code_key" ON "activities"("activity_code");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_academic_year_semester_idx" ON "activities"("academic_year", "semester");

-- CreateIndex
CREATE INDEX "activity_restrictions_activity_id_idx" ON "activity_restrictions"("activity_id");

-- CreateIndex
CREATE INDEX "attendances_activity_id_idx" ON "attendances"("activity_id");

-- CreateIndex
CREATE INDEX "attendances_user_id_idx" ON "attendances"("user_id");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_activity_id_device_uuid_idx" ON "attendances"("activity_id", "device_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_activity_id_key" ON "attendances"("user_id", "activity_id");

-- CreateIndex
CREATE INDEX "external_activity_requests_user_id_idx" ON "external_activity_requests"("user_id");

-- CreateIndex
CREATE INDEX "external_activity_requests_status_idx" ON "external_activity_requests"("status");

-- CreateIndex
CREATE INDEX "credit_transfer_requests_user_id_idx" ON "credit_transfer_requests"("user_id");

-- CreateIndex
CREATE INDEX "credit_transfer_requests_status_idx" ON "credit_transfer_requests"("status");

-- CreateIndex
CREATE INDEX "late_checkin_requests_user_id_idx" ON "late_checkin_requests"("user_id");

-- CreateIndex
CREATE INDEX "late_checkin_requests_activity_id_idx" ON "late_checkin_requests"("activity_id");

-- CreateIndex
CREATE INDEX "late_checkin_requests_status_idx" ON "late_checkin_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "majors" ADD CONSTRAINT "majors_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_restrictions" ADD CONSTRAINT "activity_restrictions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_restrictions" ADD CONSTRAINT "activity_restrictions_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_restrictions" ADD CONSTRAINT "activity_restrictions_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_activity_requests" ADD CONSTRAINT "external_activity_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transfer_requests" ADD CONSTRAINT "credit_transfer_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_checkin_requests" ADD CONSTRAINT "late_checkin_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_checkin_requests" ADD CONSTRAINT "late_checkin_requests_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
