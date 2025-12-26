-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "snapshot_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProfileLibrary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "track_variant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ProfileLibrary_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileLibrary_track_variant_id_fkey" FOREIGN KEY ("track_variant_id") REFERENCES "TrackVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_id_key" ON "Profile"("id");

-- CreateIndex
CREATE INDEX "Profile_id_idx" ON "Profile"("id");

-- CreateIndex
CREATE INDEX "ProfileLibrary_profile_id_idx" ON "ProfileLibrary"("profile_id");

-- CreateIndex
CREATE INDEX "ProfileLibrary_track_variant_id_idx" ON "ProfileLibrary"("track_variant_id");

-- CreateIndex
CREATE INDEX "ProfileLibrary_profile_id_track_variant_id_idx" ON "ProfileLibrary"("profile_id", "track_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLibrary_profile_id_track_variant_id_key" ON "ProfileLibrary"("profile_id", "track_variant_id");
