import { useSeoMeta } from '@unhead/react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';
import { Heart, Users, Shield, Sparkles, Hash, TrendingUp, Calendar, MessageCircle, BookOpen, Zap } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';
import { extractMediaFromContent } from '@/lib/mediaExtract';
import { MediaDisplay } from '@/components/MediaDisplay';
import { ZapDialog } from '@/components/ZapDialog';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';


const RECOVERY_TAGS = [
  // Primary Recovery Tags
  'recovery', 'sobriety', 'addiction', 'soberlife', 'odaat',
  'recoveryispossible', 'soberliving', 'addictionrecovery', 'mentalhealth',

  // Program-Specific Tags
  '12steps', 'aa', 'na', 'smartrecovery', 'celebraterecovery',

  // Support & Community Tags
  'recoverycommunity', 'sober', 'cleanandserene', 'recoverywarrior',
  'wedorecover', 'keepcoming', 'progressnotperfection',

  // Substance-Specific Tags
  'alcoholfree', 'drugfree', 'substanceabuse', 'substanceusedisorder',
  'opioidcrisis', 'opioidrecovery',

  // Wellness & Growth Tags
  'selfcare', 'healing', 'hope', 'gratitude', 'mindfulness',
  'mentalhealthmatters', 'breakthestigma', 'youarenotalone'
];

const FEATURED_TAGS = [
  { tag: 'recovery', icon: Heart, color: 'bg-blue-500' },
  { tag: 'sobriety', icon: Sparkles, color: 'bg-green-500' },
  { tag: 'odaat', icon: Calendar, color: 'bg-purple-500' },
  { tag: '12steps', icon: TrendingUp, color: 'bg-orange-500' },
  { tag: 'recoverycommunity', icon: Users, color: 'bg-teal-500' },
  { tag: 'hope', icon: Heart, color: 'bg-pink-500' },
];

const RECOVERY_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.snort.social',
];

