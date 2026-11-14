/*
  Warnings:

  - The values [MOCK_INTERVIEW] on the enum `AssessmentType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENROLLING,RUNNING] on the enum `BatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANCELLED] on the enum `EnrollmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [INTERESTED,PROSPECT,PIPELINE,PENDING_CLOSURE,ENROLLED] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [OTHER] on the enum `TicketCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [WAITING_ON_STUDENT,CLOSED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [COUNSELLOR,SUPPORT_STAFF,PLACEMENT_MANAGER,RECRUITER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `candidateId` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to alter the column `score` on the `assessments` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - The `status` column on the `assessments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `assignmentId` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `attemptNumber` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submissionText` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submissionUrl` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `assignment_submissions` table. All the data in the column will be lost.
  - The `status` column on the `assignment_submissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `candidateId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `batchCode` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `trainerId` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `campaignSource` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `candidateCode` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `careerGapMonths` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `codingPreference` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `communicationPrefs` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `consentGiven` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `courseInterest` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `currentEmployment` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `learningAvailability` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSchedule` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `previousTraining` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `resumeUrl` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `targetRole` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `utmCampaign` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `utmContent` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `utmMedium` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `utmSource` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `utmTerm` on the `candidates` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `learningOutcomes` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `candidateId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrolledAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `closingDate` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `employmentType` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `jobUrl` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `minExperience` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `openings` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `postingCode` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `salaryMax` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `salaryMin` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `job_postings` table. All the data in the column will be lost.
  - You are about to drop the column `candidateId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `consentGiven` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `courseInterest` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `leadCode` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `utmCampaign` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `utmContent` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `utmMedium` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `utmSource` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `utmTerm` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `moduleId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `otp_codes` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `otp_codes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `otp_codes` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `otp_codes` table. All the data in the column will be lost.
  - You are about to drop the column `attemptNumber` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `milestoneId` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submissionText` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submissionUrl` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `vivaNotes` on the `project_submissions` table. All the data in the column will be lost.
  - The `status` column on the `project_submissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `businessProblem` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `expectedOutcome` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `campaignSource` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `candidateId` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `codingPreference` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `communicationPrefs` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `consentGiven` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `courseInterest` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `currentEmployment` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `graduationYear` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `learningAvailability` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSchedule` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `resumeUrl` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `targetRole` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `accessToken` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `dueAt` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `firstResponseAt` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `ticketCode` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `support_tickets` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `ticket_comments` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `ticket_comments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ticket_comments` table. All the data in the column will be lost.
  - You are about to drop the column `isInternal` on the `ticket_comments` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `ticket_comments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `batch_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `candidate_project_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoint_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoint_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expert_mock_interviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_checks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lesson_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lesson_resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `live_classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `placement_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `placement_interviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `placement_offers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `placement_pipeline_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `placement_readiness_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_milestones` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[candidate_code]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[candidate_id,product_id]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lead_code]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[access_token]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refresh_token]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `candidate_id` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignment_id` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_code` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_name` to the `job_postings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_title` to the `job_postings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lead_code` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module_id` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_index` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `otp_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `otp_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `project_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `project_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `access_token` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `support_tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `support_tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `ticket_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_id` to the `ticket_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('META', 'GOOGLE', 'YOUTUBE', 'LINKEDIN', 'ORGANIC', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductCode" AS ENUM ('TECH_TRAINING', 'INTERVIEW_PREP', 'PLACEMENT_SUPPORT', 'SOFT_SKILLS', 'COMPLETE_PACKAGE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TrialSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('REGISTRATION', 'AFTER_SESSION_1', 'AFTER_SESSION_2', 'AFTER_SESSION_3', 'PLUS_24H', 'PLUS_72H', 'PLUS_7D');

-- CreateEnum
CREATE TYPE "AutomationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TRAINER_EXPLANATION', 'LAB', 'NOTES', 'ASSIGNMENT', 'QUIZ', 'PRACTICAL', 'INTERVIEW_QUESTIONS', 'AI_DOUBT_ASSISTANT');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'AI_REVIEWED', 'MENTOR_APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReadinessClassification" AS ENUM ('JOB_READY', 'TARGETED_BRUSHUP', 'STRUCTURED_PREPARATION');

-- CreateEnum
CREATE TYPE "MockType" AS ENUM ('AI_PRACTICE', 'EXPERT_MOCK');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('PENDING', 'QUALIFIED', 'APPROVED_FOR_PLACEMENT');

-- CreateEnum
CREATE TYPE "SubmissionChannel" AS ENUM ('PORTAL', 'HR', 'DIRECT_VENDOR', 'CLIENT');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('PROFILE_REVIEW', 'PREPARATION_PENDING', 'JOB_READY', 'RESUME_APPROVED', 'JOBS_MATCHED', 'SUBMITTED', 'INTERVIEW_SCHEDULED', 'FEEDBACK_AWAITED', 'SELECTED', 'OFFER_RECEIVED', 'JOINED');

-- CreateEnum
CREATE TYPE "RecoveryStatus" AS ENUM ('ACTIVE', 'PAUSED_FOR_BRUSHUP', 'RESUMED', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "AssessmentType_new" AS ENUM ('FREE_ASSESSMENT', 'CAREER_READINESS', 'TECHNICAL', 'AI_MOCK_DIAGNOSTIC', 'MODULE_QUIZ', 'FORMAL_READINESS');
ALTER TABLE "assessments" ALTER COLUMN "type" TYPE "AssessmentType_new" USING ("type"::text::"AssessmentType_new");
ALTER TYPE "AssessmentType" RENAME TO "AssessmentType_old";
ALTER TYPE "AssessmentType_new" RENAME TO "AssessmentType";
DROP TYPE "AssessmentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BatchStatus_new" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "batches" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "batches" ALTER COLUMN "status" TYPE "BatchStatus_new" USING ("status"::text::"BatchStatus_new");
ALTER TYPE "BatchStatus" RENAME TO "BatchStatus_old";
ALTER TYPE "BatchStatus_new" RENAME TO "BatchStatus";
DROP TYPE "BatchStatus_old";
ALTER TABLE "batches" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EnrollmentStatus_new" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED');
ALTER TABLE "enrollments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "enrollments" ALTER COLUMN "status" TYPE "EnrollmentStatus_new" USING ("status"::text::"EnrollmentStatus_new");
ALTER TYPE "EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "EnrollmentStatus_old";
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DROPPED');
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "LeadStatus_old";
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketCategory_new" AS ENUM ('LMS', 'PAYMENT', 'SCHEDULE', 'TRAINER', 'ASSIGNMENT', 'PROJECT', 'INTERVIEW', 'RESUME', 'MOCK', 'PLACEMENT', 'TECHNICAL');
ALTER TABLE "support_tickets" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "support_tickets" ALTER COLUMN "category" TYPE "TicketCategory_new" USING ("category"::text::"TicketCategory_new");
ALTER TYPE "TicketCategory" RENAME TO "TicketCategory_old";
ALTER TYPE "TicketCategory_new" RENAME TO "TicketCategory";
DROP TYPE "TicketCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');
ALTER TABLE "support_tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "support_tickets" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "TicketStatus_old";
ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'TRAINER', 'MENTOR', 'ADMIN', 'SUPER_ADMIN', 'MARKETING', 'SUPPORT', 'PLACEMENT');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "batch_members" DROP CONSTRAINT "batch_members_batchId_fkey";

-- DropForeignKey
ALTER TABLE "batch_members" DROP CONSTRAINT "batch_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "batches" DROP CONSTRAINT "batches_courseId_fkey";

-- DropForeignKey
ALTER TABLE "batches" DROP CONSTRAINT "batches_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "candidate_project_reviews" DROP CONSTRAINT "candidate_project_reviews_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_userId_fkey";

-- DropForeignKey
ALTER TABLE "checkpoint_attempts" DROP CONSTRAINT "checkpoint_attempts_checkpointId_fkey";

-- DropForeignKey
ALTER TABLE "checkpoint_attempts" DROP CONSTRAINT "checkpoint_attempts_userId_fkey";

-- DropForeignKey
ALTER TABLE "checkpoint_questions" DROP CONSTRAINT "checkpoint_questions_checkpointId_fkey";

-- DropForeignKey
ALTER TABLE "checkpoints" DROP CONSTRAINT "checkpoints_courseId_fkey";

-- DropForeignKey
ALTER TABLE "class_attendance" DROP CONSTRAINT "class_attendance_liveClassId_fkey";

-- DropForeignKey
ALTER TABLE "class_attendance" DROP CONSTRAINT "class_attendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "course_modules" DROP CONSTRAINT "course_modules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_userId_fkey";

-- DropForeignKey
ALTER TABLE "expert_mock_interviews" DROP CONSTRAINT "expert_mock_interviews_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_progress" DROP CONSTRAINT "lesson_progress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_progress" DROP CONSTRAINT "lesson_progress_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_resources" DROP CONSTRAINT "lesson_resources_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "live_classes" DROP CONSTRAINT "live_classes_batchId_fkey";

-- DropForeignKey
ALTER TABLE "live_classes" DROP CONSTRAINT "live_classes_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "otp_codes" DROP CONSTRAINT "otp_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "placement_applications" DROP CONSTRAINT "placement_applications_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "placement_applications" DROP CONSTRAINT "placement_applications_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "placement_applications" DROP CONSTRAINT "placement_applications_jobPostingId_fkey";

-- DropForeignKey
ALTER TABLE "placement_interviews" DROP CONSTRAINT "placement_interviews_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "placement_offers" DROP CONSTRAINT "placement_offers_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "placement_pipeline_history" DROP CONSTRAINT "placement_pipeline_history_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "placement_readiness_reviews" DROP CONSTRAINT "placement_readiness_reviews_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "project_milestones" DROP CONSTRAINT "project_milestones_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_submissions" DROP CONSTRAINT "project_submissions_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "project_submissions" DROP CONSTRAINT "project_submissions_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "project_submissions" DROP CONSTRAINT "project_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_courseId_fkey";

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_userId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_comments" DROP CONSTRAINT "ticket_comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_comments" DROP CONSTRAINT "ticket_comments_ticketId_fkey";

-- DropIndex
DROP INDEX "assessments_candidateId_idx";

-- DropIndex
DROP INDEX "assessments_type_idx";

-- DropIndex
DROP INDEX "assignment_submissions_assignmentId_userId_attemptNumber_key";

-- DropIndex
DROP INDEX "assignment_submissions_status_submittedAt_idx";

-- DropIndex
DROP INDEX "assignment_submissions_userId_assignmentId_idx";

-- DropIndex
DROP INDEX "assignments_lessonId_key";

-- DropIndex
DROP INDEX "audit_logs_action_idx";

-- DropIndex
DROP INDEX "audit_logs_candidateId_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_idx";

-- DropIndex
DROP INDEX "batches_batchCode_key";

-- DropIndex
DROP INDEX "batches_courseId_status_idx";

-- DropIndex
DROP INDEX "batches_status_startDate_idx";

-- DropIndex
DROP INDEX "candidates_candidateCode_idx";

-- DropIndex
DROP INDEX "candidates_candidateCode_key";

-- DropIndex
DROP INDEX "candidates_userId_key";

-- DropIndex
DROP INDEX "courses_status_level_idx";

-- DropIndex
DROP INDEX "enrollments_courseId_idx";

-- DropIndex
DROP INDEX "enrollments_userId_courseId_key";

-- DropIndex
DROP INDEX "enrollments_userId_status_idx";

-- DropIndex
DROP INDEX "job_postings_companyName_idx";

-- DropIndex
DROP INDEX "job_postings_postingCode_key";

-- DropIndex
DROP INDEX "job_postings_status_createdAt_idx";

-- DropIndex
DROP INDEX "leads_leadCode_key";

-- DropIndex
DROP INDEX "leads_status_idx";

-- DropIndex
DROP INDEX "lessons_moduleId_idx";

-- DropIndex
DROP INDEX "lessons_moduleId_sortOrder_key";

-- DropIndex
DROP INDEX "otp_codes_purpose_idx";

-- DropIndex
DROP INDEX "otp_codes_userId_idx";

-- DropIndex
DROP INDEX "project_submissions_milestoneId_userId_attemptNumber_key";

-- DropIndex
DROP INDEX "project_submissions_status_submittedAt_idx";

-- DropIndex
DROP INDEX "project_submissions_userId_milestoneId_idx";

-- DropIndex
DROP INDEX "projects_courseId_sortOrder_key";

-- DropIndex
DROP INDEX "registrations_candidateId_key";

-- DropIndex
DROP INDEX "sessions_accessToken_key";

-- DropIndex
DROP INDEX "sessions_refreshToken_key";

-- DropIndex
DROP INDEX "sessions_userId_idx";

-- DropIndex
DROP INDEX "support_tickets_category_idx";

-- DropIndex
DROP INDEX "support_tickets_ownerId_status_idx";

-- DropIndex
DROP INDEX "support_tickets_status_createdAt_idx";

-- DropIndex
DROP INDEX "support_tickets_ticketCode_key";

-- DropIndex
DROP INDEX "support_tickets_userId_status_idx";

-- DropIndex
DROP INDEX "ticket_comments_ticketId_createdAt_idx";

-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "candidateId",
DROP COLUMN "completedAt",
DROP COLUMN "createdAt",
DROP COLUMN "createdByUserId",
DROP COLUMN "maxScore",
DROP COLUMN "startedAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_user_id" TEXT,
ADD COLUMN     "max_score" DECIMAL(5,2),
ADD COLUMN     "related_module_id" TEXT,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "score" SET DATA TYPE DECIMAL(5,2),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "assignment_submissions" DROP COLUMN "assignmentId",
DROP COLUMN "attemptNumber",
DROP COLUMN "feedback",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewerId",
DROP COLUMN "submissionText",
DROP COLUMN "submissionUrl",
DROP COLUMN "submittedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "assignment_id" TEXT NOT NULL,
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "score" DECIMAL(5,2),
ADD COLUMN     "submission_url" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "createdAt",
DROP COLUMN "isRequired",
DROP COLUMN "lessonId",
DROP COLUMN "updatedAt",
ADD COLUMN     "due_date_offset_days" INTEGER,
ADD COLUMN     "lesson_id" TEXT,
ALTER COLUMN "instructions" DROP NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "candidateId",
DROP COLUMN "createdAt",
DROP COLUMN "details",
DROP COLUMN "ipAddress",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "batches" DROP COLUMN "batchCode",
DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "endDate",
DROP COLUMN "notes",
DROP COLUMN "schedule",
DROP COLUMN "startDate",
DROP COLUMN "trainerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "start_date" DATE,
ADD COLUMN     "trainer_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "candidates" DROP COLUMN "campaignSource",
DROP COLUMN "candidateCode",
DROP COLUMN "careerGapMonths",
DROP COLUMN "codingPreference",
DROP COLUMN "communicationPrefs",
DROP COLUMN "consentGiven",
DROP COLUMN "courseInterest",
DROP COLUMN "createdAt",
DROP COLUMN "currentEmployment",
DROP COLUMN "experienceYears",
DROP COLUMN "fullName",
DROP COLUMN "graduationYear",
DROP COLUMN "learningAvailability",
DROP COLUMN "preferredSchedule",
DROP COLUMN "previousTraining",
DROP COLUMN "resumeUrl",
DROP COLUMN "status",
DROP COLUMN "targetRole",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
DROP COLUMN "utmCampaign",
DROP COLUMN "utmContent",
DROP COLUMN "utmMedium",
DROP COLUMN "utmSource",
DROP COLUMN "utmTerm",
ADD COLUMN     "campaign_source" TEXT,
ADD COLUMN     "candidate_code" TEXT NOT NULL,
ADD COLUMN     "career_gap_months" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coding_preference" TEXT,
ADD COLUMN     "communication_prefs" TEXT,
ADD COLUMN     "consent_given" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "course_interest" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "experience_years" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "graduation_year" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "learning_availability" TEXT,
ADD COLUMN     "preferred_schedule" TEXT,
ADD COLUMN     "previous_training" TEXT,
ADD COLUMN     "resume_url" TEXT,
ADD COLUMN     "target_role" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "utm_campaign" TEXT,
ADD COLUMN     "utm_content" TEXT,
ADD COLUMN     "utm_medium" TEXT,
ADD COLUMN     "utm_source" TEXT,
ADD COLUMN     "utm_term" TEXT;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "duration",
DROP COLUMN "learningOutcomes",
DROP COLUMN "level",
DROP COLUMN "price",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "product_id" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "candidateId",
DROP COLUMN "completedAt",
DROP COLUMN "courseId",
DROP COLUMN "enrolledAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "support_owner_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "job_postings" DROP COLUMN "closingDate",
DROP COLUMN "companyName",
DROP COLUMN "createdAt",
DROP COLUMN "createdByUserId",
DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "employmentType",
DROP COLUMN "jobTitle",
DROP COLUMN "jobUrl",
DROP COLUMN "minExperience",
DROP COLUMN "notes",
DROP COLUMN "openings",
DROP COLUMN "postingCode",
DROP COLUMN "requirements",
DROP COLUMN "salaryMax",
DROP COLUMN "salaryMin",
DROP COLUMN "source",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "client_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "job_description" TEXT,
ADD COLUMN     "job_link" TEXT,
ADD COLUMN     "role_title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "candidateId",
DROP COLUMN "consentGiven",
DROP COLUMN "courseInterest",
DROP COLUMN "createdAt",
DROP COLUMN "leadCode",
DROP COLUMN "notes",
DROP COLUMN "ownerId",
DROP COLUMN "updatedAt",
DROP COLUMN "utmCampaign",
DROP COLUMN "utmContent",
DROP COLUMN "utmMedium",
DROP COLUMN "utmSource",
DROP COLUMN "utmTerm",
ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "candidate_id" TEXT,
ADD COLUMN     "consent_given" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "course_interest" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "landing_page_url" TEXT,
ADD COLUMN     "lead_code" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "utm_campaign" TEXT,
ADD COLUMN     "utm_content" TEXT,
ADD COLUMN     "utm_medium" TEXT,
ADD COLUMN     "utm_source" TEXT,
ADD COLUMN     "utm_term" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "isPublished",
DROP COLUMN "moduleId",
DROP COLUMN "sortOrder",
DROP COLUMN "updatedAt",
DROP COLUMN "videoUrl",
ADD COLUMN     "module_id" TEXT NOT NULL,
ADD COLUMN     "order_index" INTEGER NOT NULL,
ADD COLUMN     "type" "LessonType" NOT NULL,
ADD COLUMN     "video_asset_id" TEXT;

-- AlterTable
ALTER TABLE "otp_codes" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "userId",
DROP COLUMN "verifiedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "project_submissions" DROP COLUMN "attemptNumber",
DROP COLUMN "feedback",
DROP COLUMN "milestoneId",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewerId",
DROP COLUMN "submissionText",
DROP COLUMN "submissionUrl",
DROP COLUMN "submittedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
DROP COLUMN "vivaNotes",
ADD COLUMN     "ai_review_feedback" TEXT,
ADD COLUMN     "ai_review_score" DECIMAL(5,2),
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "final_presentation_at" TIMESTAMP(3),
ADD COLUMN     "mentor_feedback" TEXT,
ADD COLUMN     "mentor_id" TEXT,
ADD COLUMN     "project_id" TEXT NOT NULL,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "submission_url" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "businessProblem",
DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "expectedOutcome",
DROP COLUMN "isRequired",
DROP COLUMN "resources",
DROP COLUMN "sortOrder",
DROP COLUMN "updatedAt",
ADD COLUMN     "business_problem" TEXT,
ADD COLUMN     "course_id" TEXT NOT NULL,
ADD COLUMN     "expected_outcome" TEXT,
ADD COLUMN     "milestones" JSONB;

-- AlterTable
ALTER TABLE "registrations" DROP COLUMN "campaignSource",
DROP COLUMN "candidateId",
DROP COLUMN "codingPreference",
DROP COLUMN "communicationPrefs",
DROP COLUMN "consentGiven",
DROP COLUMN "courseInterest",
DROP COLUMN "createdAt",
DROP COLUMN "currentEmployment",
DROP COLUMN "experienceYears",
DROP COLUMN "graduationYear",
DROP COLUMN "learningAvailability",
DROP COLUMN "preferredSchedule",
DROP COLUMN "resumeUrl",
DROP COLUMN "skills",
DROP COLUMN "targetRole",
DROP COLUMN "updatedAt",
ADD COLUMN     "campaign_source_id" TEXT,
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "career_gap_months" INTEGER,
ADD COLUMN     "chosen_schedule" TEXT,
ADD COLUMN     "coding_preference" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_skills" TEXT[],
ADD COLUMN     "earlier_training" TEXT,
ADD COLUMN     "experience_years" DECIMAL(4,1),
ADD COLUMN     "graduation_year" INTEGER,
ADD COLUMN     "learning_availability" TEXT,
ADD COLUMN     "resume_url" TEXT,
ADD COLUMN     "target_role" TEXT;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "accessToken",
DROP COLUMN "createdAt",
DROP COLUMN "deviceInfo",
DROP COLUMN "expiresAt",
DROP COLUMN "refreshToken",
DROP COLUMN "revokedAt",
DROP COLUMN "userId",
ADD COLUMN     "access_token" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "refresh_token" TEXT NOT NULL,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "support_tickets" DROP COLUMN "body",
DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "dueAt",
DROP COLUMN "firstResponseAt",
DROP COLUMN "lessonId",
DROP COLUMN "ownerId",
DROP COLUMN "priority",
DROP COLUMN "resolvedAt",
DROP COLUMN "ticketCode",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "assigned_to_id" TEXT,
ADD COLUMN     "candidate_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "sla_due_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ticket_comments" DROP COLUMN "authorId",
DROP COLUMN "body",
DROP COLUMN "createdAt",
DROP COLUMN "isInternal",
DROP COLUMN "ticketId",
ADD COLUMN     "author_candidate_id" TEXT,
ADD COLUMN     "author_user_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "ticket_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "isVerified",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "failed_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "batch_members";

-- DropTable
DROP TABLE "candidate_project_reviews";

-- DropTable
DROP TABLE "checkpoint_attempts";

-- DropTable
DROP TABLE "checkpoint_questions";

-- DropTable
DROP TABLE "checkpoints";

-- DropTable
DROP TABLE "class_attendance";

-- DropTable
DROP TABLE "course_modules";

-- DropTable
DROP TABLE "expert_mock_interviews";

-- DropTable
DROP TABLE "health_checks";

-- DropTable
DROP TABLE "lesson_progress";

-- DropTable
DROP TABLE "lesson_resources";

-- DropTable
DROP TABLE "live_classes";

-- DropTable
DROP TABLE "placement_applications";

-- DropTable
DROP TABLE "placement_interviews";

-- DropTable
DROP TABLE "placement_offers";

-- DropTable
DROP TABLE "placement_pipeline_history";

-- DropTable
DROP TABLE "placement_readiness_reviews";

-- DropTable
DROP TABLE "project_milestones";

-- DropEnum
DROP TYPE "AssessmentStatus";

-- DropEnum
DROP TYPE "AssignmentSubmissionStatus";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "CandidateProjectStatus";

-- DropEnum
DROP TYPE "CheckpointAttemptStatus";

-- DropEnum
DROP TYPE "CourseLevel";

-- DropEnum
DROP TYPE "CourseStatus";

-- DropEnum
DROP TYPE "ExpertMockInterviewStatus";

-- DropEnum
DROP TYPE "JobPostingStatus";

-- DropEnum
DROP TYPE "LiveClassStatus";

-- DropEnum
DROP TYPE "PlacementApplicationStatus";

-- DropEnum
DROP TYPE "PlacementInterviewOutcome";

-- DropEnum
DROP TYPE "PlacementInterviewStatus";

-- DropEnum
DROP TYPE "PlacementOfferStatus";

-- DropEnum
DROP TYPE "PlacementPipelineStage";

-- DropEnum
DROP TYPE "PlacementReadinessDecision";

-- DropEnum
DROP TYPE "ProjectSubmissionStatus";

-- DropEnum
DROP TYPE "ResourceType";

-- DropEnum
DROP TYPE "TicketPriority";

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "target_audience" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "budget" DECIMAL(12,2),
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "candidate_id" TEXT,
    "campaign_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" "ProductCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "invoice_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_items" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_at_purchase" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "payment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "event_type" TEXT NOT NULL,
    "razorpay_event" JSONB,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_progress" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "session_number" INTEGER NOT NULL,
    "status" "TrialSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "lab_completed" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "trial_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "trigger_type" "AutomationTrigger" NOT NULL,
    "channel" "AutomationChannel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "payload" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "unlock_rule" JSONB,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" DECIMAL(5,2),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interviews" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "type" "MockType" NOT NULL,
    "mock_number" INTEGER,
    "interviewer_id" TEXT,
    "is_final_mock" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "conducted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "ats_score" DECIMAL(5,2),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_gates" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "projects_complete" BOOLEAN NOT NULL DEFAULT false,
    "mocks_complete" BOOLEAN NOT NULL DEFAULT false,
    "formal_score" DECIMAL(4,2),
    "final_mock_score" DECIMAL(4,2),
    "status" "GateStatus" NOT NULL DEFAULT 'PENDING',
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matches" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "match_evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_submissions" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_posting_id" TEXT,
    "stage" "PipelineStage" NOT NULL DEFAULT 'PROFILE_REVIEW',
    "channel" "SubmissionChannel",
    "blocker" TEXT,
    "next_action" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_rounds" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "outcome" TEXT,
    "feedback" TEXT,

    CONSTRAINT "interview_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_recovery" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "rejection_count" INTEGER NOT NULL DEFAULT 0,
    "paused_at" TIMESTAMP(3),
    "brushup_start" DATE,
    "brushup_end" DATE,
    "repeat_mock_id" TEXT,
    "resumed_at" TIMESTAMP(3),
    "status" "RecoveryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_recovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_events_event_type_occurred_at_idx" ON "funnel_events"("event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "funnel_events_lead_id_idx" ON "funnel_events"("lead_id");

-- CreateIndex
CREATE INDEX "funnel_events_candidate_id_idx" ON "funnel_events"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "price_list_product_id_valid_from_idx" ON "price_list"("product_id", "valid_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_number_key" ON "payments"("invoice_number");

-- CreateIndex
CREATE INDEX "payments_candidate_id_idx" ON "payments"("candidate_id");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "trial_progress_candidate_id_session_number_key" ON "trial_progress"("candidate_id", "session_number");

-- CreateIndex
CREATE INDEX "automation_events_candidate_id_idx" ON "automation_events"("candidate_id");

-- CreateIndex
CREATE INDEX "modules_course_id_idx" ON "modules"("course_id");

-- CreateIndex
CREATE INDEX "activities_candidate_id_idx" ON "activities"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "activities_candidate_id_lesson_id_key" ON "activities"("candidate_id", "lesson_id");

-- CreateIndex
CREATE INDEX "mock_interviews_candidate_id_idx" ON "mock_interviews"("candidate_id");

-- CreateIndex
CREATE INDEX "resumes_candidate_id_idx" ON "resumes"("candidate_id");

-- CreateIndex
CREATE INDEX "readiness_gates_candidate_id_idx" ON "readiness_gates"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_matches_candidate_id_job_posting_id_key" ON "job_matches"("candidate_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "placement_submissions_candidate_id_idx" ON "placement_submissions"("candidate_id");

-- CreateIndex
CREATE INDEX "placement_submissions_stage_idx" ON "placement_submissions"("stage");

-- CreateIndex
CREATE INDEX "interview_rounds_submission_id_idx" ON "interview_rounds"("submission_id");

-- CreateIndex
CREATE INDEX "placement_recovery_candidate_id_idx" ON "placement_recovery"("candidate_id");

-- CreateIndex
CREATE INDEX "assessments_candidate_id_idx" ON "assessments"("candidate_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_candidate_id_idx" ON "assignment_submissions"("candidate_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "batches_product_id_idx" ON "batches"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_candidate_code_key" ON "candidates"("candidate_code");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_user_id_key" ON "candidates"("user_id");

-- CreateIndex
CREATE INDEX "candidates_user_id_idx" ON "candidates"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_candidate_id_idx" ON "enrollments"("candidate_id");

-- CreateIndex
CREATE INDEX "enrollments_batch_id_idx" ON "enrollments"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_candidate_id_product_id_key" ON "enrollments"("candidate_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_lead_code_key" ON "leads"("lead_code");

-- CreateIndex
CREATE INDEX "leads_campaign_id_idx" ON "leads"("campaign_id");

-- CreateIndex
CREATE INDEX "lessons_module_id_idx" ON "lessons"("module_id");

-- CreateIndex
CREATE INDEX "otp_codes_user_id_purpose_idx" ON "otp_codes"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "project_submissions_candidate_id_idx" ON "project_submissions"("candidate_id");

-- CreateIndex
CREATE INDEX "registrations_candidate_id_idx" ON "registrations"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_access_token_key" ON "sessions"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_access_token_idx" ON "sessions"("access_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_candidate_id_idx" ON "support_tickets"("candidate_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_campaign_source_id_fkey" FOREIGN KEY ("campaign_source_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_items" ADD CONSTRAINT "payment_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_items" ADD CONSTRAINT "payment_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_support_owner_id_fkey" FOREIGN KEY ("support_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_progress" ADD CONSTRAINT "trial_progress_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_related_module_id_fkey" FOREIGN KEY ("related_module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interviews" ADD CONSTRAINT "mock_interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interviews" ADD CONSTRAINT "mock_interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_gates" ADD CONSTRAINT "readiness_gates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_candidate_id_fkey" FOREIGN KEY ("author_candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_submissions" ADD CONSTRAINT "placement_submissions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_submissions" ADD CONSTRAINT "placement_submissions_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "placement_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_recovery" ADD CONSTRAINT "placement_recovery_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_recovery" ADD CONSTRAINT "placement_recovery_repeat_mock_id_fkey" FOREIGN KEY ("repeat_mock_id") REFERENCES "mock_interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
