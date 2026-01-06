-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "release_date" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackVariant" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "popularity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_source_track" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TrackVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "snapshot_id" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfileTrackVariants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfileTrackVariants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Track_artist_id_idx" ON "Track"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrackVariant_id_key" ON "TrackVariant"("id");

-- CreateIndex
CREATE INDEX "TrackVariant_id_idx" ON "TrackVariant"("id");

-- CreateIndex
CREATE INDEX "TrackVariant_track_id_is_source_track_idx" ON "TrackVariant"("track_id", "is_source_track");

-- CreateIndex
CREATE UNIQUE INDEX "TrackVariant_track_id_id_is_source_track_key" ON "TrackVariant"("track_id", "id", "is_source_track");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_id_key" ON "Profile"("id");

-- CreateIndex
CREATE INDEX "Profile_id_idx" ON "Profile"("id");

-- CreateIndex
CREATE INDEX "_ProfileTrackVariants_B_index" ON "_ProfileTrackVariants"("B");

-- AddForeignKey
ALTER TABLE "TrackVariant" ADD CONSTRAINT "TrackVariant_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileTrackVariants" ADD CONSTRAINT "_ProfileTrackVariants_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileTrackVariants" ADD CONSTRAINT "_ProfileTrackVariants_B_fkey" FOREIGN KEY ("B") REFERENCES "TrackVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
