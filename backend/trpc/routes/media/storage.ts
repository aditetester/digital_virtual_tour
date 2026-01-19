export type MediaItem = {
  id: string;
  type: 'tour' | 'photo' | 'video' | 'document' | 'presentation' | 'screenshot' | 'email-banner';
  title: string;
  thumbnail: string;
  url: string;
  size?: string;
  tags: string[];
};

export class MediaStorage {
  private static items: MediaItem[] = [
    {
      id: '1',
      type: 'tour',
      title: 'Grand Ballroom 360°',
      thumbnail: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
      url: 'https://geckodigital.co/vt/PatinaMaldives',
      size: '125 MB',
      tags: ['Virtual Tour', 'Ballroom'],
    },
    {
      id: '2',
      type: 'photo',
      title: 'Presidential Suite',
      thumbnail: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      tags: ['Suite', 'Luxury'],
    },
    {
      id: '3',
      type: 'video',
      title: 'Hotel Walkthrough',
      thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      size: '45 MB',
      tags: ['Video', 'Overview'],
    },
    {
      id: '4',
      type: 'photo',
      title: 'Spa Facilities',
      thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      tags: ['Spa', 'Wellness'],
    },
    {
      id: '5',
      type: 'document',
      title: 'Hotel Brochure 2025',
      thumbnail: '',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: '2.5 MB',
      tags: ['Brochure', 'Sales'],
    },
    {
      id: '6',
      type: 'photo',
      title: 'Restaurant View',
      thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      tags: ['Restaurant', 'Dining'],
    },
    {
      id: '7',
      type: 'presentation',
      title: 'Q1 Sales Presentation',
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
      url: 'https://docs.google.com/presentation/d/e/2PACX-1vS_gY-mI7_z-jJ0nQW9p6z6qX_X-7p8_X8_X8/embed',
      size: '12 MB',
      tags: ['Sales', 'Presentation'],
    },
    {
      id: '8',
      type: 'screenshot',
      title: 'Dashboard Preview',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      tags: ['Analytics', 'Screenshot'],
    },
    {
      id: '9',
      type: 'email-banner',
      title: 'Summer Event Banner',
      thumbnail: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=400',
      url: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=800',
      tags: ['Marketing', 'Email'],
    },
    {
      id: '10',
      type: 'presentation',
      title: 'Design Language System',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
      url: 'https://docs.google.com/presentation/d/e/2PACX-1vS_gY-mI7_z-jJ0nQW9p6z6qX_X-7p8_X8_X8/embed',
      size: '15 MB',
      tags: ['Design', 'Internal'],
    },
    {
      id: '11',
      type: 'screenshot',
      title: 'Mobile App Layout',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
      url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      tags: ['Mobile', 'App'],
    },
    {
      id: '12',
      type: 'email-banner',
      title: 'Newsletter Header v2',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      tags: ['Newsletter', 'Marketing'],
    },
  ];

  static getAll(): MediaItem[] {
    return this.items;
  }

  static getByType(type: MediaItem['type']): MediaItem[] {
    return this.items.filter(item => item.type === type);
  }
}
