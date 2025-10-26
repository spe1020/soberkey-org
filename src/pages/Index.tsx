import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Heart, Users, Shield, Sparkles, Hash, TrendingUp, Calendar, MessageCircle } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';


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

function PostCard({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  const tags = event.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value)
    .filter((tag): tag is string => !!tag);

  const timeAgo = getTimeAgo(event.created_at);

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

// Recovery-focused relays for maximum content discovery
const RECOVERY_RELAYS = [
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.mostr.pub',
];

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

      return uniqueEvents.sort((a, b) => b.created_at - a.created_at);
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
    all: ['recovery', 'sobriety', 'addiction', 'soberlife', 'odaat', 'recoveryispossible'],
    programs: ['12steps', 'aa', 'na', 'smartrecovery', 'celebraterecovery'],
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
                <TabsList className="grid w-full grid-cols-4 h-auto gap-2">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All Posts
                  </TabsTrigger>
                  <TabsTrigger value="programs" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                    Programs
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

                <TabsContent value="programs" className="space-y-4 mt-6">
                  <RecoveryFeed tags={categoryTags.programs} />
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
                <a
                  href="https://soapbox.pub/mkstack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Vibed with MKStack
                </a>
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
