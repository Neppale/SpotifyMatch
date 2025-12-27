/*
  Warnings:

  - Added the required column `popularity` to the `TrackVariant` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrackVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "popularity" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_source_track" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TrackVariant_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TrackVariant" ("created_at", "id", "is_source_track", "score", "spotify_id", "track_id", "updated_at") SELECT "created_at", "id", "is_source_track", "score", "spotify_id", "track_id", "updated_at" FROM "TrackVariant";
DROP TABLE "TrackVariant";
ALTER TABLE "new_TrackVariant" RENAME TO "TrackVariant";
CREATE INDEX "TrackVariant_spotify_id_idx" ON "TrackVariant"("spotify_id");
CREATE INDEX "TrackVariant_track_id_is_source_track_idx" ON "TrackVariant"("track_id", "is_source_track");
CREATE UNIQUE INDEX "TrackVariant_track_id_is_source_track_key" ON "TrackVariant"("track_id", "is_source_track");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
