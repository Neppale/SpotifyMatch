/*
  Warnings:

  - Added the required column `artist_id` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artist" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "release_date" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Track" ("album", "artist", "created_at", "duration_ms", "id", "release_date", "title", "updated_at") SELECT "album", "artist", "created_at", "duration_ms", "id", "release_date", "title", "updated_at" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_artist_id_idx" ON "Track"("artist_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
