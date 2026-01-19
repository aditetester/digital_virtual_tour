import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Linking, Modal } from 'react-native';




import { useThemedStyles } from '@/lib/use-themed-styles';
import { Search, Filter, Grid3x3, FileText, Film, Monitor, Camera, Mail, X } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '@/lib/use-responsive';
import { trpc } from '@/lib/trpc';
import { WebView } from 'react-native-webview';




const categories = ['All', 'Virtual Tours', 'Photos', 'Videos', 'Documents', 'Presentation', 'Screenshot', 'Email Banner'];



export default function MediaScreen() {
  const { colors, spacing, borderRadius } = useThemedStyles();
  const { isTablet, isLargeTablet, contentMaxWidth } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const getAllQuery = trpc.media.getAll.useQuery(undefined, { enabled: selectedCategory === 'All' });
  const getToursQuery = trpc.media.getTours.useQuery(undefined, { enabled: selectedCategory === 'Virtual Tours' });
  const getPhotosQuery = trpc.media.getPhotos.useQuery(undefined, { enabled: selectedCategory === 'Photos' });
  const getVideosQuery = trpc.media.getVideos.useQuery(undefined, { enabled: selectedCategory === 'Videos' });
  const getDocumentsQuery = trpc.media.getDocuments.useQuery(undefined, { enabled: selectedCategory === 'Documents' });
  const getPresentationsQuery = trpc.media.getPresentations.useQuery(undefined, { enabled: selectedCategory === 'Presentation' });
  const getScreenshotsQuery = trpc.media.getScreenshots.useQuery(undefined, { enabled: selectedCategory === 'Screenshot' });
  const getBannersQuery = trpc.media.getBanners.useQuery(undefined, { enabled: selectedCategory === 'Email Banner' });

  const activeQuery = useMemo(() => {
    switch (selectedCategory) {
      case 'Virtual Tours': return getToursQuery;
      case 'Photos': return getPhotosQuery;
      case 'Videos': return getVideosQuery;
      case 'Documents': return getDocumentsQuery;
      case 'Presentation': return getPresentationsQuery;
      case 'Screenshot': return getScreenshotsQuery;
      case 'Email Banner': return getBannersQuery;
      default: return getAllQuery;
    }
  }, [selectedCategory, getAllQuery, getToursQuery, getPhotosQuery, getVideosQuery, getDocumentsQuery, getPresentationsQuery, getScreenshotsQuery, getBannersQuery]);

  const mediaItems = activeQuery.data || [];


  const filteredMedia = mediaItems.filter((item) => {

    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Virtual Tours' && item.type === 'tour') ||
      (selectedCategory === 'Photos' && item.type === 'photo') ||
      (selectedCategory === 'Videos' && item.type === 'video') ||
      (selectedCategory === 'Documents' && item.type === 'document') ||
      (selectedCategory === 'Presentation' && item.type === 'presentation') ||
      (selectedCategory === 'Screenshot' && item.type === 'screenshot') ||
      (selectedCategory === 'Email Banner' && item.type === 'email-banner');
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tour':
        return <Grid3x3 size={20} color={colors.accent} />;
      case 'video':
        return <Film size={20} color={colors.accent} />;
      case 'document':
        return <FileText size={20} color={colors.accent} />;
      case 'presentation':
        return <Monitor size={20} color={colors.accent} />;
      case 'screenshot':
        return <Camera size={20} color={colors.accent} />;
      case 'email-banner':
        return <Mail size={20} color={colors.accent} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.centerWrapper, { maxWidth: contentMaxWidth }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Media Hub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Digital asset library</Text>
      </View>

      <View style={[styles.searchContainer, { paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search media..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.card }]}>
          <Filter size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={[styles.categoryContent, { paddingHorizontal: spacing.lg, gap: spacing.sm }]}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive ? 'transparent' : colors.card,
                  borderColor: colors.border,
                },
                !isActive && {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryChipGradient}
                >
                  <Text style={[styles.categoryText, styles.categoryTextActive]}>
                    {category}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.categoryText, { color: colors.text }]}>
                  {category}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { padding: spacing.lg }]}>
        <View style={[
          styles.mediaGrid,
          { gap: spacing.md },
          isTablet && { justifyContent: 'flex-start' as const },
        ]}>
          {activeQuery.isLoading && (
            <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', width: '100%' }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading {selectedCategory.toLowerCase()}...</Text>
            </View>
          )}
          {!activeQuery.isLoading && filteredMedia.map((item) => (


            <TouchableOpacity key={item.id} style={[
              styles.mediaCard,
              { backgroundColor: colors.card, borderRadius: borderRadius.lg },
              isLargeTablet && styles.mediaCardLarge,
              isTablet && !isLargeTablet && styles.mediaCardTablet,
            ]} activeOpacity={0.8} onPress={() => setSelectedMedia(item)}>

              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={[styles.mediaThumbnail, { backgroundColor: colors.border }]} />
              ) : (
                <View style={[styles.mediaThumbnail, styles.documentPlaceholder, { backgroundColor: colors.border }]}>
                  <FileText size={32} color={colors.accent} />
                </View>
              )}
              <View style={[styles.mediaOverlay, { top: spacing.sm, right: spacing.sm }]}>
                {item.type !== 'photo' && (
                  <View style={[styles.typeIndicator, { backgroundColor: colors.background + 'CC' }]}>{getTypeIcon(item.type)}</View>
                )}
              </View>
              <View style={[styles.mediaInfo, { padding: spacing.sm }]}>
                <Text style={[styles.mediaTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.size && <Text style={[styles.mediaSize, { color: colors.textSecondary }]}>{item.size}</Text>}
              </View>
            </TouchableOpacity>
          ))}
          {!activeQuery.isLoading && filteredMedia.length === 0 && (
            <View style={{flex: 1, padding: spacing.xl, alignItems: 'center', width: '100%'}}>
              <Text style={{color: colors.textSecondary}}>No media found matching your filters.</Text>
            </View>
          )}

        </View>

      </ScrollView>
      </View>

      <Modal
        visible={!!selectedMedia}
        animationType="slide"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>
              {selectedMedia?.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMedia(null)} style={{ padding: 4 }}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {selectedMedia?.type === 'tour' || selectedMedia?.type === 'presentation' ? (
              <WebView 
                source={{ uri: selectedMedia.url }} 
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                  <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                  </View>
                )}
              />
            ) : selectedMedia?.type === 'video' ? (
              <WebView 
                source={{ uri: selectedMedia.url }} 
                style={{ flex: 1 }}
                allowsFullscreenVideo
              />
            ) : selectedMedia?.type === 'document' ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                <FileText size={64} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 18, marginTop: spacing.md, textAlign: 'center' }}>
                  {selectedMedia.title}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
                  File format not previewable in this view.
                </Text>
                <TouchableOpacity 
                   style={{ backgroundColor: colors.accent, padding: spacing.md, borderRadius: 20, marginTop: spacing.xl }}
                   onPress={() => Linking.openURL(selectedMedia.url)}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image 
                source={{ uri: selectedMedia?.url }} 
                style={{ flex: 1 }} 
                resizeMode="contain" 
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row' as const,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryContent: {
    alignItems: 'center' as const,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  categoryChipActive: {
    borderWidth: 0,
    padding: 0,
  },
  categoryChipGradient: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
  },
  mediaGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  mediaCard: {
    width: '47%',
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  mediaCardTablet: {
    width: '31%',
  },
  mediaCardLarge: {
    width: '23%',
  },
  mediaThumbnail: {
    width: '100%',
    height: 150,
  },
  documentPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mediaOverlay: {
    position: 'absolute' as const,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  mediaInfo: {
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  mediaSize: {
    fontSize: 12,
  },
});
