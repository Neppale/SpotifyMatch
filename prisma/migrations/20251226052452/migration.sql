-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProfileLibrary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "track_variant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ProfileLibrary_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileLibrary_track_variant_id_fkey" FOREIGN KEY ("track_variant_id") REFERENCES "TrackVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProfileLibrary" ("created_at", "id", "profile_id", "track_variant_id", "updated_at") SELECT "created_at", "id", "profile_id", "track_variant_id", "updated_at" FROM "ProfileLibrary";
DROP TABLE "ProfileLibrary";
ALTER TABLE "new_ProfileLibrary" RENAME TO "ProfileLibrary";
CREATE INDEX "ProfileLibrary_profile_id_idx" ON "ProfileLibrary"("profile_id");
CREATE INDEX "ProfileLibrary_track_variant_id_idx" ON "ProfileLibrary"("track_variant_id");
CREATE INDEX "ProfileLibrary_profile_id_track_variant_id_idx" ON "ProfileLibrary"("profile_id", "track_variant_id");
CREATE UNIQUE INDEX "ProfileLibrary_profile_id_track_variant_id_key" ON "ProfileLibrary"("profile_id", "track_variant_id");
CREATE TABLE "new_TrackVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
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
