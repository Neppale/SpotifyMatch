/*
  Warnings:

  - A unique constraint covering the columns `[track_id,spotify_id,is_source_track]` on the table `TrackVariant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TrackVariant_track_id_spotify_id_is_source_track_key" ON "TrackVariant"("track_id", "spotify_id", "is_source_track");
