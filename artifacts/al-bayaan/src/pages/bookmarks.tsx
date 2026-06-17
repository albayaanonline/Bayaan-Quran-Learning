import { useListBookmarks, useDeleteBookmark } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkMinus, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListBookmarksQueryKey } from "@workspace/api-client-react";

export default function Bookmarks() {
  const { data: bookmarks, isLoading } = useListBookmarks();
  const deleteMutation = useDeleteBookmark();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id }, // the api schema might take id directly as param
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-950 dark:text-emerald-50">Saved Ayahs</h1>
          <p className="text-muted-foreground mt-2">Verses you've bookmarked for reflection</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : bookmarks?.length === 0 ? (
          <div className="text-center py-20 bg-[url('/images/islamic-dome.png')] bg-contain bg-center bg-no-repeat opacity-80 h-[400px] flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50">
            <h3 className="text-2xl font-serif text-emerald-900 font-bold bg-white/80 px-6 py-2 rounded-full">No bookmarks yet</h3>
            <p className="text-emerald-800 mt-2 bg-white/80 px-4 py-1 rounded-full">Save meaningful ayahs while you read to find them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks?.map((bookmark, index) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            Surah {bookmark.surahName} • Ayah {bookmark.ayahNumber}
                          </span>
                        </div>
                        <p className="text-2xl leading-loose font-arabic text-emerald-950 dark:text-emerald-50 text-right" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                          {bookmark.ayahText}
                        </p>
                        {bookmark.note && (
                          <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-sm italic">
                            "{bookmark.note}"
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {/* Note: In a real app we'd map this delete properly to the generated client */}
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(bookmark.id)}>
                          <BookmarkMinus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
