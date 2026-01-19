export type Proposal = {
  id: string;
  title: string;
  tourName: string;
  duration: string;
  createdAt: string;
  thumbnail: string;
};

export class ProposalStorage {
  private static items: Proposal[] = [
    {
      id: '1',
      title: 'Grand Ballroom Proposal',
      tourName: 'Grand Ballroom Virtual Tour',
      duration: '2:45',
      createdAt: '2025-01-15',
      thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f29da8c2b4?w=400',
    },
    {
      id: '2',
      title: 'Presidential Suite Walkthrough',
      tourName: 'Presidential Suite 360°',
      duration: '3:20',
      createdAt: '2025-01-12',
      thumbnail: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
    },
  ];

  static getAll(): Proposal[] {
    return this.items;
  }
}
