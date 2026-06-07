-- Topic management & assignment layer.
-- Все изменения аддитивные (nullable или с DEFAULT), поэтому существующие строки остаются валидными.

-- AlterTable: Topic — статус жизненного цикла и флаг архивации
ALTER TABLE "Topic" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Available';
ALTER TABLE "Topic" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Project — связь с темой + снимок темы + статус проекта
ALTER TABLE "Project" ADD COLUMN     "topicId" TEXT;
ALTER TABLE "Project" ADD COLUMN     "topicTitle" TEXT;
ALTER TABLE "Project" ADD COLUMN     "topicDescription" TEXT;
ALTER TABLE "Project" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AddForeignKey: Project.topicId -> Topic.id (SET NULL чтобы удаление темы не рушило проект)
ALTER TABLE "Project" ADD CONSTRAINT "Project_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
