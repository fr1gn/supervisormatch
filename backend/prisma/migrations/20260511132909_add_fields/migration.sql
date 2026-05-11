-- AlterTable
ALTER TABLE "Supervisor" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "refreshTokenHash" TEXT,
ADD COLUMN     "studyLevel" TEXT;
