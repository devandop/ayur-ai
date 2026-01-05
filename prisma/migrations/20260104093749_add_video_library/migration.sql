-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "muxAssetId" TEXT,
    "muxPlaybackId" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "thumbnailUrl" TEXT,
    "instructor" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_watches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "lastPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "watchedDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_watches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_muxAssetId_key" ON "videos"("muxAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "videos_muxPlaybackId_key" ON "videos"("muxPlaybackId");

-- CreateIndex
CREATE INDEX "videos_isPublished_idx" ON "videos"("isPublished");

-- CreateIndex
CREATE INDEX "video_watches_userId_idx" ON "video_watches"("userId");

-- CreateIndex
CREATE INDEX "video_watches_videoId_idx" ON "video_watches"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "video_watches_userId_videoId_key" ON "video_watches"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "video_watches" ADD CONSTRAINT "video_watches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_watches" ADD CONSTRAINT "video_watches_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
