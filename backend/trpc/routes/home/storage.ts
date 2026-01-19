export type NewsfeedItem = {
  id: string;
  type: 'article' | 'video' | 'showcase';
  image: string;
  images?: string[];
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  date: string;
  virtualTourUrl?: string;
};

export class HomeStorage {
  private static items: NewsfeedItem[] = [
    {
      id: '1',
      type: 'showcase',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      title: 'Luxury Resort Virtual Tour Launch',
      description: 'Experience the new immersive 360° tour of Paradise Bay Resort',
      fullDescription: 'Experience the new immersive 360° tour of Paradise Bay Resort. Dive into crystal-clear waters, explore pristine beaches, and discover luxury accommodations like never before. Our cutting-edge virtual tour technology brings you closer to paradise, allowing you to explore every corner of this stunning resort from the comfort of your home. Navigate through beautifully designed rooms, walk along sun-kissed beaches, and immerse yourself in the breathtaking natural beauty of the Maldives. This interactive experience showcases the finest details of resort living, from elegant interiors to spectacular ocean views.',
      category: 'Showcase',
      date: '2 days ago',
      virtualTourUrl: 'https://geckodigital.co/vt/PatinaMaldives',
    },
    {
      id: '2',
      type: 'article',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      ],
      title: 'Behind the Scenes: Hotel Photography',
      description: 'See how we capture stunning hotel interiors for virtual tours',
      fullDescription: 'See how we capture stunning hotel interiors for virtual tours. Our photography team uses state-of-the-art equipment and techniques to showcase properties in their best light. From pre-dawn setups to carefully orchestrated lighting arrangements, every shot is meticulously planned. We employ advanced HDR technology and professional-grade cameras to capture the true essence of each space. Our photographers work closely with interior designers and property managers to highlight unique features and create compelling visual narratives. The process involves multiple angles, perfect timing, and post-processing expertise to deliver images that truly represent the luxury and comfort of each property.',
      category: 'Behind the Scenes',
      date: '1 week ago',
    },
    {
      id: '3',
      type: 'video',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      title: 'New Partnership Announcement',
      description: 'Gecko Digital partners with 5-star boutique hotels',
      fullDescription: 'Gecko Digital partners with 5-star boutique hotels across the Asia-Pacific region. This strategic partnership marks a significant milestone in our mission to revolutionize the hospitality industry through innovative virtual tour technology. We are excited to bring our expertise in immersive digital experiences to some of the most prestigious properties in the region. This collaboration will enable these boutique hotels to showcase their unique character and exceptional service to a global audience. Together, we will create compelling virtual experiences that drive bookings and elevate brand presence in the competitive luxury hospitality market.',
      category: 'Partnership',
      date: '2 weeks ago',
    },
    {
      id: '4',
      type: 'article',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      title: 'Industry Trends in Virtual Reality',
      description: 'Latest developments in VR technology for hospitality',
      fullDescription: 'Latest developments in VR technology for hospitality are transforming how travelers discover and book their dream destinations. The integration of AI-powered recommendations with immersive virtual tours creates personalized experiences that resonate with modern consumers. Hotels are increasingly adopting these technologies to stand out in a crowded market. From virtual concierge services to pre-arrival room tours, the applications are endless. Industry experts predict that VR will become a standard tool in hospitality marketing within the next few years, fundamentally changing how properties connect with potential guests.',
      category: 'News',
      date: '3 weeks ago',
    },
  ];

  static getNewsfeed(): NewsfeedItem[] {
    return this.items;
  }
}
