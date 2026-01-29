import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Image, TextInput, Modal, Linking, Platform, ActivityIndicator } from 'react-native';
import { getThemeColors, GeckoTheme, ThemeColors } from '@/constants/theme';
import { Download, Trash2, Plus, X, ExternalLink, XCircle, FolderOpen, Pause, Play, RotateCcw, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';
import { useResponsive } from '@/lib/use-responsive';
import { trpc } from '@/lib/trpc';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { WebView } from 'react-native-webview';
import StaticServer from '@dr.pogodin/react-native-static-server';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DownloadStatus = 'NOT_DOWNLOADED' | 'DOWNLOADING' | 'EXTRACTING' | 'PAUSED' | 'DOWNLOADED' | 'UPDATE_AVAILABLE' | 'FAILED';

type DownloadItem = {
  id: string;
  imageUrl: string;
  downloadUrl: string;
  title?: string;
  description?: string;
  fileSize?: number;
  status: DownloadStatus;
  localUri?: string;
  isZip?: boolean;
  unzippedPath?: string;
  indexHtmlPath?: string;
  progress: number;
  downloadedBytes?: number;
  createdAt?: string;
  jobId?: number;
  isResumedDownload?: boolean;
};

export default function DownloadsScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { isTablet, contentMaxWidth } = useResponsive();
  const styles = getStyles(colors, isTablet);
  
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<DownloadItem | null>(null);
  const [showVirtualTour, setShowVirtualTour] = useState<string | null>(null);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [isWifi, setIsWifi] = useState<boolean | null>(true);
  
  const [newDownload, setNewDownload] = useState({
    imageUrl: '',
    downloadUrl: '',
    title: '',
    description: '',
  });

  const downloadResumableRef = React.useRef<{ [key: string]: any }>({});

  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const serverRef = React.useRef<any>(null);
  const isPausedRef = React.useRef<{ [key: string]: boolean }>({});
  const isCancelledRef = React.useRef<{ [key: string]: boolean }>({});

  const stopServer = useCallback(async () => {
    if (serverRef.current) {
      try {
        await serverRef.current.stop();
        console.log('Local server stopped');
      } catch (err) {
        console.error('Error stopping server:', err);
      }
      serverRef.current = null;
    }
    setServerUrl(null);
  }, []);

  const downloadsQuery = trpc.downloads.getAll.useQuery();

  // Load persisted downloads from AsyncStorage on mount
  React.useEffect(() => {
    const loadPersistedDownloads = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@offline_tours');
        if (jsonValue != null) {
          const persisted = JSON.parse(jsonValue);
          // Reset any items stuck in DOWNLOADING or containing active jobIds
          const sanitized = persisted.map((item: DownloadItem) => {
            if (item.status === 'DOWNLOADING') {
              return { ...item, status: 'PAUSED', jobId: undefined };
            }
            return { ...item, jobId: undefined };
          });
          setDownloads(sanitized);
        }
      } catch (e) {
        console.error('Failed to load persisted downloads', e);
      }
    };
    loadPersistedDownloads();
  }, []);

  // Save downloads to AsyncStorage whenever they change
  React.useEffect(() => {
    const savePersistedDownloads = async () => {
      try {
        await AsyncStorage.setItem('@offline_tours', JSON.stringify(downloads));
      } catch (e) {
        console.error('Failed to save persisted downloads', e);
      }
    };
    if (downloads.length > 0) {
      savePersistedDownloads();
    }
  }, [downloads]);

  // Monitor Network
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsWifi(state.type === 'wifi');
    });
    return () => unsubscribe();
  }, []);

  // Calculate storage used
  React.useEffect(() => {
    const calculateStorage = async () => {
      let total = 0;
      for (const item of downloads) {
        if (item.status === 'DOWNLOADED' && item.localUri) {
          try {
            const path = item.localUri.replace('file://', '');
            const exists = await RNFS.exists(path);
            if (exists) {
              const stat = await RNFS.stat(path);
              total += stat.size;
            }
            if (item.unzippedPath) {
              const unzipPath = item.unzippedPath.replace('file://', '');
              const unzipExists = await RNFS.exists(unzipPath);
              if (unzipExists) {
                // Approximate directory size or iterate files (simplified for now)
                // RNFS doesn't have a direct dir size, we could recurse but let's keep it simple
                // or just use the ZIP size as a baseline
              }
            }
          } catch (err) {
            console.error('Error calculating file size:', err);
          }
        }
      }
      setTotalStorageUsed(total);
    };
    calculateStorage();
  }, [downloads]);

  React.useEffect(() => {
    if (downloadsQuery.data) {
      setDownloads(prev => {
        const updatedItems = [...prev];
        
        downloadsQuery.data.forEach(serverItem => {
          const existingIndex = prev.findIndex(localItem => localItem.id === serverItem.id);
          
          if (existingIndex === -1) {
            // New item
            updatedItems.push({
              ...serverItem,
              status: 'NOT_DOWNLOADED',
              progress: 0,
            });
          } else {
            // Check for update
            const localItem = prev[existingIndex];
            const serverCreatedAt = new Date(serverItem.createdAt).getTime();
            const localCreatedAt = localItem.createdAt ? new Date(localItem.createdAt).getTime() : 0;
            
            if (serverCreatedAt > localCreatedAt && localItem.status === 'DOWNLOADED') {
              updatedItems[existingIndex] = {
                ...localItem,
                ...serverItem, // Update metadata
                status: 'UPDATE_AVAILABLE',
              };
            } else if (localItem.status === 'NOT_DOWNLOADED' || localItem.status === 'FAILED') {
               // Sync metadata if not yet downloaded
               updatedItems[existingIndex] = {
                 ...localItem,
                 ...serverItem,
               };
            }
          }
        });
        
        return updatedItems;
      });
    }
  }, [downloadsQuery.data]);

  React.useEffect(() => {
    return () => {
      stopServer();
    };
  }, [stopServer]);

  const addUrlMutation = trpc.downloads.addUrl.useMutation({
    onSuccess: () => {
      downloadsQuery.refetch();
      Alert.alert('Added', 'New item has been added to the list.');
      setShowAddModal(false);
      setNewDownload({ imageUrl: '', downloadUrl: '', title: '', description: '' });
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to add item');
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

  const handleDownload = async (item: DownloadItem, forceCellular = false, isResume = false) => {
    if (downloading && downloading !== item.id) {
      Alert.alert('Download in Progress', 'Please wait for the current download to finish or pause it first.');
      return;
    }

    if (!forceCellular && !isWifi) {
      setShowConfirmModal(item);
      return;
    }

    console.log(isResume ? '===== DOWNLOAD RESUMING =====' : '===== DOWNLOAD STARTING =====');
    console.log('Item:', item.title || item.id);
    
    setDownloading(item.id);
    isPausedRef.current[item.id] = false;
    isCancelledRef.current[item.id] = false;

    setDownloads(prev => prev.map(d => 
      d.id === item.id ? { ...d, status: 'DOWNLOADING' } : d
    ));

    try {
      const directUrl = convertToDirectDownloadUrl(item.downloadUrl);
      const isZip = isZipFile(directUrl);

      if (Platform.OS === 'web') {
        await Linking.openURL(directUrl);
        setDownloads(prev =>
          prev.map(d =>
            d.id === item.id ? { ...d, status: 'DOWNLOADED', progress: 100, isZip } : d
          )
        );
        setDownloading(null);
        Alert.alert('Success', 'Offline content download started in your browser!');
        return;
      }

      const downloadsDir = `${RNFS.CachesDirectoryPath}/downloads`;
      if (!(await RNFS.exists(downloadsDir))) {
        await RNFS.mkdir(downloadsDir);
      }
      
      // Use a consistent filename based on item id
      const fileName = `tour_${item.id}.${isZip ? 'zip' : 'file'}`;
      const downloadedFilePath = `${downloadsDir}/${fileName}`;
      
      let resumeOffset = 0;
      let isResumedDownload = false;
      if (isResume && await RNFS.exists(downloadedFilePath)) {
        const stat = await RNFS.stat(downloadedFilePath);
        resumeOffset = stat.size;
        isResumedDownload = resumeOffset > 0;
      } else {
        // Fresh download, clear existing file if any
        if (await RNFS.exists(downloadedFilePath)) {
          await RNFS.unlink(downloadedFilePath);
        }
      }
      setDownloads(prev =>
        prev.map(d =>
          d.id === item.id
            ? { ...d, isResumedDownload }
            : d
        )
      );

      const headers: { [key: string]: string } = {
        'User-Agent': 'Mozilla/5.0 (Mobile; rv:1.0) Gecko/1.0 Firefox/1.0',
      };

      if (resumeOffset > 0) {
        headers['Range'] = `bytes=${resumeOffset}-`;
      }

      // If resuming, download to a temp file then append
      const targetPath = resumeOffset > 0 ? `${downloadedFilePath}.tmp` : downloadedFilePath;

      const downloadJob = RNFS.downloadFile({
        fromUrl: directUrl,
        toFile: targetPath,
        headers,
        progress: (res) => {
          // prevent native crash after pause or cancel
          if (isPausedRef.current[item.id] || isCancelledRef.current[item.id]) return;

          const currentTotalWritten = resumeOffset + res.bytesWritten;
          const totalSize =
            (item.fileSize || res.contentLength) +
            (resumeOffset > 0 ? resumeOffset : 0);

          const progress = Math.min(
            99,
            Math.floor((currentTotalWritten / totalSize) * 100)
          );

          setDownloads(prev =>
            prev.map(d =>
              d.id === item.id
                ? {
                    ...d,
                    progress,
                    downloadedBytes: currentTotalWritten,
                    fileSize: totalSize,
                  }
                : d
            )
          );
        },

        progressDivider: 1,
      });

      downloadResumableRef.current[item.id] = downloadJob;
      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, jobId: downloadJob.jobId } : d));

      // IMMEDIATE CHECK: If user paused/cancelled while we were initialized the job
      if (isPausedRef.current[item.id]) {
        console.log('User requested pause during initialization, stopping immediately.');
        try { RNFS.stopDownload(downloadJob.jobId); } catch (e) { console.log(e); }
      }
      if (isCancelledRef.current[item.id]) {
        console.log('User requested cancel during initialization, stopping immediately.');
        try { RNFS.stopDownload(downloadJob.jobId); } catch (e) { console.log(e); }
      }

      const downloadResult = await downloadJob.promise;
      
      // CRITICAL: Clear native job ref immediately after it settles
      delete downloadResumableRef.current[item.id];
      
      // Check for interruption early
      if (isCancelledRef.current[item.id] || isPausedRef.current[item.id]) {
        return;
      }

      if (downloadResult.statusCode >= 400 && downloadResult.statusCode !== 206) {
        throw new Error(`Server returned status code ${downloadResult.statusCode}`);
      }

      // If we used a temp file for resume, append it and delete temp
      if (resumeOffset > 0 && await RNFS.exists(targetPath)) {
        console.log('Appending resumed chunk safely...');
        const CHUNK_SIZE = 1024 * 256; // 256KB chunks
        const stat = await RNFS.stat(targetPath);
        let bytesRead = 0;
        
        while (bytesRead < stat.size) {
          // Check BEFORE every single bridge call
          if (isCancelledRef.current[item.id] || isPausedRef.current[item.id]) break;

          const length = Math.min(CHUNK_SIZE, stat.size - bytesRead);
          const chunk = await RNFS.read(targetPath, length, bytesRead, 'base64');
  
          if (isCancelledRef.current[item.id] || isPausedRef.current[item.id]) break;
          await RNFS.appendFile(downloadedFilePath, chunk, 'base64');
  
          bytesRead += length;
        }
        // Delete the temp file ONLY if we weren't interrupted
        if (!isCancelledRef.current[item.id] && !isPausedRef.current[item.id]) {
          await RNFS.unlink(targetPath);
        }
      }
      
      if (isCancelledRef.current[item.id] || isPausedRef.current[item.id]) return;

      // Transition to EXTRACTING state
      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'EXTRACTING', progress: 99.5 } : d));

      let indexHtmlPath: string | undefined;
      let unzippedPath: string | undefined;
      
      if (isZip) {
        const extractedPath = await unzipFile(`file://${downloadedFilePath}`, item.id);
        
        if (isCancelledRef.current[item.id] || isPausedRef.current[item.id]) {
          // Cleanup unzipped stuff if stopped mid-way
          return;
        }

        if (extractedPath) {
          indexHtmlPath = extractedPath;
          unzippedPath = extractedPath.includes('/') ? extractedPath.split('/').slice(0, -1).join('/') : extractedPath;
        }
      }
      
      setDownloads(prev =>
        prev.map(d =>
          d.id === item.id ? {
            ...d,
            status: 'DOWNLOADED',
            progress: 100,
            localUri: `file://${downloadedFilePath}`,
            isZip,
            unzippedPath,
            indexHtmlPath,
            jobId: undefined,
            isResumedDownload: false,
          } : d
        )
      );
    } catch (error: any) {
      const wasUserPaused = isPausedRef.current[item.id];
      const wasUserCancelled = isCancelledRef.current[item.id];

      if (wasUserCancelled) {
        console.log('Download was cancelled by user (Graceful)');
        setDownloads(prev => prev.map(d => d.id === item.id ? { 
          ...d, 
          status: 'NOT_DOWNLOADED', 
          progress: 0, 
          jobId: undefined, 
          downloadedBytes: 0,
          isResumedDownload: false
        } : d));
        
        // Final cleanup of files if necessary
        cleanUpFiles(item.id, item.downloadUrl);
      } else if (wasUserPaused) {
        console.log('Download was paused by user (Graceful)');
        setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'PAUSED', jobId: undefined } : d));
      } else {
        console.error('===== DOWNLOAD FAILED =====', error);
        setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'FAILED', jobId: undefined } : d));
        
        const ignoredMessages = ['Download has been stopped', 'Download has been aborted'];
        if (!ignoredMessages.includes(error?.message)) {
          Alert.alert('Download Error', error?.message || 'Failed to download for offline viewing.');
        }
      }
    } finally {
      setDownloading(null);
      setTimeout(() => {
        delete downloadResumableRef.current[item.id];
        delete isPausedRef.current[item.id];
        delete isCancelledRef.current[item.id];
      }, 500);
    }
  };

  const cleanUpFiles = async (itemId: string, downloadUrl: string) => {
    const downloadsDir = `${RNFS.CachesDirectoryPath}/downloads`;
    const isZip = isZipFile(downloadUrl);
    const fileName = `tour_${itemId}.${isZip ? 'zip' : 'file'}`;
    const downloadedFilePath = `${downloadsDir}/${fileName}`;
    if (await RNFS.exists(downloadedFilePath)) {
      await RNFS.unlink(downloadedFilePath);
    }
    if (await RNFS.exists(`${downloadedFilePath}.tmp`)) {
      await RNFS.unlink(`${downloadedFilePath}.tmp`);
    }
    const unzipDir = `${RNFS.CachesDirectoryPath}/unzipped_${itemId}`;
    if (await RNFS.exists(unzipDir)) {
      await RNFS.unlink(unzipDir);
    }
  };

  const handlePauseDownload = useCallback((itemId: string) => {
    isPausedRef.current[itemId] = true;
    const job = downloadResumableRef.current[itemId];
    const item = downloads.find(d => d.id === itemId);
    const isExtracting = item?.status === 'EXTRACTING';
    
    if (job && !isExtracting) {
      console.log('Requesting pause for:', itemId, 'Job ID:', job.jobId);
      // Use a try-catch and check jobId existence
      try {
        if (job.jobId !== undefined && job.jobId !== null) {
          RNFS.stopDownload(job.jobId);
          console.log('Native stopDownload called for ID:', job.jobId);
        }
      } catch (err) {
        console.log('Native stopDownload failed or already stopped:', err);
      }
    } else {
      console.log('No active job to pause or already extracting for:', itemId);
      // If already extracting or no job, we just mark it as paused for state sync
      setDownloads(prev => prev.map(d => d.id === itemId ? { ...d, status: 'PAUSED', jobId: undefined } : d));
    }
  }, [downloads]);



  const handleResumeDownload = (item: DownloadItem) => {
    handleDownload(item, true, true);
  };

  const handleRetryDownload = (item: DownloadItem) => {
    handleDownload(item, true, false);
  };

  const cancelDownload = async (itemId: string) => {
    isCancelledRef.current[itemId] = true;
    const job = downloadResumableRef.current[itemId];
    console.log('Requesting cancel for:', itemId, 'Job ID:', job?.jobId);

    if (job) {
      try {
        if (job.jobId !== undefined && job.jobId !== null) {
          RNFS.stopDownload(job.jobId);
          console.log('Native stopDownload called during cancel for ID:', job.jobId);
        }
      } catch (err) {
        console.warn('Error calling stopDownload during cancel:', err);
      }
    }

    // Always perform cleanup and state update on cancel
    const item = downloads.find(d => d.id === itemId);
    if (item) {
      await cleanUpFiles(itemId, item.downloadUrl);
      setDownloads(prev => prev.map(d => 
        d.id === itemId ? { ...d, status: 'NOT_DOWNLOADED', progress: 0, downloadedBytes: 0, jobId: undefined } : d
      ));
    }
    
    setDownloading(null);
  };

  const handleClearCache = async () => {
    try {
      const downloadsDir = `${RNFS.CachesDirectoryPath}/downloads`;
      if (await RNFS.exists(downloadsDir)) {
        const files = await RNFS.readDir(downloadsDir);
        for (const file of files) {
          if (file.name.endsWith('.tmp') || file.name.endsWith('.file')) {
            await RNFS.unlink(file.path);
          }
        }
      }
      Alert.alert('Success', 'Temporary cache cleared.');
    } catch (error) {
      console.error('Clear cache error:', error);
      Alert.alert('Error', 'Failed to clear cache.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to remove all offline content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            for (const item of downloads) {
              if (item.status === 'DOWNLOADED') {
                await performDelete(item);
              }
            }
          }
        }
      ]
    );
  };

  const performDelete = async (item: DownloadItem) => {
    try {
      if (Platform.OS !== 'web') {
        if (item.localUri) {
          const path = item.localUri.replace('file://', '');
          if (await RNFS.exists(path)) await RNFS.unlink(path);
        }
        if (item.unzippedPath) {
          const path = item.unzippedPath.replace('file://', '');
          if (await RNFS.exists(path)) await RNFS.unlink(path);
        }
      }
      setDownloads(prev =>
        prev.map(d =>
          d.id === item.id ? {
            ...d,
            status: 'NOT_DOWNLOADED',
            localUri: undefined,
            unzippedPath: undefined,
            indexHtmlPath: undefined,
            progress: 0
          } : d
        )
      );
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDelete = async (item: DownloadItem) => {
    Alert.alert(
      'Delete Offline Content',
      'Are you sure you want to delete this tour from your device? You can re-download it anytime for offline viewing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(item),
        },
      ]
    );
  };

  const handleOpenVirtualTour = useCallback(async (item: DownloadItem) => {
    if (item.indexHtmlPath) {
      console.log('Opening virtual tour:', item.indexHtmlPath);
      
      if (Platform.OS !== 'web' && item.unzippedPath) {
        try {
          await stopServer();
          
          const path = item.unzippedPath.replace('file://', '');
          console.log('Starting static server for path:', path);
          
          const server = new StaticServer({ port: 0, fileDir: path, stopInBackground: false });
          const url = await server.start();
          serverRef.current = server;
          
          const fileName = item.indexHtmlPath.split('/').pop() || 'index.html';
          const fullServerUrl = `${url}/${fileName}`;
          
          console.log('Static server started at:', fullServerUrl);
          setServerUrl(fullServerUrl);
        } catch (error) {
          console.error('Failed to start static server:', error);
          setServerUrl(null);
        }
      }
      
      setShowVirtualTour(item.indexHtmlPath);
    } else {
      Alert.alert('Error', 'Virtual tour files not found. Please re-download.');
    }
  }, [stopServer]);

  const handleCloseVirtualTour = useCallback(() => {
    setShowVirtualTour(null);
    if (Platform.OS !== 'web') {
      stopServer();
    }
  }, [stopServer]);

  const handleOpenItem = useCallback((item: DownloadItem) => {
    console.log('Opening item:', item.title || item.id, 'Status:', item.status);
    
    if (item.status !== 'DOWNLOADED') {
      Alert.alert('Not Downloaded', 'Please download for offline viewing first.');
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
            <Text style={styles.subtitle}>Offline content</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 15, alignItems: 'flex-end' }}>
              <Text style={[styles.helperText, { marginBottom: 0 }]}>Offline Content Storage</Text>
              <Text style={[styles.itemTitle, { fontSize: 14 }]}>
                {(totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.helperText}>Manage your offline content</Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={handleClearCache}>
              <Text style={{ color: colors.accent, fontWeight: 'bold' }}>Clear Cache</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={{ color: '#FF4444', fontWeight: 'bold' }}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {downloadsQuery.isLoading && (
            <Text style={styles.loadingText}>Loading offline content...</Text>
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
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: thumbnailUri }}
                    style={styles.downloadImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error('Image load error for:', thumbnailUri, error.nativeEvent);
                    }}
                  />
                  
                  {item.status === 'DOWNLOADING' || item.status === 'EXTRACTING' || item.status === 'PAUSED' ? (
                    <View style={styles.downloadingOverlay}>
                      {item.status === 'DOWNLOADING' ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                      ) : item.status === 'EXTRACTING' ? (
                        <ActivityIndicator size="large" color={colors.accent} />
                      ) : (
                        <Pause size={48} color="#FFFFFF" />
                      )}
                      <Text style={styles.downloadingText}>
                        {item.status === 'PAUSED' 
                          ? 'Download Paused' 
                          : item.status === 'EXTRACTING'
                            ? 'Processing...'
                            : item.progress > 0 
                              ? `Downloading... ${item.progress}%`
                              : 'Preparing...'}
                      </Text>
                      {item.downloadedBytes !== undefined && item.fileSize && (
                        <Text style={[styles.downloadingText, { fontSize: 12, marginTop: 4 }]}>
                          {(item.downloadedBytes / (1024 * 1024)).toFixed(1)}MB / {(item.fileSize / (1024 * 1024)).toFixed(1)}MB
                        </Text>
                      )}
                    </View>
                  ) : item.status === 'DOWNLOADED' ? (
                    <View style={styles.statusBadge}>
                      <CheckCircle2 size={12} color="#4CAF50" />
                      <Text style={styles.statusBadgeText}>Offline ready</Text>
                    </View>
                  ) : item.status === 'UPDATE_AVAILABLE' ? (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 136, 0, 0.2)' }]}>
                      <RefreshCw size={12} color="#FF8800" />
                      <Text style={[styles.statusBadgeText, { color: '#FF8800' }]}>Update Available</Text>
                    </View>
                  ) : null}
                </View>
                
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
                  {item.status === 'NOT_DOWNLOADED' ? (
                    <TouchableOpacity
                      style={[styles.iconButton, styles.downloadButton]}
                      onPress={() => handleDownload(item)}
                      disabled={downloading !== null && downloading !== item.id}
                    >
                      <Download size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : item.status === 'UPDATE_AVAILABLE' ? (
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: colors.accent }]}
                      onPress={() => handleRetryDownload(item)}
                    >
                      <RefreshCw size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : item.status === 'FAILED' ? (
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: '#FF8800' }]}
                      onPress={() => handleRetryDownload(item)}
                    >
                      <RotateCcw size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : item.status === 'DOWNLOADING' || item.status === 'EXTRACTING' ? (
                    <View style={{ flexDirection: 'row' }}>
                      {item.status === 'DOWNLOADING' && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.accent, marginRight: 8 }]}
                          onPress={() => handlePauseDownload(item.id)}
                        >
                          <Pause size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#FF4444' }]}
                        onPress={() => cancelDownload(item.id)}
                      >
                        <X size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : item.status === 'PAUSED' ? (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.accent, marginRight: 8 }]}
                        onPress={() => handleResumeDownload(item)}
                      >
                        <Play size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#FF4444' }]}
                        onPress={() => cancelDownload(item.id)}
                      >
                        <X size={22} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : item.status === 'DOWNLOADED' ? (
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
                  ) : null}
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
              onPress={handleCloseVirtualTour}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {showVirtualTour && (() => {
            const fileUri = showVirtualTour.startsWith('file://') ? showVirtualTour : `file://${showVirtualTour}`;
            const parentDirectory = fileUri.substring(0, fileUri.lastIndexOf('/'));
            
            return (
              <WebView
                source={{
                  uri: serverUrl || fileUri,
                  ...(Platform.OS === 'ios' && !serverUrl && { allowingReadAccessToURL: parentDirectory }),
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

      {/* Download Confirmation Modal */}
      <Modal
        visible={showConfirmModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download for Offline Viewing</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.label, { marginBottom: 15 }]}>
                {showConfirmModal?.title || 'This virtual tour'}
              </Text>
              
              <View style={{ backgroundColor: colors.background, padding: 15, borderRadius: 8, marginBottom: 20 }}>
                {showConfirmModal?.fileSize && (
                  <Text style={[styles.infoText, { color: colors.text, fontWeight: 'bold' }]}>
                    Size: ~{(showConfirmModal.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </Text>
                )}
                <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 5 }]}>
                  • Wi-Fi connection is recommended for large downloads.
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 5 }]}>
                  • Content will be stored locally and can be deleted anytime to free up space.
                </Text>
                
                {!isWifi && (
                  <View style={{ marginTop: 15, padding: 10, backgroundColor: 'rgba(255, 165, 0, 0.1)', borderRadius: 4 }}>
                    <Text style={{ color: '#FFA500', fontSize: 12, fontWeight: 'bold' }}>
                      You are currently on a cellular network.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => setShowConfirmModal(null)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent, flex: 2 }]}
                onPress={() => {
                  if (showConfirmModal) {
                    handleDownload(showConfirmModal, true);
                    setShowConfirmModal(null);
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {isWifi ? 'Download for offline viewing' : 'Download anyway'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: isTablet ? 300 : 220,
    overflow: 'hidden',
  },
  downloadImage: {
    width: '100%',
    height: '100%',
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
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
  statusBadge: {
    position: 'absolute' as const,
    top: GeckoTheme.spacing.md,
    left: GeckoTheme.spacing.md,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#4CAF50',
    textTransform: 'uppercase' as const,
  },
});
