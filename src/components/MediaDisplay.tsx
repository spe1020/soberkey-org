import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MediaItem } from '@/lib/mediaExtract';

interface MediaDisplayProps {
  media: MediaItem[];
  className?: string;
}

export function MediaDisplay({ media, className = "" }: MediaDisplayProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsDialogOpen(true);
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      {media.length === 1 ? (
        // Single media item - larger display
        <div
          className="cursor-pointer overflow-hidden rounded-lg bg-gray-100"
          onClick={() => handleMediaClick(media[0])}
        >
          {media[0].type === 'image' ? (
            <img
              src={media[0].url}
              alt={media[0].alt || 'Image'}
              className="w-full h-auto max-h-[500px] object-contain"
              loading="lazy"
            />
          ) : (
            <video
              src={media[0].url}
              className="w-full h-auto max-h-[500px]"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      ) : (
        // Multiple media items - grid layout
        <div className="grid grid-cols-2 gap-2">
          {media.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer overflow-hidden rounded-lg bg-gray-100 aspect-square"
              onClick={() => handleMediaClick(item)}
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.alt || 'Image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-screen media dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedMedia && (
              <div className="flex items-center justify-center min-h-[400px]">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt || 'Full size image'}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    className="max-w-full max-h-[80vh]"
                    controls
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

