/*
  Warnings:

  - You are about to drop the `SimilarTrack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `spotify_id` on the `Track` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SimilarTrack_spotify_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SimilarTrack";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TrackVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_source_track" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TrackVariant_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artist" TEXT NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TrackVariant_spotify_id_idx" ON "TrackVariant"("spotify_id");

-- CreateIndex
CREATE INDEX "TrackVariant_track_id_is_source_track_idx" ON "TrackVariant"("track_id", "is_source_track");

-- CreateIndex
CREATE UNIQUE INDEX "TrackVariant_track_id_is_source_track_key" ON "TrackVariant"("track_id", "is_source_track");