// Separate component for individual comments to avoid hook issues
function CommentItem({ comment }: { comment: NostrEvent }) {
  const commentAuthor = useAuthor(comment.pubkey);
  const commentMeta = commentAuthor.data?.metadata;
  const commentName = commentMeta?.display_name || commentMeta?.name || genUserName(comment.pubkey);
  const commentImage = commentMeta?.picture;
  
  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };
  
  return (
    <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
      <Avatar className="h-8 w-8">
        <AvatarImage src={commentImage} alt={commentName} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
          {commentName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{commentName}</p>
          <p className="text-xs text-muted-foreground">
            {getTimeAgo(comment.created_at)}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}

function AnonymousPostForm() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonKey, setAnonKey] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  // Generate anonymous key when toggled on
  const handleToggleAnon = (checked: boolean) => {
    setIsAnonymous(checked);
    if (checked && !anonKey) {
      const key = generateSecretKey();
      setAnonKey(key);
      console.log('Anonymous key generated, pubkey:', getPublicKey(key));
    }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    
    // Allow posting anonymously without login, but require login for public posts
    if (!isAnonymous && !user) {
      alert('Please log in to post publicly');
      return;
    }

    setIsPosting(true);

    try {
      if (isAnonymous && anonKey) {
        // Post anonymously with generated key
        const { finalizeEvent, signEvent, getEventHash } = await import('nostr-tools');
        
        // First, create metadata event for "Sobrkey Anon" identity
        const unsignedMetadata = {
          kind: 0,
          content: JSON.stringify({
            name: 'Sobrkey Anon',
            about: 'Anonymous recovery support',
          }),
          tags: [],
          created_at: Math.floor(Date.now() / 1000),
        };
        
        const metadataEvent = finalizeEvent(unsignedMetadata, anonKey);

        // Publish metadata to relays
        await nostr.event(metadataEvent, { signal: AbortSignal.timeout(5000) });
        
        // Then create the post
        const unsignedPost = {
          kind: 1,
          content: postContent.trim(),
          tags: [
            ['t', 'recovery'],
            ['t', 'sobrkey'],
            ['t', 'anonymous'],
          ],
          created_at: Math.floor(Date.now() / 1000),
        };
        
        const postEvent = finalizeEvent(unsignedPost, anonKey);

        // Publish post to relays
        await nostr.event(postEvent, { signal: AbortSignal.timeout(5000) });
        
        alert('Posted anonymously! 🙈');
      } else if (user) {
        // Post with user's identity
        const event = await user.signer.signEvent({
          kind: 1,
          content: postContent.trim(),
          tags: [
            ['t', 'recovery'],
            ['t', 'sobrkey'],
          ],
          created_at: Math.floor(Date.now() / 1000),
        });

        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
        alert('Posted! ✅');
      }

      setPostContent('');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Share Your Journey</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="anonymous-mode"
              checked={isAnonymous}
              onCheckedChange={handleToggleAnon}
            />
            <Label htmlFor="anonymous-mode" className="text-sm cursor-pointer">
              {isAnonymous ? 'Anonymous' : 'Public'}
            </Label>
          </div>
        </div>
        {isAnonymous && (
          <p className="text-xs text-muted-foreground">
            You will post as "Sobrkey Anon" - your identity will remain private
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder={isAnonymous ? "Share anonymously..." : "Share your recovery journey..."}
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {isAnonymous ? '🔒 Posting anonymously as "Sobrkey Anon"' : user ? ('Posting as: ' + (user?.profile?.display_name || user?.profile?.name || 'You')) : '🔐 Log in or toggle Anonymous to post'}
          </div>
          <Button
            onClick={handlePost}
            disabled={!postContent.trim() || isPosting || (!user && !isAnonymous)}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ event }: { event: NostrEvent }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const author = useAuthor(event.pubkey);
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  // Extract media from event content
  const media = useMemo(() => extractMediaFromContent(event.content), [event.content]);

  // Extract and deduplicate tags
  const tags = useMemo(() => {
    const rawTags = event.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value)
    .filter((tag): tag is string => !!tag);
    // Remove duplicates using Set
    return Array.from(new Set(rawTags));
  }, [event.tags]);

  const timeAgo = getTimeAgo(event.created_at);

  // Fetch reaction count
  const { data: reactions } = useQuery({
    queryKey: ['reactions', event.id],
    queryFn: async ({ signal }) => {
      try {
        const relayGroup = nostr.group(RECOVERY_RELAYS);
        const reactionEvents = await relayGroup.query(
          [{
            kinds: [7],
            '#e': [event.id],
          }],
          { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(5000)]) }
        );
        return reactionEvents.length;
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
        return 0;
      }
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch comment count
  const { data: commentsCount } = useQuery({
    queryKey: ['comments', event.id],
    queryFn: async ({ signal }) => {
      try {
        const relayGroup = nostr.group(RECOVERY_RELAYS);
        const commentEvents = await relayGroup.query(
          [{
            kinds: [1],
            '#e': [event.id],
          }],
          { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(5000)]) }
        );
        return commentEvents.length;
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        return 0;
      }
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch zap count (kind 9735 zap receipts)
  const { data: zapCount } = useQuery({
    queryKey: ['zaps', event.id],
    queryFn: async ({ signal }) => {
      try {
        const relayGroup = nostr.group(RECOVERY_RELAYS);
        const zapEvents = await relayGroup.query(
          [{
            kinds: [9735],
            '#e': [event.id],
          }],
          { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(5000)]) }
        );
        // Sum the zap amounts
        let totalAmount = 0;
        for (const zapEvent of zapEvents) {
          const bolt11Tag = zapEvent.tags.find(t => t[0] === 'bolt11');
          if (bolt11Tag) {
            // Extract amount from bolt11 invoice if available
            const amountTag = zapEvent.tags.find(t => t[0] === 'amount');
            if (amountTag && amountTag[1]) {
              totalAmount += parseInt(amountTag[1], 10);
            }
          }
        }
        return totalAmount > 0 ? zapEvents.length : 0;
      } catch (error) {
        console.error('Failed to fetch zaps:', error);
        return 0;
      }
    },
    staleTime: 30000,
  });

  // Fetch actual comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['comment-events', event.id],
    queryFn: async ({ signal }) => {
      try {
        const relayGroup = nostr.group(RECOVERY_RELAYS);
        const commentEvents = await relayGroup.query(
          [{
            kinds: [1],
            '#e': [event.id],
          }],
          { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(5000)]) }
        );
        return commentEvents;
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        return [];
      }
    },
    enabled: showComments, // Only fetch when comments are shown
    staleTime: 30000,
  });

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like posts');
      return;
    }

    try {
      // Publish a reaction (kind 7) with + emoji
      const reactionEvent = await user.signer.signEvent({
        kind: 7,
        content: '+',
        tags: [
          ['e', event.id],
          ['p', event.pubkey],
          ['t', 'sobrkey'], // Tag all interactions with sobrkey
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish to relays
      await nostr.event(reactionEvent, { signal: AbortSignal.timeout(5000) });

      console.log('Reaction published:', reactionEvent);
      alert('Liked! 💙');
    } catch (error) {
      console.error('Failed to publish reaction:', error);
      alert('Failed to like post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user) {
      if (!user) {
        alert('Please log in to comment');
      }
      return;
    }

    try {
      // Publish a comment/note as a reply (kind 1)
      const commentEvent = await user.signer.signEvent({
        kind: 1,
        content: commentText.trim(),
        tags: [
          ['e', event.id], // Reply to this event
          ['p', event.pubkey], // Tag the original author
          ['t', 'sobrkey'], // Tag all posts with sobrkey
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish to relays
      await nostr.event(commentEvent, { signal: AbortSignal.timeout(5000) });

      console.log('Comment published:', commentEvent);
      setCommentText('');
      setShowComments(false);
      alert('Comment posted! 💬');
    } catch (error) {
      console.error('Failed to publish comment:', error);
      alert('Failed to post comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };


  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="prose prose-sm max-w-none">
          <NoteContent event={event} className="text-sm leading-relaxed" />
        </div>
        
        {/* Display media if present */}
        {media.length > 0 && (
          <MediaDisplay media={media} />
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 5} more
              </Badge>
            )}
          </div>
        )}
        
        {/* Reaction, Zap, and Comment Buttons */}
        <div className="flex items-center gap-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Like</span>
            {reactions !== undefined && reactions > 0 && (
              <span className="text-sm font-medium text-muted-foreground">({reactions})</span>
            )}
          </Button>
          <ZapDialog target={event as Event}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Zap</span>
              {zapCount !== undefined && zapCount > 0 && (
                <span className="text-sm font-medium text-muted-foreground">({zapCount})</span>
              )}
            </Button>
          </ZapDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Comment</span>
            {commentsCount !== undefined && commentsCount > 0 && (
              <span className="text-sm font-medium text-muted-foreground">({commentsCount})</span>
            )}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t space-y-3">
            {/* Display existing comments */}
            {isLoadingComments && comments && (
              <div className="text-sm text-muted-foreground py-2">Loading comments...</div>
            )}
            {comments && comments.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}
            {!isLoadingComments && comments && comments.length === 0 && (
              <div className="text-sm text-muted-foreground py-2 text-center">
                No comments yet. Be the first to comment!
              </div>
            )}
            
            {/* Comment Input */}
            {user && (
              <div className="space-y-2 pt-2 border-t">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleComment();
                    }
                  }}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  size="sm"
                >
                  Post Comment
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

// Core recovery tags for articles
const ARTICLE_TAGS = ['sobriety', 'sober', 'soberliving', 'sobercurious', 'gratitude', 'recovery'];

function ArticlesFeed() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NostrEvent | null>(null);
  const { nostr } = useNostr();

  // Build filter tags - use selected tag or all tags
  const filterTags = selectedTag ? [selectedTag] : ARTICLE_TAGS;

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles', filterTags],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const relayGroup = nostr.group(RECOVERY_RELAYS);

      const fetchedArticles = await relayGroup.query(
        [{
          kinds: [30023], // NIP-23 long-form articles
          '#t': filterTags,
          limit: 50,
        }],
        { signal }
      );

      // Remove duplicates
      const uniqueArticles = Array.from(
        new Map(fetchedArticles.map(event => [event.id, event])).values()
      );

      // Filter to only show articles with at least one required tag
      const filtered = uniqueArticles.filter(article => {
        const articleTags = article.tags.filter(([name]) => name === 't').map(([, value]) => value);
        return filterTags.some(tag => articleTags.includes(tag));
      });

      return filtered.sort((a, b) => b.created_at - a.created_at);
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Connection Issue</h3>
              <p className="text-sm text-muted-foreground">
                We're having trouble connecting to the Nostr network. Please check your internet connection and try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 px-8 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-xl">No Articles Found</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedTag 
                  ? `No articles found with the tag "${selectedTag}" yet. Check back soon or try a different filter.`
                  : "No recovery articles have been published yet. Be the first to share your story or wait for others to contribute."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTag === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTag(null)}
        >
          All Tags
        </Button>
        {ARTICLE_TAGS.map((tag) => (
          <Button
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTag(tag)}
          >
            #{tag}
          </Button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} onOpen={() => setSelectedArticle(article)} />
        ))}
      </div>

      {/* Article Reading Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
}

function ArticleCard({ article, onOpen }: { article: NostrEvent; onOpen: () => void }) {
  const author = useAuthor(article.pubkey);
  const metadata = author.data?.metadata;
  const authorName = metadata?.display_name || metadata?.name || genUserName(article.pubkey);
  const authorImage = metadata?.picture;

  // Extract article metadata from tags
  const titleTag = article.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const publishedAtTag = article.tags.find(([name]) => name === 'published_at')?.[1];
  const publishedAt = publishedAtTag ? parseInt(publishedAtTag) : article.created_at;
  const imageTag = article.tags.find(([name]) => name === 'image')?.[1];
  const hashtags = article.tags.filter(([name]) => name === 't').map(([, value]) => value);

  // Calculate read time (assume 200 words per minute)
  const wordCount = article.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  // Get excerpt (first 200 characters)
  const excerpt = article.content.substring(0, 200) + (article.content.length > 200 ? '...' : '');

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onOpen}
    >
      {imageTag && (
        <div className="h-48 overflow-hidden bg-muted">
          <img 
            src={imageTag} 
            alt={titleTag} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-xl font-semibold leading-tight">{titleTag}</h3>
          {publishedAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(publishedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={authorImage} alt={authorName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
              {authorName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{authorName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{readTime} min read</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{excerpt}</p>
        <div className="flex flex-wrap gap-1.5">
          {hashtags.slice(0, 5).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {hashtags.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{hashtags.length - 5} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleModal({ article, onClose }: { article: NostrEvent; onClose: () => void }) {
  const author = useAuthor(article.pubkey);
  const metadata = author.data?.metadata;
  const authorName = metadata?.display_name || metadata?.name || genUserName(article.pubkey);
  const authorImage = metadata?.picture;

  // Extract article metadata
  const titleTag = article.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const publishedAtTag = article.tags.find(([name]) => name === 'published_at')?.[1];
  const publishedAt = publishedAtTag ? parseInt(publishedAtTag) : article.created_at;
  const hashtags = article.tags.filter(([name]) => name === 't').map(([, value]) => value);
  const imageTag = article.tags.find(([name]) => name === 'image')?.[1];

  // Calculate read time
  const wordCount = article.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">{titleTag}</DialogTitle>
          <div className="flex items-center gap-3 pt-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={authorImage} alt={authorName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {authorName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{authorName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {publishedAt && <span>{formatDate(publishedAt)}</span>}
                {publishedAt && <span>•</span>}
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {imageTag && (
          <div className="w-full h-64 overflow-hidden rounded-lg bg-muted">
            <img 
              src={imageTag} 
              alt={titleTag} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {hashtags.map((tag) => (
            <Badge key={tag} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>

        <div 
          className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-blue-600 prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecoveryFeed({ tags }: { tags: string[] }) {
  const { nostr } = useNostr();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['recovery-feed', tags],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      // Query from multiple relays simultaneously for rich content discovery
      const relayGroup = nostr.group(RECOVERY_RELAYS);

      const fetchedEvents = await relayGroup.query(
        [{
          kinds: [1],
          '#t': tags,
          limit: 100, // Increased limit since we're querying multiple relays
        }],
        { signal }
      );

      // Remove duplicates based on event ID
      const uniqueEvents = Array.from(
        new Map(fetchedEvents.map(event => [event.id, event])).values()
      );

      // Filter out events with more than 7 tags total
      const filteredEvents = uniqueEvents.filter(event => event.tags.length <= 7);

      return filteredEvents.sort((a, b) => b.created_at - a.created_at);
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Connection Issue</h3>
              <p className="text-sm text-muted-foreground">
                We're having trouble connecting to the Nostr network. Please check your internet connection and try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 px-8 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-xl">No Posts Yet in This Category</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is a fresh space waiting for community voices. Be the pioneer who shares the first recovery story,
                thought, or word of encouragement in this category.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                We're searching across multiple Nostr relays to bring you the best content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <PostCard key={event.id} event={event} />
      ))}
    </div>
  );
}

const Index = () => {
  const { user } = useCurrentUser();
  const [selectedCategory, setSelectedCategory] = useState('all');

  useSeoMeta({
    title: 'SoberKey - Recovery Community on Nostr',
    description: 'A safe, decentralized space for recovery support, sobriety, and healing. Join our compassionate community built on the Nostr protocol.',
  });

  const categoryTags: Record<string, string[]> = {
    all: [
      // Primary Recovery
      'recovery', 'sobriety', 'addiction', 'soberlife', 'odaat', 'recoveryispossible',
      // Programs
      '12steps', 'smartrecovery', 'celebraterecovery',
      // Community
      'recoverycommunity', 'sober', 'recoverywarrior', 'wedorecover', 'youarenotalone',
      // Substance-Specific
      'alcoholfree', 'drugfree', 'substanceabuse', 'substanceusedisorder',
      // SoberKey Platform
      'sobrkey', 'soberkey',
    ],
    programs: ['12steps', 'smartrecovery', 'celebraterecovery'],
    wellness: ['selfcare', 'healing', 'hope', 'gratitude', 'mindfulness', 'mentalhealthmatters'],
    community: ['recoverycommunity', 'sober', 'recoverywarrior', 'wedorecover', 'youarenotalone'],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                SoberKey
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A decentralized sanctuary for recovery, healing, and hope
              </p>
            </div>

            {/* Mission Statement */}
            <div className="bg-card/80 backdrop-blur-sm border rounded-2xl p-6 md:p-8 shadow-xl">
              <p className="text-base md:text-lg leading-relaxed text-foreground/90">
                Built on the censorship-resistant Nostr protocol, SoberKey provides a{' '}
                <span className="font-semibold text-primary">safe, judgment-free space</span> exclusively for
                recovery support and sobriety content. Whether you're{' '}
                <span className="font-semibold text-secondary">one day or many years</span> into your journey,
                you belong here.
              </p>
            </div>

            {/* Auth Section */}
            <div className="pt-4">
              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Join our community to share your journey and support others
                  </p>
                  <div className="flex justify-center">
                    <LoginArea className="max-w-md" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <Heart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Welcome back to your recovery community</span>
                  </div>
                  <LoginArea className="max-w-xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Featured Recovery Tags */}
      <section className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Featured Recovery Topics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED_TAGS.map(({ tag, icon: Icon, color }) => (
              <Button
                key={tag}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:shadow-md transition-all hover:scale-105"
                onClick={() => setSelectedCategory('all')}
              >
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium">#{tag}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Core Values */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">Safe & Judgment-Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A compassionate space where everyone's journey is respected and supported.
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardHeader>
                <Users className="h-8 w-8 text-secondary mb-2" />
                <CardTitle className="text-base">Community Focused</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with others who understand your challenges and celebrate your victories.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-base">Decentralized & Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built on Nostr - no central authority can censor your recovery story.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recovery Feed Tabs */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Recovery Community Feed
              </CardTitle>
              <CardDescription>
                Real stories, real support, real recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
                {/* Anonymous Post Form */}
                <div className="mb-6">
                  <AnonymousPostForm />
                </div>
                
                <TabsList className="grid w-full grid-cols-4 h-auto gap-2">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All Posts
                  </TabsTrigger>
                  <TabsTrigger value="articles" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Articles
                  </TabsTrigger>
                  <TabsTrigger value="wellness" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                    Wellness
                  </TabsTrigger>
                  <TabsTrigger value="community" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                    Community
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                  <RecoveryFeed tags={categoryTags.all} />
                </TabsContent>

                <TabsContent value="articles" className="space-y-4 mt-6">
                  <ArticlesFeed />
                </TabsContent>

                <TabsContent value="wellness" className="space-y-4 mt-6">
                  <RecoveryFeed tags={categoryTags.wellness} />
                </TabsContent>

                <TabsContent value="community" className="space-y-4 mt-6">
                  <RecoveryFeed tags={categoryTags.community} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* All Recovery Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Recovery Tags</CardTitle>
              <CardDescription>
                Explore all the topics our community discusses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {RECOVERY_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-primary" />
                <span>One day at a time, together</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                SoberKey is a community-driven platform. All content is created by members like you.
                If you're struggling, please reach out to professional help services in your area.
              </p>
              <div className="pt-4 text-xs text-muted-foreground">
                <span className="hover:text-primary transition-colors">
                  Sobrkey is Powered by Nostr ⚡️
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
