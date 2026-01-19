import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Image, TextInput, Modal, Linking, Platform, ActivityIndicator } from 'react-native';
import { getThemeColors, GeckoTheme, ThemeColors } from '@/constants/theme';
import { Download, Trash2, Plus, X, ExternalLink, XCircle, FolderOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';
import { useResponsive } from '@/lib/use-responsive';
import { trpc } from '@/lib/trpc';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { WebView } from 'react-native-webview';

type DownloadItem = {
  id: string;
  imageUrl: string;
  downloadUrl: string;
  title?: string;
  description?: string;
  isDownloaded: boolean;
  localUri?: string;
  isZip?: boolean;
  unzippedPath?: string;
  indexHtmlPath?: string;
};

export default function DownloadsScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { isTablet, contentMaxWidth } = useResponsive();
  const styles = getStyles(colors, isTablet);
  
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState<string | null>(null);
  const [newDownload, setNewDownload] = useState({
    imageUrl: '',
    downloadUrl: '',
    title: '',
    description: '',
  });

  const downloadsQuery = trpc.downloads.getAll.useQuery();

  React.useEffect(() => {
    if (downloadsQuery.data) {
      setDownloads(prev => {
        const newItems = downloadsQuery.data.filter(
          serverItem => !prev.find(localItem => localItem.id === serverItem.id)
        );
        return [...prev, ...newItems.map(item => ({
          ...item,
          isDownloaded: false,
        }))];
      });
    }
  }, [downloadsQuery.data]);

  const addUrlMutation = trpc.downloads.addUrl.useMutation({
    onSuccess: (data) => {
      setDownloads(prev => [...prev, {
        ...data,
        isDownloaded: false,
      }]);
      setShowAddModal(false);
      setNewDownload({
        imageUrl: '',
        downloadUrl: '',
        title: '',
        description: '',
      });
      Alert.alert('Success', 'Download URL added successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to add download URL');
    },
  });

  const removeUrlMutation = trpc.downloads.removeUrl.useMutation({
    onSuccess: () => {
      Alert.alert('Removed', 'Item has been removed from the list.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to remove item');
    },
  });

  const convertToDirectDownloadUrl = (url: string): string => {
    console.log('Original URL:', url);

    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([^\/]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&confirm=t`;
        console.log('Converted Google Drive URL to:', directUrl);
        return directUrl;
      }
    }

    if (url.includes('dropbox.com')) {
      let convertedUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      convertedUrl = convertedUrl.replace(/[?&]dl=0/g, '').replace(/[?&]dl=1/g, '');
      if (!convertedUrl.includes('?')) {
        convertedUrl += '?raw=1';
      } else {
        convertedUrl += '&raw=1';
      }
      console.log('Converted Dropbox URL to:', convertedUrl);
      return convertedUrl;
    }

    console.log('Using original URL (no conversion needed)');
    return url;
  };

  const convertToThumbnailUrl = (url: string): string => {
    if (url.includes('dropbox.com')) {
      let convertedUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      convertedUrl = convertedUrl.replace(/[?&]dl=0/g, '?raw=1').replace(/[?&]dl=1/g, '?raw=1');
      if (!convertedUrl.includes('raw=1')) {
        convertedUrl += (convertedUrl.includes('?') ? '&' : '?') + 'raw=1';
      }
      return convertedUrl;
    }
    return url;
  };

  const isZipFile = (url: string): boolean => {
    return url.toLowerCase().includes('.zip');
  };

  const unzipFile = async (zipUri: string, itemId: string): Promise<string | null> => {
    try {
      console.log('Starting unzip process for:', zipUri);
      
      const zipPath = zipUri.replace('file://', '');
      const exists = await RNFS.exists(zipPath);
      if (!exists) {
        throw new Error('ZIP file not found at: ' + zipPath);
      }
      
      const stat = await RNFS.stat(zipPath);
      console.log('ZIP file size:', stat.size, 'bytes');
      
      if (stat.size < 100) {
        throw new Error('ZIP file is too small to be valid.');
      }
      
      const unzipDir = `${RNFS.CachesDirectoryPath}/unzipped_${itemId}`;
      const unzipDirExists = await RNFS.exists(unzipDir);
      
      if (unzipDirExists) {
        console.log('Cleaning up existing unzip directory...');
        await RNFS.unlink(unzipDir);
      }
      await RNFS.mkdir(unzipDir);
      
      console.log('Unzipping to:', unzipDir);
      
      const path = await unzip(zipPath, unzipDir);
      console.log('Unzip completed to:', path);
      
      // Find index.html
      const findIndexHtml = async (dir: string): Promise<string | null> => {
        const items = await RNFS.readDir(dir);
        for (const item of items) {
          if (item.isFile() && (item.name.toLowerCase() === 'index.html' || item.name.toLowerCase() === 'index.htm')) {
            return item.path;
          }
          if (item.isDirectory()) {
            const found = await findIndexHtml(item.path);
            if (found) return found;
          }
        }
        return null;
      };
      
      const indexHtmlPath = await findIndexHtml(unzipDir);
      console.log(`Unzip process finished. Index HTML: ${indexHtmlPath}`);
      return indexHtmlPath || unzipDir;
    } catch (error) {
      console.error('Unzip error:', error);
      throw error;
    }
  };

  const handleDownload = async (item: DownloadItem) => {
    console.log('===== DOWNLOAD STARTING =====');
    console.log('Item:', item.title || item.id);
    console.log('Download URL:', item.downloadUrl);
    
    setDownloading(item.id);
    setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }));

    try {
      const directUrl = convertToDirectDownloadUrl(item.downloadUrl);
      const isZip = isZipFile(directUrl);

      console.log('Direct URL:', directUrl);
      console.log('Is ZIP:', isZip);

      if (Platform.OS === 'web') {
        await Linking.openURL(directUrl);
        setDownloads(prev =>
          prev.map(d =>
            d.id === item.id ? { ...d, isDownloaded: true, isZip } : d
          )
        );
        setDownloading(null);
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[item.id];
          return newProgress;
        });
        Alert.alert('Success', 'Download started in your browser!');
        return;
      }

      console.log('Creating downloads directory...');
      const downloadsDir = `${RNFS.CachesDirectoryPath}/downloads`;
      const downloadsDirExists = await RNFS.exists(downloadsDir);
      if (!downloadsDirExists) {
        await RNFS.mkdir(downloadsDir);
      }
      console.log('Downloads dir created:', downloadsDir);
      
      setDownloadProgress(prev => ({ ...prev, [item.id]: 5 }));
      
      const fileName = `download_${item.id}_${Date.now()}.${isZip ? 'zip' : 'file'}`;
      const downloadedFilePath = `${downloadsDir}/${fileName}`;
      console.log('Target file:', downloadedFilePath);
      
      console.log('Starting download with react-native-fs...');
      setDownloadProgress(prev => ({ ...prev, [item.id]: 10 }));
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: directUrl,
        toFile: downloadedFilePath,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:1.0) Gecko/1.0 Firefox/1.0',
        },
        progress: (res) => {
          const progress = Math.floor((res.bytesWritten / res.contentLength) * 60) + 10;
          setDownloadProgress(prev => ({ ...prev, [item.id]: progress }));
        },
        progressDivider: 1,
      }).promise;
      
      console.log('Download completed. Status:', downloadResult.statusCode);
      
      if (downloadResult.statusCode >= 400) {
        throw new Error(`Server returned status code ${downloadResult.statusCode}`);
      }
      const fileExists = await RNFS.exists(downloadedFilePath);
      
      if (!fileExists) {
        throw new Error('Downloaded file missing from disk. Download might have failed silently.');
      }
      
      const fileStat = await RNFS.stat(downloadedFilePath);
      console.log('Result path:', downloadedFilePath);
      console.log('File exists:', fileExists);
      console.log('File size:', fileStat.size);
      
      const result = {
        uri: `file://${downloadedFilePath}`,
        exists: fileExists,
        size: fileStat.size,
      };
      
      setDownloadProgress(prev => ({ ...prev, [item.id]: 70 }));
      
      if (!result.exists || result.size === 0) {
        throw new Error('Downloaded file is empty or does not exist.');
      }
      
      if (result.size < 100) {
        const fileContent = await RNFS.readFile(downloadedFilePath, 'utf8');
        console.error('Response preview:', fileContent.substring(0, 500));
        
        if (fileContent.includes('Google Drive') || fileContent.includes('<!DOCTYPE') || fileContent.includes('<html')) {
          throw new Error('Google Drive file is not publicly accessible. Please:\n\n1. Right-click the file in Google Drive\n2. Click "Share"\n3. Set to "Anyone with the link" can VIEW\n4. Copy the share link and try again');
        }
        
        throw new Error('The download link did not return a valid file. Please ensure the file is publicly accessible.');
      }
      
      console.log('File verification: EXISTS');
      console.log('Downloaded file path:', result.uri);
      setDownloadProgress(prev => ({ ...prev, [item.id]: 80 }));
      
      let indexHtmlPath: string | undefined;
      let unzippedPath: string | undefined;
      
      if (isZip) {
        console.log('===== UNZIPPING FILE =====');
        setDownloadProgress(prev => ({ ...prev, [item.id]: 85 }));
        try {
          const extractedPath = await unzipFile(result.uri, item.id);
          if (extractedPath) {
            indexHtmlPath = extractedPath;
            if (extractedPath.includes('/')) {
              unzippedPath = extractedPath.split('/').slice(0, -1).join('/');
            } else {
              unzippedPath = extractedPath;
            }
            console.log('Unzipped successfully!');
            console.log('Unzipped path:', unzippedPath);
            console.log('Index HTML:', indexHtmlPath);
          }
          setDownloadProgress(prev => ({ ...prev, [item.id]: 95 }));
        } catch (unzipError: any) {
          console.error('===== UNZIP FAILED =====');
          console.error('Error:', unzipError);
          const errorMsg = unzipError?.message || 'Failed to extract ZIP file';
          Alert.alert('Extraction Failed', errorMsg);
        }
      }
      
      setDownloadProgress(prev => ({ ...prev, [item.id]: 100 }));
      
      setDownloads(prev =>
        prev.map(d =>
          d.id === item.id ? {
            ...d,
            isDownloaded: true,
            localUri: result.uri,
            isZip,
            unzippedPath,
            indexHtmlPath,
          } : d
        )
      );
      
      setTimeout(() => {
        Alert.alert(
          'Success',
          isZip && indexHtmlPath
            ? 'Virtual tour downloaded and extracted successfully! Tap the image to view it.'
            : 'File downloaded successfully! Tap the image to view it.'
        );
      }, 300);
    } catch (error: any) {
      console.error('===== DOWNLOAD FAILED =====');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      let errorMessage = error?.message || 'Failed to download file.';
      
      if (error?.message?.includes('401')) {
        errorMessage = 'Authentication required. Please ensure:\n\n' +
          '• Google Drive: File must be publicly accessible\n' +
          '• Dropbox: Use public share link\n' +
          '• S3/Azure: File must have public read access or use pre-signed URL';
      } else if (error?.message?.includes('403')) {
        errorMessage = 'Access denied. Make sure the file is publicly accessible.';
      } else if (error?.message?.includes('404')) {
        errorMessage = 'File not found. Please check the URL.';
      } else if (error?.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error?.message?.includes('fetch')) {
        errorMessage = 'Failed to fetch file: ' + error.message;
      }
      
      Alert.alert('Download Error', errorMessage);
    } finally {
      console.log('===== DOWNLOAD CLEANUP =====');
      setDownloading(null);
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[item.id];
          return newProgress;
        });
      }, 500);
    }
  };

  const handleDelete = async (item: DownloadItem) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file from your device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                if (item.localUri) {
                  const path = item.localUri.replace('file://', '');
                  const exists = await RNFS.exists(path);
                  if (exists) {
                    await RNFS.unlink(path);
                    console.log('File deleted:', path);
                  }
                }
                
                if (item.unzippedPath) {
                  const path = item.unzippedPath.replace('file://', '');
                  const exists = await RNFS.exists(path);
                  if (exists) {
                    await RNFS.unlink(path);
                    console.log('Unzipped folder deleted:', path);
                  }
                }
              }
              
              setDownloads(prev =>
                prev.map(d =>
                  d.id === item.id ? {
                    ...d,
                    isDownloaded: false,
                    localUri: undefined,
                    unzippedPath: undefined,
                    indexHtmlPath: undefined,
                  } : d
                )
              );
              Alert.alert('Deleted', 'File has been removed from your device.');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete file.');
            }
          },
        },
      ]
    );
  };

  const handleOpenVirtualTour = useCallback((item: DownloadItem) => {
    if (item.indexHtmlPath) {
      console.log('Opening virtual tour:', item.indexHtmlPath);
      setShowVirtualTour(item.indexHtmlPath);
    } else {
      Alert.alert('Error', 'Virtual tour files not found. Please re-download.');
    }
  }, []);

  const handleOpenItem = useCallback((item: DownloadItem) => {
    console.log('Opening item:', item.title || item.id, 'Downloaded:', item.isDownloaded);
    
    if (!item.isDownloaded) {
      Alert.alert('Not Downloaded', 'Please download the file first by tapping the download button.');
      return;
    }
    
    if (item.isZip && item.indexHtmlPath) {
      console.log('Opening virtual tour from index.html');
      handleOpenVirtualTour(item);
    } else if (item.localUri) {
      console.log('Opening file:', item.localUri);
      if (Platform.OS === 'web') {
        Linking.openURL(item.localUri).catch(err => {
          console.error('Failed to open file:', err);
          Alert.alert('Error', 'Failed to open file.');
        });
      } else {
        setShowVirtualTour(item.localUri);
      }
    } else {
      Alert.alert('Error', 'File not found. Please re-download.');
    }
  }, [handleOpenVirtualTour]);

  const handleAddDownload = () => {
    if (!newDownload.imageUrl || !newDownload.downloadUrl) {
      Alert.alert('Error', 'Please provide both image URL and download URL');
      return;
    }

    addUrlMutation.mutate(newDownload);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.centerWrapper, { maxWidth: contentMaxWidth }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Downloads</Text>
            <Text style={styles.subtitle}>Manage your cloud content</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {downloadsQuery.isLoading && (
            <Text style={styles.loadingText}>Loading downloads...</Text>
          )}
          
          {downloads.map((item) => {
            const thumbnailUri = convertToThumbnailUrl(item.imageUrl);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.downloadCard}
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.downloadImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('Image load error for:', thumbnailUri, error.nativeEvent);
                  }}
                />
                
                {(item.title || item.description) && (
                  <View style={styles.infoContainer}>
                    {item.title && <Text style={styles.itemTitle}>{item.title}</Text>}
                    {item.description && (
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                )}
                
                <View style={styles.actionButtons}>
                  {!item.isDownloaded ? (
                    <TouchableOpacity
                      style={[styles.iconButton, styles.downloadButton]}
                      onPress={() => handleDownload(item)}
                      disabled={downloading === item.id}
                    >
                      <Download size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <>
                      {item.indexHtmlPath && (
                        <TouchableOpacity
                          style={[styles.iconButton, styles.openButton]}
                          onPress={() => handleOpenVirtualTour(item)}
                        >
                          <FolderOpen size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.iconButton, styles.deleteButton]}
                        onPress={() => handleDelete(item)}
                      >
                        <Trash2 size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    Alert.alert(
                      'Remove Item',
                      'Remove this item from the list?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => {
                            removeUrlMutation.mutate({ id: item.id });
                            setDownloads(prev => prev.filter(d => d.id !== item.id));
                          },
                        },
                      ]
                    );
                  }}
                >
                  <XCircle size={20} color="rgba(255, 255, 255, 0.8)" />
                </TouchableOpacity>
                
                {downloading === item.id && (
                  <View style={styles.downloadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.downloadingText}>
                      {downloadProgress[item.id] !== undefined && downloadProgress[item.id] < 50
                        ? `Downloading... ${downloadProgress[item.id]}%`
                        : downloadProgress[item.id] !== undefined && downloadProgress[item.id] < 100
                        ? `Processing... ${downloadProgress[item.id]}%`
                        : 'Downloading...'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Cloud URL</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Image URL *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={colors.textSecondary}
                value={newDownload.imageUrl}
                onChangeText={(text) => setNewDownload(prev => ({ ...prev, imageUrl: text }))}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Download URL * (Cloud Storage Link)</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, flex: 1 }]}
                  placeholder="https://drive.google.com/file/d/... or https://s3.amazonaws.com/..."
                  placeholderTextColor={colors.textSecondary}
                  value={newDownload.downloadUrl}
                  onChangeText={(text) => setNewDownload(prev => ({ ...prev, downloadUrl: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <ExternalLink size={20} color={colors.textSecondary} style={styles.inputIcon} />
              </View>
              <Text style={styles.helperText}>
                📁 Google Drive ZIP files:{"\n"}
                   • Right-click file → Share → Anyone with link can VIEW{"\n"}
                   • Copy the share link{"\n"}
                   • Link will be auto-converted to direct download{"\n"}
                {"\n"}
                📦 Dropbox: Use public share link{"\n"}
                🔗 Direct links: Must end with .zip and be publicly accessible
              </Text>

              <Text style={styles.label}>Title (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="e.g., Project Files 2024"
                placeholderTextColor={colors.textSecondary}
                value={newDownload.title}
                onChangeText={(text) => setNewDownload(prev => ({ ...prev, title: text }))}
              />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Add a description..."
                placeholderTextColor={colors.textSecondary}
                value={newDownload.description}
                onChangeText={(text) => setNewDownload(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.accent }]}
                onPress={handleAddDownload}
                disabled={addUrlMutation.isPending}
              >
                <Text style={styles.buttonText}>
                  {addUrlMutation.isPending ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVirtualTour !== null}
        animationType="slide"
        onRequestClose={() => setShowVirtualTour(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <View style={styles.tourHeader}>
            <Text style={styles.tourTitle}>Virtual Tour</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVirtualTour(null)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {showVirtualTour && (() => {
            const fileUri = showVirtualTour.startsWith('file://') ? showVirtualTour : `file://${showVirtualTour}`;
            const parentDirectory = fileUri.substring(0, fileUri.lastIndexOf('/'));
            
            console.log('WebView file URI:', fileUri);
            console.log('WebView parent directory for iOS read access:', parentDirectory);
            
            return (
              <WebView
                source={{
                  uri: fileUri,
                  ...(Platform.OS === 'ios' && { allowingReadAccessToURL: parentDirectory }),
                }}
                style={{ flex: 1 }}
                originWhitelist={['*']}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                mixedContentMode="always"
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                  Alert.alert('Error', `Failed to load virtual tour: ${nativeEvent.description || 'Unknown error'}`);
                }}
                onLoad={() => console.log('Virtual tour loaded successfully')}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView HTTP error:', nativeEvent);
                }}
                renderLoading={() => (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={{ marginTop: 16, color: colors.text }}>Loading virtual tour...</Text>
                  </View>
                )}
              />
            );
          })()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isTablet: boolean) => StyleSheet.create({
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
    paddingHorizontal: GeckoTheme.spacing.lg,
    paddingVertical: GeckoTheme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: GeckoTheme.spacing.lg,
    gap: GeckoTheme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: GeckoTheme.spacing.xl,
  },
  downloadCard: {
    borderRadius: GeckoTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  downloadImage: {
    width: '100%',
    height: isTablet ? 300 : 220,
  },
  infoContainer: {
    padding: GeckoTheme.spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButtons: {
    position: 'absolute' as const,
    bottom: GeckoTheme.spacing.md,
    right: GeckoTheme.spacing.md,
    flexDirection: 'row',
    gap: GeckoTheme.spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  openButton: {
    backgroundColor: '#2196F3',
  },
  downloadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  removeButton: {
    position: 'absolute' as const,
    top: GeckoTheme.spacing.sm,
    right: GeckoTheme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GeckoTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalBody: {
    padding: GeckoTheme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: GeckoTheme.spacing.sm,
    marginTop: GeckoTheme.spacing.md,
  },
  input: {
    borderRadius: GeckoTheme.borderRadius.md,
    padding: GeckoTheme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GeckoTheme.spacing.sm,
  },
  inputIcon: {
    position: 'absolute' as const,
    right: GeckoTheme.spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: GeckoTheme.spacing.xs,
    fontStyle: 'italic' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: GeckoTheme.spacing.lg,
    gap: GeckoTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: GeckoTheme.spacing.md,
    borderRadius: GeckoTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonModal: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  tourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GeckoTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tourTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    padding: GeckoTheme.spacing.sm,
  },
});
