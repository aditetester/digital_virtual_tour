import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

type DeviceType = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const isSmallPhone = width < 375;

  const deviceType: DeviceType = isLargeTablet ? 'desktop' : isTablet ? 'tablet' : 'phone';

  const numColumns = isLargeTablet ? 4 : isTablet ? 3 : 2;
  const cardWidth = (width - (numColumns + 1) * 16) / numColumns;

  const contentMaxWidth = isTablet ? 1200 : width;
  const sidebarWidth = isLargeTablet ? 280 : isTablet ? 240 : 0;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isSmallPhone,
    deviceType,
    numColumns,
    cardWidth,
    contentMaxWidth,
    sidebarWidth,
    isLandscape: width > height,
  };
}
