/*
  Warnings:

  - You are about to drop the `ProfileLibrary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "ProfileLibrary_profile_id_track_variant_id_key";

-- DropIndex
DROP INDEX "ProfileLibrary_profile_id_track_variant_id_idx";

-- DropIndex
DROP INDEX "ProfileLibrary_track_variant_id_idx";

-- DropIndex
DROP INDEX "ProfileLibrary_profile_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProfileLibrary";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "snapshot_id" TEXT NOT NULL
);
INSERT INTO "new_Profile" ("created_at", "id", "snapshot_id", "updated_at") SELECT "created_at", "id", "snapshot_id", "updated_at" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_id_key" ON "Profile"("id");
CREATE INDEX "Profile_id_idx" ON "Profile"("id");
CREATE TABLE "new_TrackVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "popularity" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_source_track" BOOLEAN NOT NULL DEFAULT false,
    "profile_id" TEXT,
    CONSTRAINT "TrackVariant_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackVariant_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TrackVariant" ("created_at", "id", "is_source_track", "popularity", "score", "spotify_id", "track_id", "updated_at") SELECT "created_at", "id", "is_source_track", "popularity", "score", "spotify_id", "track_id", "updated_at" FROM "TrackVariant";
DROP TABLE "TrackVariant";
ALTER TABLE "new_TrackVariant" RENAME TO "TrackVariant";
CREATE INDEX "TrackVariant_spotify_id_idx" ON "TrackVariant"("spotify_id");
CREATE INDEX "TrackVariant_track_id_is_source_track_idx" ON "TrackVariant"("track_id", "is_source_track");
CREATE INDEX "TrackVariant_profile_id_track_id_idx" ON "TrackVariant"("profile_id", "track_id");
CREATE UNIQUE INDEX "TrackVariant_profile_id_track_id_key" ON "TrackVariant"("profile_id", "track_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
