import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, Modal, Dimensions, LayoutAnimation, Platform, UIManager, ActivityIndicator, TextInput, KeyboardAvoidingView, Share, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useThemedStyles } from '@/lib/use-themed-styles';
import { useTheme } from '@/lib/theme-context';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemeToggle from '@/components/ThemeToggle';
import { LinearGradient } from 'expo-linear-gradient';
import { Filter, Check, ChevronDown, ChevronUp, Play, Heart, MessageCircle, Share2, X, Menu } from 'lucide-react-native';
import { useResponsive } from '@/lib/use-responsive';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'expo-router';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {

  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const categories = ['All', 'Showcase', 'News', 'Behind the Scenes', 'Partnership'];


type SocialActionsProps = {
  postId: string;
  virtualTourUrl?: string;
  onCommentPress: () => void;
  colors: any;
  spacing: any;
};

function SocialActions({ postId, virtualTourUrl, onCommentPress, colors, spacing }: SocialActionsProps) {
  const interactionsQuery = trpc.social.getInteractions.useQuery({ postId });
  const likeMutation = trpc.social.likePost.useMutation({
    onSuccess: () => {
      interactionsQuery.refetch();
    },
  });
  const unlikeMutation = trpc.social.unlikePost.useMutation({
    onSuccess: () => {
      interactionsQuery.refetch();
    },
  });

  const isLiked = interactionsQuery.data?.isLiked || false;
  const likeCount = interactionsQuery.data?.likeCount || 0;
  const commentCount = interactionsQuery.data?.commentCount || 0;

  const handleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

  const handleShare = async () => {
    if (!virtualTourUrl) {
      Alert.alert('Share', 'Only showcase content with virtual tours can be shared');
      return;
    }

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(virtualTourUrl);
        Alert.alert('Link Copied', 'The virtual tour link has been copied to your clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        Alert.alert('Share Error', 'Unable to copy link. Please copy this manually: ' + virtualTourUrl);
      }
    } else {
      try {
        await Share.share({
          message: `Check out this amazing virtual tour! ${virtualTourUrl}`,
          url: virtualTourUrl,
        });
      } catch (error: any) {
        console.error('Error sharing:', error);
        if (error?.message !== 'User did not share') {
          Alert.alert('Share Error', 'Unable to share the link. Please try again.');
        }
      }
    }
  };

  return (
    <View style={[socialStyles.container, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }]}>
      <TouchableOpacity
        style={socialStyles.actionButton}
        onPress={handleLike}
        disabled={likeMutation.isPending || unlikeMutation.isPending}
        activeOpacity={0.7}
      >
        <Heart
          size={22}
          color={isLiked ? '#ff4444' : colors.textSecondary}
          fill={isLiked ? '#ff4444' : 'none'}
        />
        {likeCount > 0 && (
          <Text style={[socialStyles.actionText, { color: colors.textSecondary }]}>
            {likeCount}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={socialStyles.actionButton}
        onPress={onCommentPress}
        activeOpacity={0.7}
      >
        <MessageCircle size={22} color={colors.textSecondary} />
        {commentCount > 0 && (
          <Text style={[socialStyles.actionText, { color: colors.textSecondary }]}>
            {commentCount}
          </Text>
        )}
      </TouchableOpacity>

      {virtualTourUrl && (
        <TouchableOpacity
          style={socialStyles.actionButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const socialStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useThemedStyles();
  const { isDark } = useTheme();
  const { isTablet, isLargeTablet, contentMaxWidth } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [webViewLoading, setWebViewLoading] = useState<Record<string, boolean>>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const newsQuery = trpc.home.getNewsfeed.useQuery();
  const newsItems = newsQuery.data || [];

  const filteredNews = selectedCategory === 'All'
    ? newsItems
    : newsItems.filter(item => item.category === selectedCategory);


  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCard(expandedCard === id ? null : id);
  };

  const toggleText = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedText(expandedText === id ? null : id);
  };

  const handleCarouselScroll = (itemId: string, index: number) => {
    setCarouselIndices(prev => ({ ...prev, [itemId]: index }));
  };

  const getCurrentCarouselIndex = (itemId: string) => {
    return carouselIndices[itemId] || 0;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.centerWrapper, { maxWidth: contentMaxWidth }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => {
            console.log('[HomeScreen] Menu button pressed, navigating to command-center');
            try {
              router.push('/command-center');
              console.log('[HomeScreen] Navigation successful');
            } catch (error) {
              console.error('[HomeScreen] Navigation error:', error);
            }
          }}
          onPressIn={() => console.log('[HomeScreen] Menu button press detected')}
          style={styles.menuButton}
          activeOpacity={0.7}
          testID="command-center-button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Menu size={28} color={colors.accent} />
        </TouchableOpacity>
        <View style={styles.headerLogos}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hdiayis8oo9lpy7t8tkef' }}
            style={[styles.mainLogo, isDark && { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
          />
          <View style={styles.poweredByContainer}>
            <Text style={[styles.poweredByText, { color: colors.textSecondary }]}>powered by</Text>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6sz1h46wfgtypj6pipghs' }}
              style={styles.geckoLogo}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <ThemeToggle />
        </View>
      </View>

      <View style={[styles.filterContainer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card, borderRadius: borderRadius.md }]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Filter size={18} color={colors.text} />
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            {selectedCategory}
          </Text>
          <View style={[styles.filterBadge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.filterBadgeText, { color: colors.accent }]}>
              {filteredNews.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingBottom: spacing.md }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Content</Text>
            </View>
            <View style={{ paddingVertical: spacing.sm }}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
                      isSelected && { backgroundColor: colors.accent + '10' },
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setFilterModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: isSelected ? colors.accent : colors.text },
                      isSelected && { fontWeight: '600' as const },
                    ]}>
                      {category}
                    </Text>
                    {isSelected && <Check size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.newsfeed}
        contentContainerStyle={[styles.newsfeedContent, { padding: spacing.lg, gap: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={[
          styles.newsGrid,
          isTablet && styles.newsGridTablet,
          isLargeTablet && styles.newsGridLarge,
          { gap: spacing.md },
        ]}>
        {newsQuery.isLoading && (
          <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading newsfeed...</Text>
          </View>
        )}
        {!newsQuery.isLoading && filteredNews.map((item, index) => {

          const isExpanded = expandedCard === item.id;
          const isTextExpanded = expandedText === item.id;
          const currentCarouselIndex = getCurrentCarouselIndex(item.id);

          return (
            <View
              key={item.id}
              style={[
                styles.newsCard,
                isTablet && !isExpanded && styles.newsCardTablet,
                isLargeTablet && !isExpanded && styles.newsCardLarge,
                isExpanded && styles.newsCardExpanded,
                {
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  if (item.category === 'Showcase' && item.virtualTourUrl && !isExpanded) {
                    toggleCard(item.id);
                  }
                }}
                activeOpacity={item.category === 'Showcase' && !isExpanded ? 0.9 : 1}
                disabled={item.category !== 'Showcase' || isExpanded}
              >
                {item.category === 'Showcase' && isExpanded && item.virtualTourUrl ? (
                  <View style={[
                    styles.virtualTourContainer,
                    isTablet && styles.virtualTourContainerTablet,
                  ]}>
                    {Platform.OS === 'web' ? (
                      <iframe
                        src={item.virtualTourUrl}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        allow="accelerometer; gyroscope; xr-spatial-tracking; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <WebView
                          source={{ uri: item.virtualTourUrl }}
                          style={styles.webView}
                          javaScriptEnabled={true}
                          domStorageEnabled={true}
                          startInLoadingState={true}
                          scalesPageToFit={true}
                          allowsInlineMediaPlayback={true}
                          mediaPlaybackRequiresUserAction={false}
                          onLoadStart={() => {
                            setWebViewLoading(prev => ({ ...prev, [item.id]: true }));
                          }}
                          onLoadEnd={() => {
                            setWebViewLoading(prev => ({ ...prev, [item.id]: false }));
                          }}
                          onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView error: ', nativeEvent);
                            setWebViewLoading(prev => ({ ...prev, [item.id]: false }));
                          }}
                          originWhitelist={['*']}
                          mixedContentMode="always"
                          thirdPartyCookiesEnabled={true}
                          sharedCookiesEnabled={true}
                          cacheEnabled={true}
                        />
                        {webViewLoading[item.id] && (
                          <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.accent} />
                          </View>
                        )}
                      </>
                    )}
                  </View>
                ) : item.category === 'Behind the Scenes' && item.images ? (
                  <View>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const index = Math.round(
                          event.nativeEvent.contentOffset.x /
                          event.nativeEvent.layoutMeasurement.width
                        );
                        handleCarouselScroll(item.id, index);
                      }}
                      style={styles.carousel}
                    >
                      {item.images.map((imageUri, imgIndex) => (
                        <Image
                          key={imgIndex}
                          source={{ uri: imageUri }}
                          style={[
                            styles.newsImage,
                            isTablet && styles.newsImageTablet,
                            { width: Dimensions.get('window').width - (spacing.lg * 2) },
                          ]}
                        />
                      ))}
                    </ScrollView>
                    <View style={[styles.carouselDots, { paddingVertical: spacing.sm }]}>
                      {item.images.map((_, dotIndex) => (
                        <View
                          key={dotIndex}
                          style={[
                            styles.carouselDot,
                            {
                              backgroundColor: currentCarouselIndex === dotIndex
                                ? colors.accent
                                : colors.textSecondary + '40',
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View>
                    <Image
                      source={{ uri: item.image }}
                      style={[
                        styles.newsImage,
                        isTablet && styles.newsImageTablet,
                      ]}
                    />
                    {item.category === 'Showcase' && item.virtualTourUrl && !isExpanded && (
                      <View style={styles.playButtonOverlay}>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
                          style={styles.playButtonGradient}
                        >
                          <View style={[styles.playButton, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                            <Play size={40} color="#000" fill="#000" style={styles.playIcon} />
                          </View>
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.newsContent, { padding: spacing.md }]}
                onPress={() => toggleText(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.newsMeta, { marginBottom: spacing.sm }]}>
                  <View style={[styles.categoryBadge, { paddingHorizontal: spacing.sm, backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>{item.date}</Text>
                </View>
                <View style={styles.titleRow}>
                  <Text style={[styles.newsTitle, { color: colors.text, marginBottom: spacing.xs, flex: 1 }]}>
                    {item.title}
                  </Text>
                  {isTextExpanded ? (
                    <ChevronUp size={20} color={colors.accent} style={styles.chevron} />
                  ) : (
                    <ChevronDown size={20} color={colors.accent} style={styles.chevron} />
                  )}
                </View>
                <Text
                  style={[
                    styles.newsDescription,
                    { color: colors.textSecondary },
                    !isTextExpanded && styles.newsDescriptionCollapsed,
                  ]}
                  numberOfLines={isTextExpanded ? undefined : 2}
                >
                  {isTextExpanded ? item.fullDescription : item.description}
                </Text>
              </TouchableOpacity>

              <SocialActions
                postId={item.id}
                virtualTourUrl={item.virtualTourUrl}
                onCommentPress={() => {
                  setActivePostId(item.id);
                  setCommentModalVisible(true);
                }}
                colors={colors}
                spacing={spacing}
              />
            </View>
          );
        })}
        </View>
      </ScrollView>

      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.commentModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.commentModalOverlay}
            activeOpacity={1}
            onPress={() => setCommentModalVisible(false)}
          />
          <View style={[styles.commentModal, { backgroundColor: colors.card }]}>
            <View style={[styles.commentModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.commentModalTitle, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity
                onPress={() => setCommentModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {activePostId && (
              <CommentsSection
                postId={activePostId}
                colors={colors}
                spacing={spacing}
                commentText={commentText}
                setCommentText={setCommentText}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

type CommentsSectionProps = {
  postId: string;
  colors: any;
  spacing: any;
  commentText: string;
  setCommentText: (text: string) => void;
};

function CommentsSection({ postId, colors, spacing, commentText, setCommentText }: CommentsSectionProps) {
  const interactionsQuery = trpc.social.getInteractions.useQuery({ postId });
  const addCommentMutation = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      interactionsQuery.refetch();
    },
  });

  const comments = interactionsQuery.data?.comments || [];

  const handleAddComment = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate({ postId, text: commentText.trim() });
    }
  };

  return (
    <>
      <ScrollView
        style={styles.commentsScrollView}
        contentContainerStyle={{ padding: spacing.md }}
      >
        {comments.length === 0 ? (
          <View style={styles.emptyCommentsContainer}>
            <MessageCircle size={48} color={colors.textSecondary} opacity={0.5} />
            <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={[styles.commentItem, { marginBottom: spacing.md }]}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentUsername, { color: colors.text }]}>
                  {comment.username}
                </Text>
                <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.commentText, { color: colors.text }]}>
                {comment.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.commentInputContainer, { borderTopColor: colors.border, backgroundColor: colors.background, marginBottom: spacing.xl }]}>
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.accent },
            (!commentText.trim() || addCommentMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || addCommentMutation.isPending}
          activeOpacity={0.7}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center' as const,
  },
  centerWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center' as const,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  menuButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  headerRightActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerLogos: {
    alignItems: 'center' as const,
    gap: 8,
  },
  mainLogo: {
    width: 230,
    height: 57.5,
  },

  poweredByContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  poweredByText: {
    fontSize: 11,
  },
  geckoLogo: {
    width: 115,
    height: 23,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center' as const,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden' as const,
  },
  modalHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  filterOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  filterOptionText: {
    fontSize: 16,
  },
  newsfeed: {
    flex: 1,
  },
  newsfeedContent: {
  },
  newsGrid: {
    flexDirection: 'column' as const,
  },
  newsGridTablet: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  newsGridLarge: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  newsCard: {
    overflow: 'hidden' as const,
    width: '100%',
  },
  newsCardExpanded: {
    width: '100%',
  },
  newsCardTablet: {
    width: 'calc(50% - 8px)' as any,
    flexBasis: '48%',
  },
  newsCardLarge: {
    width: 'calc(33.333% - 10.66px)' as any,
    flexBasis: '31%',
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsImageTablet: {
    height: 250,
  },
  newsContent: {
  },
  newsMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  categoryBadge: {
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  dateText: {
    fontSize: 12,
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  newsDescriptionCollapsed: {
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  chevron: {
    marginTop: 2,
  },
  virtualTourContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  virtualTourContainerTablet: {
    height: 500,
  },
  webView: {
    flex: 1,
  },
  carousel: {
    width: '100%',
  },
  carouselDots: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
    position: 'absolute' as const,
    bottom: 12,
    left: 0,
    right: 0,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playButtonOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  commentModalContainer: {
    flex: 1,
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentModal: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden' as const,
  },
  commentModalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
  },
  commentModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  commentsScrollView: {
    flex: 1,
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  commentItem: {
  },
  commentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row' as const,
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
